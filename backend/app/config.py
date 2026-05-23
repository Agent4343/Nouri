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

    @property
    def async_database_url(self) -> str:
        # Strip whitespace — copy-paste in Railway's web UI can sneak in a
        # trailing newline, which Postgres then sees as part of the db name.
        url = self.database_url.strip()
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        return url


settings = Settings()
