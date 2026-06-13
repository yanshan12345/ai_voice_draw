from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache

class Settings(BaseSettings):
    ALIYUN_API_KEY: str = Field(..., description="阿里云百炼API密钥")
    QWEN_CHAT_MODEL: str = Field(default="qwen-plus", description="通义千问对话模型")
    QWEN_IMAGE_MODEL: str = Field(default="wanx-v1", description="通义万象图像生成模型")
    MAX_RETRIES: int = Field(default=3, ge=1, le=10, description="API请求最大重试次数")
    TIMEOUT: int = Field(default=30, ge=5, le=300, description="API请求超时时间(秒)")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @field_validator("ALIYUN_API_KEY")
    @classmethod
    def validate_api_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("ALIYUN_API_KEY 不能为空")
        return v.strip()

@lru_cache()
def get_settings() -> Settings:
    return Settings()
