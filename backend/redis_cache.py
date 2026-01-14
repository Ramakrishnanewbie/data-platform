import redis
import json
import logging
from typing import Optional, Any
from functools import wraps
import hashlib

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis cache manager for BigQuery data"""
    
    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 0):
        """
        Initialize Redis connection
        
        Args:
            host: Redis host
            port: Redis port
            db: Redis database number
        """
        try:
            self.client = redis.Redis(
                host=host,
                port=port,
                db=db,
                decode_responses=True,
                socket_connect_timeout=5
            )
            # Test connection
            self.client.ping()
            logger.info(f"✅ Redis connected successfully at {host}:{port}")
        except redis.ConnectionError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            self.client = None
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        if self.client is None:
            return False
        try:
            self.client.ping()
            return True
        except:
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if not self.is_connected():
            return None
        
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """
        Set value in cache with TTL
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default 1 hour)
            
        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected():
            return False
        
        try:
            serialized = json.dumps(value)
            self.client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """
        Delete key from cache
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected():
            return False
        
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching a pattern
        
        Args:
            pattern: Redis key pattern (e.g., "lineage:*")
            
        Returns:
            Number of keys deleted
        """
        if not self.is_connected():
            return 0
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis DELETE_PATTERN error for pattern {pattern}: {e}")
            return 0
    
    def clear_all(self) -> bool:
        """
        Clear entire cache (use with caution!)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.is_connected():
            return False
        
        try:
            self.client.flushdb()
            logger.info("🗑️  Redis cache cleared")
            return True
        except Exception as e:
            logger.error(f"Redis FLUSHDB error: {e}")
            return False
    
    def get_stats(self) -> dict:
        """
        Get cache statistics
        
        Returns:
            Dictionary with cache stats
        """
        if not self.is_connected():
            return {"connected": False}
        
        try:
            info = self.client.info()
            return {
                "connected": True,
                "used_memory_human": info.get("used_memory_human"),
                "total_keys": self.client.dbsize(),
                "hits": info.get("keyspace_hits", 0),
                "misses": info.get("keyspace_misses", 0),
                "hit_rate": self._calculate_hit_rate(
                    info.get("keyspace_hits", 0),
                    info.get("keyspace_misses", 0)
                )
            }
        except Exception as e:
            logger.error(f"Redis INFO error: {e}")
            return {"connected": False, "error": str(e)}
    
    def _calculate_hit_rate(self, hits: int, misses: int) -> float:
        """Calculate cache hit rate percentage"""
        total = hits + misses
        if total == 0:
            return 0.0
        return round((hits / total) * 100, 2)


def generate_cache_key(*args, prefix: str = "bq") -> str:
    """
    Generate a deterministic cache key from arguments
    
    Args:
        *args: Arguments to include in cache key
        prefix: Key prefix for namespacing
        
    Returns:
        Cache key string
    """
    # Create string from all args
    key_parts = [str(arg) for arg in args]
    key_string = ":".join(key_parts)
    
    # Hash if too long
    if len(key_string) > 100:
        key_hash = hashlib.md5(key_string.encode()).hexdigest()[:16]
        return f"{prefix}:{key_hash}"
    
    return f"{prefix}:{key_string}"


# Cache TTL constants (in seconds)
TTL_ASSETS = 6 * 3600  # 6 hours - datasets don't change often
TTL_LINEAGE = 1 * 3600  # 1 hour - lineage can change
TTL_SCHEMA = 12 * 3600  # 12 hours - schema is stable
TTL_QUERY_RESULT = 5 * 60  # 5 minutes - query results can be dynamic


# Global cache instance (will be initialized in main.py)
redis_cache: Optional[RedisCache] = None


def get_cache() -> Optional[RedisCache]:
    """Get the global cache instance"""
    return redis_cache


def init_cache(host: str = "localhost", port: int = 6379, db: int = 0) -> RedisCache:
    """
    Initialize the global cache instance
    
    Args:
        host: Redis host
        port: Redis port  
        db: Redis database number
        
    Returns:
        RedisCache instance
    """
    global redis_cache
    redis_cache = RedisCache(host=host, port=port, db=db)
    return redis_cache