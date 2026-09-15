from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

##configuration for the appliication, including database connections, API prefixes, and other settings.
class Settings(BaseSettings):
    APP_NAME: str = "CodeSpec AI"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    REDIS_URL: str = "redis://localhost:6379/0"

    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USERNAME: str = "neo4j"
    NEO4J_PASSWORD: str = "password123"

    REPO_WORKSPACE_DIR: str = str(Path("/tmp/codespec_repos"))

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()