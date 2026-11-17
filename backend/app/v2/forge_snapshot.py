"""Validate an explicitly imported Bitbucket report without asserting signer provenance."""

import json
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator


Revision = Annotated[str, StringConstraints(pattern=r"^[a-fA-F0-9]{12,40}$")]
Issue = Annotated[str, StringConstraints(pattern=r"^[A-Z][A-Z0-9]{1,29}-[1-9]\d{0,9}$")]
Note = Annotated[str, StringConstraints(max_length=300)]
Outcome = Literal["pass", "fail", "unavailable"]


class Assertion(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=80)
    file: str = Field(min_length=1, max_length=160)
    pointer: str = Field(max_length=160)
    base: Outcome
    head: Outcome


class StaticFinding(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Literal["static", "hypothesis"]
    severity: Literal["high", "medium", "low"]
    rule: str = Field(max_length=80)
    path: str = Field(max_length=240)
    line: int | None = Field(ge=1)
    message: Note


class ForgeSnapshot(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal["aegispr.snapshot.v1"] = Field(alias="schema")
    pull_request: int = Field(alias="pullRequest", ge=1, le=9_007_199_254_740_991)
    repository: str = Field(pattern=r"^\{[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}\}$")
    base: Revision
    head: Revision
    linked_issues: list[Issue] = Field(alias="linkedIssues", max_length=8)
    analyzed_at: datetime = Field(alias="analyzedAt")
    verdict: Literal[
        "confirmed-regression", "no-regression-in-executed-checks",
        "potential-issue", "inconclusive", "verification-unavailable",
    ]
    evidence: list[Assertion] = Field(max_length=12)
    findings: list[StaticFinding] = Field(max_length=20)
    notes: list[Note] = Field(max_length=10)

    @model_validator(mode="after")
    def validate_outcomes(self):
        regression = any(check.base == "pass" and check.head == "fail" for check in self.evidence)
        passed = bool(self.evidence) and all(check.base == check.head == "pass" for check in self.evidence)
        if regression != (self.verdict == "confirmed-regression"):
            raise ValueError("Regression verdict disagrees with the listed assertions")
        if passed != (self.verdict == "no-regression-in-executed-checks"):
            raise ValueError("Passing verdict disagrees with the listed assertions")
        if self.analyzed_at.tzinfo is None:
            raise ValueError("Analysis time must include its timezone")
        if len(json.dumps(self.model_dump(mode="json", by_alias=True), ensure_ascii=False).encode()) > 24_000:
            raise ValueError("Snapshot exceeds 24 KB")
        return self
