from pathlib import Path
import re
from pydantic import Field
from pydantic import field_validator
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

    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str | None = None
    QDRANT_COLLECTION: str = "codespec_chunks"
    QDRANT_VECTOR_SIZE: int = Field(default=1024, ge=1)
    QDRANT_TIMEOUT_SECONDS: float = Field(default=10.0, gt=0)

    EMBEDDING_MODEL_PATH: str = "BAAI/bge-m3"
    EMBEDDING_LOCAL_FILES_ONLY: bool = True
    EMBEDDING_DEVICE: str = "cpu"
    EMBEDDING_CACHE_DIR: str = "./workspace/model-cache"
    EMBEDDING_BATCH_SIZE: int = Field(default=8, ge=1, le=128)
    EMBEDDING_MAX_LENGTH: int = Field(default=1024, ge=16, le=8192)

    INDEX_MAX_CHUNK_CHARS: int = Field(default=1800, ge=100, le=20000)
    INDEX_CHUNK_OVERLAP_LINES: int = Field(default=2, ge=0, le=100)
    INDEX_MIN_CHUNK_CHARS: int = Field(default=20, ge=0)
    INDEX_MAX_FILE_BYTES: int = Field(default=2_000_000, ge=1)
    INDEX_BATCH_SIZE: int = Field(default=16, ge=1, le=256)
    INDEX_TOP_K: int = Field(default=8, ge=1, le=50)
    INDEX_SCORE_THRESHOLD: float = Field(default=0.0, ge=0, le=1)
    INDEX_MAX_CONTEXT_CHARS: int = Field(default=12000, ge=100, le=200000)
    IMPACT_MAX_DEPTH: int = Field(default=3, ge=1, le=8)
    IMPACT_MAX_RESULTS: int = Field(default=200, ge=1, le=1000)
    INDEX_LOCK_TIMEOUT_SECONDS: int = Field(default=3600, ge=60)
    INDEX_LOCK_WAIT_SECONDS: int = Field(default=30, ge=1, le=300)

    @field_validator("EMBEDDING_DEVICE")
    @classmethod
    def validate_embedding_device(cls, value: str) -> str:
        if value != "auto" and value != "cpu" and not re.fullmatch(r"cuda(?::\d+)?", value):
            raise ValueError("EMBEDDING_DEVICE must be cpu, auto, or cuda[:index]")
        return value

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()