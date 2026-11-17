from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    allowed_origins: str = "http://localhost:3300,http://127.0.0.1:3300"
    data_path: Path = Path("data/aegispr.sqlite3")
    api_access_token: str | None = Field(default=None, repr=False, min_length=16)
    github_token: str | None = Field(default=None, repr=False)
    github_webhook_secret: str | None = Field(default=None, repr=False)
    github_app_id: str | None = None
    github_app_private_key_path: Path | None = Field(default=None, repr=False)
    github_installation_ids: str = ""
    github_publish_enabled: bool = False

    max_changed_files: int = Field(default=100, ge=1, le=100)
    max_diff_characters: int = Field(default=120_000, ge=1000, le=120_000)
    v2_allowed_repositories: str = ""
    v2_signing_key_path: Path = Path("data/v3-signing-key.pem")
    v2_daily_reviews: int = Field(default=100, ge=1, le=1000)
    v2_public_utilization: bool = False
    v2_runtime_label: str = Field(default="Self-hosted CPU", max_length=80)
    gpu_worker_url: str | None = None
    gpu_worker_token: str | None = Field(default=None, repr=False)
    v2_worker_url: str | None = None
    v2_worker_token: str | None = Field(default=None, repr=False)
    v2_worker_public_key: str | None = None
    v2_enable_models: bool = False
    v2_budget_usd: str = "1"
    v2_run_budget_usd: str = "0.03"
    v2_max_calls: int = Field(default=3, ge=1, le=3)
    nebius_api_key: str | None = Field(default=None, repr=False)
    vultr_api_key: str | None = Field(default=None, repr=False)

    @property
    def origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def check_operator_access(self):
        if self.app_env == "production" and not self.api_access_token:
            raise ValueError("Set an owner access code before starting a public deployment.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
