"""
FastAPI router for the Explorations feature.
Provides CRUD operations for explorations, cells, and sharing.
"""
import uuid
import hashlib
import secrets
import asyncio
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func, or_
from sqlalchemy.orm import selectinload
from google.cloud import bigquery

from db.connection import get_db
from db.models import Exploration, ExplorationCell, ExplorationShare

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Thread pool for BigQuery operations
executor = ThreadPoolExecutor(max_workers=10)

# BigQuery client (initialized lazily)
_bq_client = None

def get_bq_client():
    global _bq_client
    if _bq_client is None:
        _bq_client = bigquery.Client()
    return _bq_client


# ============================================================================
# Pydantic Models
# ============================================================================

class CellContent(BaseModel):
    """Content for different cell types."""
    query: Optional[str] = None  # For SQL cells
    text: Optional[str] = None   # For markdown cells
    chart_config: Optional[Dict[str, Any]] = None  # For visualization cells
    source_cell_id: Optional[str] = None  # For viz cells - which cell's output to visualize


class CellCreate(BaseModel):
    """Request model for creating a cell."""
    cell_type: str = Field(..., description="Type: sql, markdown, or visualization")
    content: CellContent
    order_index: Optional[int] = None  # If not provided, append at end


class CellUpdate(BaseModel):
    """Request model for updating a cell."""
    content: Optional[CellContent] = None
    order_index: Optional[int] = None
    is_collapsed: Optional[bool] = None


class CellReorderItem(BaseModel):
    """Single item in reorder request."""
    id: str
    order_index: int


class CellReorderRequest(BaseModel):
    """Request model for batch reordering cells."""
    cells: List[CellReorderItem]


class ExplorationCreate(BaseModel):
    """Request model for creating an exploration."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: Optional[str] = None
    tags: List[str] = []


class ExplorationUpdate(BaseModel):
    """Request model for updating an exploration."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None


class ShareCreate(BaseModel):
    """Request model for sharing an exploration."""
    shared_with_email: Optional[str] = None
    shared_with_user_id: Optional[str] = None
    permission_level: str = Field(default="view", pattern="^(view|edit|admin)$")
    create_link: bool = False
    expires_in_hours: Optional[int] = None  # For link sharing


class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    items: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int


# ============================================================================
# Helper Functions
# ============================================================================

def get_user_id(x_user_id: Optional[str] = Header(None, alias="X-User-ID")) -> str:
    """
    Extract user ID from request header.
    In production, this would be from JWT/session.
    For development, accepts X-User-ID header or defaults to 'dev-user'.
    """
    return x_user_id or "dev-user"


