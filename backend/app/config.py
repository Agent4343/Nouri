from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://nouri:nouri@localhost:5432/nouri"
    cors_origins: str = "*"
    port: int = 8000

    # Claude vision. Empty key → fall back to mock vision; never crash.
    anthropic_api_key: str = ""
    vision_model: str = "claude-sonnet-4-6"

    # Photo storage. In production this is mounted to a Railway volume at /data/photos.
    photo_dir: str = "/tmp/nouri-photos"
    photo_max_bytes: int = 8 * 1024 * 1024  # 8MB upload cap

    # Web push reminders. VAPID keys are generated on first boot if these aren't
    # set, and persisted to {photo_dir}/../vapid.json so they're stable across
    # restarts. vapid_subject is the contact mailto: that browsers display.
    vapid_subject: str = "mailto:hello@nouri.app"

    # Magic-link auth. AUTH_SECRET is auto-generated and persisted to disk on
    # first boot if not set in the env (same pattern as VAPID). RESEND_API_KEY
    # is optional — without it the magic link is logged to stdout (dev mode).
    auth_secret: str = ""
    resend_api_key: str = ""
    email_from: str = "Nouri <hello@nouri.app>"
    # Public URL where the web frontend is served — embedded in the magic
    # link emails so the user lands on the right host.
    public_web_url: str = "http://localhost:3000"

    # Error monitoring. If unset, Sentry is silently disabled.
    sentry_dsn: str = ""
    sentry_environment: str = "production"

    # Admin stats endpoint. If unset, /admin/stats returns 403 (disabled).
    admin_key: str = ""

    def model_post_init(self, __context: object) -> None:
        # Strip whitespace from any env-pasted value. Railway's UI has bitten us
        # repeatedly by preserving trailing newlines on copy-paste — they break
        # HTTP headers (illegal header value) and Postgres connection strings
        # (database name parsing). Treat the boundary defensively.
        for field in (
            "database_url",
            "cors_origins",
            "anthropic_api_key",
            "vision_model",
            "photo_dir",
            "vapid_subject",
            "auth_secret",
            "resend_api_key",
            "email_from",
            "public_web_url",
            "sentry_dsn",
            "sentry_environment",
            "admin_key",
        ):
            v = getattr(self, field, None)
            if isinstance(v, str):
                object.__setattr__(self, field, v.strip())

    @property
    def async_database_url(self) -> str:
        url = self.database_url  # already stripped in model_post_init
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        return url


settings = Settings()
