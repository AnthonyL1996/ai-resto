"""
Application configuration management using Pydantic Settings.
All sensitive configuration is loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database Configuration
    database_url: str
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Redis Configuration
    redis_url: str

    # Email Configuration
    smtp_server: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: str = "orders@restaurant.com"

    # Payment Configuration
    payconiq_api_key: Optional[str] = None
    payconiq_api_url: str = "https://api.payconiq.com/v3/payments"
    payconiq_webhook_secret: Optional[str] = None
    base_url: str = "http://localhost:8000"

    # Application Configuration
    debug: bool = False
    log_level: str = "INFO"
    environment: str = "development"

    # CORS Configuration
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"

    @property
    def allowed_origins_list(self) -> list[str]:
        """Parse allowed origins from comma-separated string."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    def validate_required_settings(self) -> None:
        """Validate that critical settings are configured."""
        if not self.secret_key or self.secret_key == "your-secret-key-here":
            raise ValueError(
                "SECRET_KEY must be set to a secure random value. "
                "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )

        if self.environment == "production":
            if not self.payconiq_api_key:
                raise ValueError("PAYCONIQ_API_KEY must be set in production")
            if not self.smtp_server or not self.smtp_user:
                raise ValueError("Email settings must be configured in production")


# Create global settings instance
settings = Settings()

# Validate settings on import (fail fast)
if os.getenv("SKIP_SETTINGS_VALIDATION") != "true":
    settings.validate_required_settings()
