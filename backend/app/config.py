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

    # Vector store settings
    VECTOR_STORE_PROVIDER: str = "neo4j"  # "neo4j" or "in_memory"
    VECTOR_INDEX_NAME: str = "rag_chunk_embeddings"
    VECTOR_DIMENSIONS: int = 1536

    # Embedding settings
    EMBEDDING_PROVIDER: str = "mock"  # "mock", "openai", "gemini"
    EMBEDDING_MODEL_NAME: str = "text-embedding-3-small"
    OPENAI_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    # LLM Generation settings
    LLM_PROVIDER: str = "mock"  # "mock", "openai", "gemini", "ollama"
    LLM_MODEL_NAME: str = "gpt-4o-mini"
    LLM_TEMPERATURE: float = 0.2
    LLM_MAX_TOKENS: int = 1500
    LLM_REQUEST_TIMEOUT: float = 30.0
    LLM_BASE_URL: str | None = None  # Custom endpoint override if applicable
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()