async def check_exploration_access(
    db: AsyncSession,
    exploration_id: uuid.UUID,
    user_id: str,
    require_edit: bool = False
) -> Exploration:
    """
    Check if user has access to the exploration.
    Returns the exploration if access is granted, raises HTTPException otherwise.
    """
    result = await db.execute(
        select(Exploration)
        .options(selectinload(Exploration.shares))
        .where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one_or_none()

    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    # Owner has full access
    if exploration.user_id == user_id:
        return exploration

    # Public explorations are viewable by anyone
    if exploration.is_public and not require_edit:
        return exploration

    # Check shares
    for share in exploration.shares:
        if share.shared_with_user_id == user_id:
            if require_edit and share.permission_level == "view":
                raise HTTPException(status_code=403, detail="Edit permission required")
            return exploration

    raise HTTPException(status_code=403, detail="Access denied")


def serialize_bigquery_value(value):
    """Serialize BigQuery values to JSON-compatible types."""
    from datetime import date, datetime
    from decimal import Decimal

    if isinstance(value, (date, datetime)):
        return value.isoformat()
    elif isinstance(value, Decimal):
        return float(value)
    elif isinstance(value, bytes):
        return value.decode('utf-8')
    return value


def exploration_to_dict(exp: Exploration, cells: List[ExplorationCell] = None) -> Dict[str, Any]:
    """Convert exploration to dict without lazy loading."""
    result = {
        "id": str(exp.id),
        "user_id": exp.user_id,
        "project_id": exp.project_id,
        "name": exp.name,
        "description": exp.description,
        "tags": exp.tags or [],
        "is_public": exp.is_public,
        "created_at": exp.created_at.isoformat() if exp.created_at else None,
        "updated_at": exp.updated_at.isoformat() if exp.updated_at else None,
        "last_accessed_at": exp.last_accessed_at.isoformat() if exp.last_accessed_at else None,
        "cell_count": len(cells) if cells is not None else 0,
    }
    if cells is not None:
        result["cells"] = [cell_to_dict(c) for c in cells]
    return result


def cell_to_dict(cell: ExplorationCell) -> Dict[str, Any]:
    """Convert cell to dict without lazy loading."""
    return {
        "id": str(cell.id),
        "exploration_id": str(cell.exploration_id),
        "cell_type": cell.cell_type,
        "order_index": cell.order_index,
        "content": cell.content or {},
        "output": cell.output,
        "executed_at": cell.executed_at.isoformat() if cell.executed_at else None,
        "execution_time_ms": cell.execution_time_ms,
        "is_collapsed": cell.is_collapsed,
        "created_at": cell.created_at.isoformat() if cell.created_at else None,
        "updated_at": cell.updated_at.isoformat() if cell.updated_at else None,
    }


def share_to_dict(share: ExplorationShare) -> Dict[str, Any]:
    """Convert share to dict without lazy loading."""
    return {
        "id": str(share.id),
        "exploration_id": str(share.exploration_id),
        "shared_by_user_id": share.shared_by_user_id,
        "shared_with_user_id": share.shared_with_user_id,
        "shared_with_email": share.shared_with_email,
        "permission_level": share.permission_level,
        "share_token": share.share_token,
        "expires_at": share.expires_at.isoformat() if share.expires_at else None,
        "created_at": share.created_at.isoformat() if share.created_at else None,
    }


# ============================================================================
# Exploration CRUD Endpoints
# ============================================================================

@router.get("/explorations")
async def list_explorations(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[str] = None,  # Comma-separated
    sort_by: str = Query("updated_at", pattern="^(name|created_at|updated_at|last_accessed_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    include_shared: bool = True,
) -> PaginatedResponse:
    """
    List explorations for the current user.
    Includes owned and shared explorations.
    """
    # Base query for owned explorations
    owned_query = select(Exploration).where(Exploration.user_id == user_id)

    # Include shared explorations if requested
    if include_shared:
        shared_subquery = (
            select(ExplorationShare.exploration_id)
            .where(ExplorationShare.shared_with_user_id == user_id)
        )
        query = select(Exploration).where(
            or_(
                Exploration.user_id == user_id,
                Exploration.id.in_(shared_subquery)
            )
        )
    else:
        query = owned_query

    # Apply search filter
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Exploration.name.ilike(search_pattern),
                Exploration.description.ilike(search_pattern)
            )
        )

    # Apply tags filter
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            query = query.where(Exploration.tags.contains([tag]))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(Exploration, sort_by)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute with cells loaded
    result = await db.execute(query.options(selectinload(Exploration.cells)))
    explorations = result.scalars().all()

    # Build response items while still in session context
    items = []
    for e in explorations:
        cells = list(e.cells) if e.cells else []
        items.append(exploration_to_dict(e, cells))

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/explorations", status_code=201)
async def create_exploration(
    data: ExplorationCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Create a new exploration."""
    exploration = Exploration(
        user_id=user_id,
        name=data.name,
        description=data.description,
        project_id=data.project_id,
        tags=data.tags,
    )
    db.add(exploration)
    await db.flush()
    await db.refresh(exploration)

    logger.info(f"Created exploration {exploration.id} for user {user_id}")

    return exploration_to_dict(exploration, [])


@router.get("/explorations/{exploration_id}")
async def get_exploration(
    exploration_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Get an exploration with all its cells."""
    await check_exploration_access(db, exploration_id, user_id)

    # Load exploration with cells
    result = await db.execute(
        select(Exploration)
        .options(selectinload(Exploration.cells))
        .where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one()

    # Get cells while in session context (before any flush that might expire attributes)
    cells = sorted(list(exploration.cells), key=lambda c: c.order_index) if exploration.cells else []

    # Build response dict while still in session context
    response = exploration_to_dict(exploration, cells)

    # Update last accessed time (do this after building response)
    exploration.last_accessed_at = datetime.now(timezone.utc)
    await db.flush()

    return response


@router.put("/explorations/{exploration_id}")
async def update_exploration(
    exploration_id: uuid.UUID,
    data: ExplorationUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Update exploration metadata."""
    exploration = await check_exploration_access(db, exploration_id, user_id, require_edit=True)

    # Update fields
    if data.name is not None:
        exploration.name = data.name
    if data.description is not None:
        exploration.description = data.description
    if data.tags is not None:
        exploration.tags = data.tags
    if data.is_public is not None:
        exploration.is_public = data.is_public

    await db.flush()
    await db.refresh(exploration)

    return exploration_to_dict(exploration, [])


@router.delete("/explorations/{exploration_id}", status_code=204)
async def delete_exploration(
    exploration_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    """Delete an exploration. Only the owner can delete."""
    result = await db.execute(
        select(Exploration).where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one_or_none()

    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    if exploration.user_id != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can delete")

    await db.delete(exploration)
    logger.info(f"Deleted exploration {exploration_id}")


@router.post("/explorations/{exploration_id}/duplicate")
async def duplicate_exploration(
    exploration_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Duplicate an exploration with all its cells."""
    exploration = await check_exploration_access(db, exploration_id, user_id)

    # Load cells
    result = await db.execute(
        select(Exploration)
        .options(selectinload(Exploration.cells))
        .where(Exploration.id == exploration_id)
    )
    original = result.scalar_one()

    # Create new exploration
    new_exploration = Exploration(
        user_id=user_id,
        name=f"{original.name} (Copy)",
        description=original.description,
        project_id=original.project_id,
        tags=original.tags.copy() if original.tags else [],
    )
    db.add(new_exploration)
    await db.flush()

    # Copy cells
    for cell in original.cells:
        new_cell = ExplorationCell(
            exploration_id=new_exploration.id,
            cell_type=cell.cell_type,
            order_index=cell.order_index,
            content=cell.content.copy() if cell.content else {},
            # Don't copy output - user should re-execute
        )
        db.add(new_cell)

    await db.flush()
    await db.refresh(new_exploration)

    logger.info(f"Duplicated exploration {exploration_id} to {new_exploration.id}")

    return exploration_to_dict(new_exploration, [])


# ============================================================================
# Cell CRUD Endpoints
# ============================================================================

@router.post("/explorations/{exploration_id}/cells", status_code=201)
async def create_cell(
    exploration_id: uuid.UUID,
    data: CellCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Add a new cell to an exploration."""
    await check_exploration_access(db, exploration_id, user_id, require_edit=True)

    # Validate cell type
    if data.cell_type not in ["sql", "markdown", "visualization"]:
        raise HTTPException(status_code=400, detail="Invalid cell type")

    # Determine order index
    if data.order_index is not None:
        order_index = data.order_index
        # Shift existing cells
        await db.execute(
            update(ExplorationCell)
            .where(
                ExplorationCell.exploration_id == exploration_id,
                ExplorationCell.order_index >= order_index
            )
            .values(order_index=ExplorationCell.order_index + 1)
        )
    else:
        # Append at end
        result = await db.execute(
            select(func.max(ExplorationCell.order_index))
            .where(ExplorationCell.exploration_id == exploration_id)
        )
        max_index = result.scalar() or -1
        order_index = max_index + 1

    # Create cell
    cell = ExplorationCell(
        exploration_id=exploration_id,
        cell_type=data.cell_type,
        order_index=order_index,
        content=data.content.model_dump(exclude_none=True),
    )
    db.add(cell)
    await db.flush()
    await db.refresh(cell)

    return cell_to_dict(cell)


@router.put("/explorations/{exploration_id}/cells/{cell_id}")
async def update_cell(
    exploration_id: uuid.UUID,
    cell_id: uuid.UUID,
    data: CellUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Update a cell's content or settings."""
    await check_exploration_access(db, exploration_id, user_id, require_edit=True)

    result = await db.execute(
        select(ExplorationCell).where(
            ExplorationCell.id == cell_id,
            ExplorationCell.exploration_id == exploration_id
        )
    )
    cell = result.scalar_one_or_none()

    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")

    # Update fields
    if data.content is not None:
        cell.content = data.content.model_dump(exclude_none=True)
    if data.order_index is not None:
        cell.order_index = data.order_index
    if data.is_collapsed is not None:
        cell.is_collapsed = data.is_collapsed

    await db.flush()
    await db.refresh(cell)

    return cell_to_dict(cell)


@router.delete("/explorations/{exploration_id}/cells/{cell_id}", status_code=204)
async def delete_cell(
    exploration_id: uuid.UUID,
    cell_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    """Delete a cell from an exploration."""
    await check_exploration_access(db, exploration_id, user_id, require_edit=True)

    result = await db.execute(
        select(ExplorationCell).where(
            ExplorationCell.id == cell_id,
            ExplorationCell.exploration_id == exploration_id
        )
    )
    cell = result.scalar_one_or_none()

    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")

    deleted_index = cell.order_index
    await db.delete(cell)

    # Shift remaining cells down
    await db.execute(
        update(ExplorationCell)
        .where(
            ExplorationCell.exploration_id == exploration_id,
            ExplorationCell.order_index > deleted_index
        )
        .values(order_index=ExplorationCell.order_index - 1)
    )


@router.put("/explorations/{exploration_id}/cells/reorder")
async def reorder_cells(
    exploration_id: uuid.UUID,
    data: CellReorderRequest,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, str]:
    """Batch reorder cells in an exploration."""
    await check_exploration_access(db, exploration_id, user_id, require_edit=True)

    # Update each cell's order
    for item in data.cells:
        await db.execute(
            update(ExplorationCell)
            .where(
                ExplorationCell.id == uuid.UUID(item.id),
                ExplorationCell.exploration_id == exploration_id
            )
            .values(order_index=item.order_index)
        )

    return {"status": "success"}


# ============================================================================
# Cell Execution Endpoint
# ============================================================================

@router.post("/explorations/{exploration_id}/cells/{cell_id}/execute")
async def execute_cell(
    exploration_id: uuid.UUID,
    cell_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Execute a SQL cell and store the results."""
    await check_exploration_access(db, exploration_id, user_id, require_edit=True)

    result = await db.execute(
        select(ExplorationCell).where(
            ExplorationCell.id == cell_id,
            ExplorationCell.exploration_id == exploration_id
        )
    )
    cell = result.scalar_one_or_none()

    if not cell:
        raise HTTPException(status_code=404, detail="Cell not found")

    if cell.cell_type != "sql":
        raise HTTPException(status_code=400, detail="Only SQL cells can be executed")

    query = cell.content.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Empty query")

    # Check for dangerous operations (optional security measure)
    query_upper = query.upper()
    dangerous_keywords = ["DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "INSERT", "UPDATE"]
    for keyword in dangerous_keywords:
        if keyword in query_upper and not query_upper.strip().startswith("SELECT"):
            # Allow these in subqueries, but warn
            logger.warning(f"Potentially dangerous query from user {user_id}: {query[:100]}...")

    # Try cache first
    from redis_cache import get_cache, TTL_QUERY_RESULT
    cache = get_cache()
    query_hash = hashlib.md5(query.encode()).hexdigest()
    cache_key = f"exp:{exploration_id}:cell:{cell_id}:{query_hash}"

    if cache and cache.is_connected():
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"Cache hit for cell {cell_id}")
            # Update cell with cached output
            cell.output = cached
            cell.executed_at = datetime.now(timezone.utc)
            await db.flush()
            cached["cached"] = True
            return cached

    # Execute query
    start_time = datetime.now(timezone.utc)
    try:
        bq_client = get_bq_client()
        loop = asyncio.get_event_loop()

        def run_query():
            query_job = bq_client.query(query)
            results = query_job.result(max_results=10000)  # Limit for safety

            schema = [{"name": f.name, "type": f.field_type} for f in results.schema]
            rows = []
            for row in results:
                serialized_row = {}
                for key, value in dict(row).items():
                    serialized_row[key] = serialize_bigquery_value(value)
                rows.append(serialized_row)

            return schema, rows

        schema, rows = await loop.run_in_executor(executor, run_query)

        execution_time_ms = int((datetime.now(timezone.utc) - start_time).total_seconds() * 1000)

        output = {
            "schema": schema,
            "rows": rows,
            "total_rows": len(rows),
            "execution_time_ms": execution_time_ms,
            "executed_at": start_time.isoformat(),
            "cached": False,
        }

        # Update cell
        cell.output = output
        cell.executed_at = start_time
        cell.execution_time_ms = execution_time_ms
        await db.flush()

        # Cache results if not too large
        if cache and cache.is_connected() and len(rows) < 5000:
            cache.set(cache_key, output, ttl=TTL_QUERY_RESULT)

        logger.info(f"Executed cell {cell_id}: {len(rows)} rows in {execution_time_ms}ms")

        return output

    except Exception as e:
        logger.error(f"Query execution failed for cell {cell_id}: {str(e)}")
        error_output = {
            "error": str(e),
            "executed_at": start_time.isoformat(),
        }
        cell.output = error_output
        cell.executed_at = start_time
        await db.flush()

        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Sharing Endpoints
# ============================================================================

@router.get("/explorations/{exploration_id}/shares")
async def list_shares(
    exploration_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> List[Dict[str, Any]]:
    """List all shares for an exploration. Only owner can view."""
    result = await db.execute(
        select(Exploration).where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one_or_none()

    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    if exploration.user_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can view shares")

    shares_result = await db.execute(
        select(ExplorationShare).where(ExplorationShare.exploration_id == exploration_id)
    )
    shares = shares_result.scalars().all()

    return [share_to_dict(s) for s in shares]


@router.post("/explorations/{exploration_id}/shares", status_code=201)
async def create_share(
    exploration_id: uuid.UUID,
    data: ShareCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Share an exploration with a user or create a shareable link."""
    result = await db.execute(
        select(Exploration).where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one_or_none()

    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    if exploration.user_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can share")

    # Create share token for link sharing
    share_token = None
    if data.create_link:
        share_token = secrets.token_urlsafe(32)

    # Calculate expiration
    expires_at = None
    if data.expires_in_hours:
        from datetime import timedelta
        expires_at = datetime.now(timezone.utc) + timedelta(hours=data.expires_in_hours)

    share = ExplorationShare(
        exploration_id=exploration_id,
        shared_by_user_id=user_id,
        shared_with_user_id=data.shared_with_user_id,
        shared_with_email=data.shared_with_email,
        permission_level=data.permission_level,
        share_token=share_token,
        expires_at=expires_at,
    )
    db.add(share)
    await db.flush()
    await db.refresh(share)

    logger.info(f"Created share {share.id} for exploration {exploration_id}")

    return share_to_dict(share)


@router.delete("/explorations/{exploration_id}/shares/{share_id}", status_code=204)
async def delete_share(
    exploration_id: uuid.UUID,
    share_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    """Revoke a share. Only owner can revoke."""
    result = await db.execute(
        select(Exploration).where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one_or_none()

    if not exploration or exploration.user_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can revoke shares")

    share_result = await db.execute(
        select(ExplorationShare).where(
            ExplorationShare.id == share_id,
            ExplorationShare.exploration_id == exploration_id
        )
    )
    share = share_result.scalar_one_or_none()

    if not share:
        raise HTTPException(status_code=404, detail="Share not found")

    await db.delete(share)


@router.get("/explorations/shared/{token}")
async def get_shared_exploration(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Access an exploration via share token."""
    result = await db.execute(
        select(ExplorationShare)
        .options(selectinload(ExplorationShare.exploration))
        .where(ExplorationShare.share_token == token)
    )
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(status_code=404, detail="Invalid or expired share link")

    # Check expiration
    if share.expires_at and share.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Share link has expired")

    # Load exploration with cells
    exp_result = await db.execute(
        select(Exploration)
        .options(selectinload(Exploration.cells))
        .where(Exploration.id == share.exploration_id)
    )
    exploration = exp_result.scalar_one()
    cells = sorted(list(exploration.cells), key=lambda c: c.order_index) if exploration.cells else []

    return {
        **exploration_to_dict(exploration, cells),
        "permission_level": share.permission_level,
        "shared": True,
    }


# ============================================================================
# Export Endpoint
# ============================================================================

@router.get("/explorations/{exploration_id}/export")
async def export_exploration(
    exploration_id: uuid.UUID,
    format: str = Query("json", pattern="^(json|html)$"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_user_id),
) -> Dict[str, Any]:
    """Export an exploration in various formats."""
    await check_exploration_access(db, exploration_id, user_id)

    # Load with cells
    result = await db.execute(
        select(Exploration)
        .options(selectinload(Exploration.cells))
        .where(Exploration.id == exploration_id)
    )
    exploration = result.scalar_one()
    cells = sorted(list(exploration.cells), key=lambda c: c.order_index) if exploration.cells else []
    exploration_data = exploration_to_dict(exploration, cells)

    if format == "json":
        return {
            "format": "json",
            "data": exploration_data,
        }
    elif format == "html":
        # Generate simple HTML report
        html_parts = [
            f"<html><head><title>{exploration.name}</title>",
            "<style>body{font-family:system-ui;max-width:900px;margin:0 auto;padding:20px}",
            "pre{background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto}",
            "table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}",
            "</style></head><body>",
            f"<h1>{exploration.name}</h1>",
            f"<p>{exploration.description or ''}</p>",
        ]

        for cell in exploration.cells:
            if cell.cell_type == "markdown":
                html_parts.append(f"<div class='markdown'>{cell.content.get('text', '')}</div>")
            elif cell.cell_type == "sql":
                html_parts.append(f"<pre class='sql'>{cell.content.get('query', '')}</pre>")
                if cell.output and "rows" in cell.output:
                    html_parts.append("<table><thead><tr>")
                    for col in cell.output.get("schema", []):
                        html_parts.append(f"<th>{col['name']}</th>")
                    html_parts.append("</tr></thead><tbody>")
                    for row in cell.output.get("rows", [])[:100]:  # Limit rows
                        html_parts.append("<tr>")
                        for col in cell.output.get("schema", []):
                            html_parts.append(f"<td>{row.get(col['name'], '')}</td>")
                        html_parts.append("</tr>")
                    html_parts.append("</tbody></table>")

        html_parts.append("</body></html>")

        return {
            "format": "html",
            "data": "".join(html_parts),
        }
