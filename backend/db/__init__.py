# Database module for Explorations feature
from .connection import get_db, is_db_available, init_db, close_db, Base

# Only import models if needed - they don't require DB connection
from .models import Exploration, ExplorationCell, ExplorationShare

__all__ = [
    "get_db",
    "is_db_available",
    "init_db",
    "close_db",
    "Base",
    "Exploration",
    "ExplorationCell",
    "ExplorationShare",
]
