import json
import hashlib
from functools import wraps
from typing import Any, Callable, Optional
import redis.asyncio as redis
from api.core.config import settings

_redis_client: Optional[redis.Redis] = None

async def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
            await _redis_client.ping()
        except Exception:
            _redis_client = None
    return _redis_client

def cache_key(prefix: str, *args, **kwargs) -> str:
    key_data = f"{prefix}:{args}:{sorted(kwargs.items())}"
    return f"fg:{hashlib.sha256(key_data.encode()).hexdigest()[:16]}"

async def cached(prefix: str, ttl: int = 300):
    """Decorator: cache async function result in Redis."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            r = await get_redis()
            if r is None:
                return await func(*args, **kwargs)
            
            key = cache_key(prefix, *args, **kwargs)
            cached_val = await r.get(key)
            if cached_val:
                return json.loads(cached_val)
            
            result = await func(*args, **kwargs)
            await r.setex(key, ttl, json.dumps(result, default=str))
            return result
        return wrapper
    return decorator

async def invalidate_prefix(prefix: str):
    r = await get_redis()
    if r:
        keys = []
        async for k in r.scan_iter(f"fg:{prefix}*"):
            keys.append(k)
        if keys:
            await r.delete(*keys)