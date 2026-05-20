from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://nouri:nouri@localhost:5432/nouri"
    cors_origins: str = "*"
    port: int = 8000

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
