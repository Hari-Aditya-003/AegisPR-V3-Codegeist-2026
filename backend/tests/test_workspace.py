from __future__ import annotations

import asyncio
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.v2.api import create_app
from app.v2.evidence import ReceiptSigner
from app.v2.models import validate_model_output


@pytest.fixture
def workspace(tmp_path: Path):
    app = create_app(Settings(
        app_env="production", api_access_token="test-operator-code-2026",
        data_path=tmp_path / "reviews.sqlite3", v2_signing_key_path=tmp_path / "evidence.pem",
    ))
    return app, TestClient(app), {"Authorization": "Bearer test-operator-code-2026"}


def test_fixture_execution_repair_receipt_and_sarif(workspace):
    _, client, _ = workspace
    assert len(client.get("/api/v2/demo").json()) == 12
    created = client.post("/api/v2/demo", json={"fixture_id": "py-coupon-floor"})
    assert created.status_code == 202
    path = "/api/v2/demo/" + created.json()["id"]
    run = client.get(path).json()
    assert run["status"] == "REGRESSION_FOUND"
    assert [row["status"] for row in run["executions"]] == ["pass"] * 3 + ["fail"] * 3
    assert run["cost"]["calls"] == 0
    receipt = run["receipt"]
    key = client.get("/api/v2/public-key").json()["public_key"]
    assert ReceiptSigner.verify(receipt, key)
    assert client.post("/api/v2/verify-receipt", json=receipt).json()["verified"] is True
    assert client.get(path + "/sarif").json()["version"] == "2.1.0"
    repair = client.post(path + "/repair", json={}).json()
    assert repair["repair"]["status"] == "FIX_VERIFIED"
    assert repair["repair"]["previous_receipt_sha256"] == receipt["sha256"]
    assert len(repair["repair"]["checks"]) == 3
    assert ReceiptSigner.verify(repair["receipt"], key)
    assert client.post("/api/v2/demo", json={"fixture_id": "other"}).status_code == 422
    assert client.post("/api/v2/demo", json={"fixture_id": "py-coupon-floor", "command": "invalid"}).status_code == 422


def test_node_and_intended_change_fixture_outcomes(workspace):
    _, client, _ = workspace
    for fixture, expected in [
        ("js-list-boundary", "REGRESSION_FOUND"),
        ("js-sort-order", "BEHAVIOR_CHANGE_INTENT_UNKNOWN"),
        ("py-refactor", "VERIFIED_WITHIN_SCOPE"),
    ]:
        queued = client.post("/api/v2/demo", json={"fixture_id": fixture}).json()
        run = client.get("/api/v2/demo/" + queued["id"]).json()
        assert run["status"] == expected
        assert len(run["executions"]) == 6


def test_benchmark_persists_real_runs(workspace):
    _, client, headers = workspace
    assert client.get("/api/v2/benchmarks", headers=headers).json() == []
    response = client.post("/api/v2/benchmarks/job", json={"repeats": 1}, headers=headers)
    assert response.status_code == 202
    job = client.get("/api/v2/benchmarks/job", headers=headers).json()
    report = client.get("/api/v2/benchmarks", headers=headers).json()[0]
    assert job["report_id"] == report["id"]
    assert job["status"] == "completed"
    assert job["completed"] == job["total"] == 12
    assert report["metrics"]["true_positives"] == 8
    assert report["metrics"]["abstentions"] == 3
    assert report["cost_usd"] == 0
    assert all(
        len(client.get(f"/api/v2/reviews/{row['run_id']}", headers=headers).json()["executions"]) == 6
        for row in report["raw"]
    )


def test_private_policy_and_snapshot_import(workspace):
    _, client, headers = workspace
    snapshot = {
        "schema": "aegispr.snapshot.v1",
        "pullRequest": 1,
        "repository": "{12345678-1234-4321-a123-123456789012}",
        "base": "ab" * 6,
        "head": "cd" * 6,
        "linkedIssues": ["DEMO-1"],
        "analyzedAt": "2026-11-17T00:05:00+05:30",
        "verdict": "confirmed-regression",
        "evidence": [{"name": "Coupon", "file": "quote.json", "pointer": "/total", "base": "pass", "head": "fail"}],
        "findings": [],
        "notes": [],
    }
    route = "/api/v2/forge-snapshots"
    assert client.post(route, json=snapshot).status_code == 401
    assert client.post(route, json={**snapshot, "verdict": "inconclusive"}, headers=headers).status_code == 422
    accepted = client.post(route, json=snapshot, headers=headers)
    assert accepted.status_code == 201
    record = accepted.json()
    assert record["status"] == "IMPORTED_SNAPSHOT"
    assert record["forge_snapshot"]["evidence"][0]["head"] == "fail"
    assert record["executions"] == []
    assert client.get("/api/v2/demo/" + record["id"]).status_code == 404
    assert client.get("/api/v2/reviews").status_code == 401
    assert client.get("/api/v2/reviews/" + record["id"], headers=headers).json()["receipt"]
    assert client.post("/api/v2/reviews/" + record["id"] + "/repair", json={}, headers=headers).status_code == 409


def test_model_guidance_is_bounded_and_requires_consent(workspace):
    app, client, headers = workspace
    assert client.get("/api/v2/config", headers=headers).json()["enabled"] is False
    response = client.post("/api/v2/reviews", headers=headers, json={
        "mode": "fixture", "fixture_id": "py-coupon-floor", "use_models": True,
    })
    assert response.status_code == 422
    with pytest.raises(ValueError, match="disabled"):
        asyncio.run(app.state.reviews.gateway.review("test", "triage", "", [], allow_external=True))
    advice = {"advice": "add-tests", "evidence_ids": ["E-1"], "file": "target.py", "line": 2}
    with pytest.raises(ValueError, match="JSON object"):
        validate_model_output([], ["E-1"])
    output = validate_model_output({"findings": [advice]}, ["E-1"], {"target.py": {2}})
    assert output["findings"][0]["claim"] == "Add a regression test for the documented behavior."
    with pytest.raises(ValueError, match="position"):
        validate_model_output({"findings": [advice]}, ["E-1"], {"target.py": {3}})
    with pytest.raises(ValueError):
        validate_model_output({"findings": [{**advice, "advice": "unknown"}]}, ["E-1"], {"target.py": {2}})


def test_unapproved_github_repo_is_rejected_before_network_access(workspace):
    _, client, headers = workspace
    queued = client.post("/api/v2/reviews", headers=headers, json={
        "mode": "pr", "pull_request_url": "https://github.com/sample/example/pull/1",
        "base_sha": "a" * 40, "head_sha": "b" * 40,
    })
    assert queued.status_code == 422
    assert "allowlist" in queued.json()["detail"]
