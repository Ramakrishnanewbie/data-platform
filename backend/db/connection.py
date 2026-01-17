"""
Database connection module for async PostgreSQL with SQLAlchemy.
Database is optional - the app will work without it but explorations features will be disabled.
"""
import os
from typing import Optional, AsyncGenerator
from sqlalchemy.orm import DeclarativeBase
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variable
# Format: postgresql+asyncpg://user:password@host:port/database
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Lazy initialization - only create engine if DATABASE_URL is set
engine = None
AsyncSessionLocal = None
_db_available = False


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def _init_engine():
    """Initialize the database engine lazily."""
    global engine, AsyncSessionLocal, _db_available

    if not DATABASE_URL:
        print("⚠️  DATABASE_URL not set - explorations feature disabled")
        return False

    try:
        from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
        import ssl

        # Create SSL context for cloud databases (Neon, Supabase, etc.)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        # Build connect_args for asyncpg with SSL
        connect_args = {"ssl": ssl_context} if "ssl=require" in DATABASE_URL or "sslmode=require" in DATABASE_URL else {}

        # Remove ssl params from URL as they're handled via connect_args
        clean_url = DATABASE_URL.replace("?ssl=require", "").replace("&ssl=require", "").replace("?sslmode=require", "").replace("&sslmode=require", "")

        engine = create_async_engine(
            clean_url,
            echo=os.getenv("DEBUG", "false").lower() == "true",
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            connect_args=connect_args,
        )

        AsyncSessionLocal = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )

        _db_available = True
        print("✅ Database engine initialized")
        return True
    except Exception as e:
        print(f"⚠️  Database initialization failed: {e}")
        return False


def is_db_available() -> bool:
    """Check if database is available."""
    return _db_available


async def get_db() -> AsyncGenerator:
    """
    Dependency that provides a database session.
    Raises an error if database is not available.
    """
    if not _db_available or AsyncSessionLocal is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="Database not available. Set DATABASE_URL environment variable."
        )

    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize the database by creating all tables.
    Call this on application startup.
    """
    if not _init_engine():
        return

    if engine is None:
        return

    try:
        from .models import Base
        async with engine.begin() as conn:
            # checkfirst=True ensures it doesn't fail if tables exist
            await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, checkfirst=True))
        print("✅ Database tables created/verified")
    except Exception as e:
        # If tables already exist, that's fine
        if "already exists" in str(e).lower() or "duplicate key" in str(e).lower():
            print("✅ Database tables already exist")
        else:
            print(f"⚠️  Failed to create database tables: {e}")


async def close_db():
    """
    Close database connections.
    Call this on application shutdown.
    """
    if engine is not None:
        await engine.dispose()
