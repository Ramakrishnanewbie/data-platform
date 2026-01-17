"""
SQLAlchemy models for the Explorations feature.
"""
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from .connection import Base


class Exploration(Base):
    """
    Main exploration/notebook entity.
    Contains metadata and references to cells.
    """
    __tablename__ = "explorations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    project_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    last_accessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    cells: Mapped[List["ExplorationCell"]] = relationship(
        "ExplorationCell",
        back_populates="exploration",
        cascade="all, delete-orphan",
        order_by="ExplorationCell.order_index"
    )
    shares: Mapped[List["ExplorationShare"]] = relationship(
        "ExplorationShare",
        back_populates="exploration",
        cascade="all, delete-orphan"
    )

    # Indexes
    __table_args__ = (
        Index("idx_explorations_user_created", "user_id", "created_at"),
    )

    def to_dict(self, include_cells: bool = False, cell_count: int = 0) -> dict:
        """Convert exploration to dictionary.

        Args:
            include_cells: If True and cells are loaded, include them
            cell_count: Pre-calculated cell count to avoid lazy loading
        """
        from sqlalchemy.orm import object_session
        from sqlalchemy.inspection import inspect

        result = {
            "id": str(self.id),
            "user_id": self.user_id,
            "project_id": self.project_id,
            "name": self.name,
            "description": self.description,
            "tags": self.tags or [],
            "is_public": self.is_public,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            "cell_count": cell_count,
        }

        # Only access cells if they're already loaded (avoid lazy loading)
        state = inspect(self)
        if 'cells' in state.dict:
            result["cell_count"] = len(self.cells) if self.cells else 0
            if include_cells:
                result["cells"] = [cell.to_dict() for cell in self.cells]

        return result


class ExplorationCell(Base):
    """
    Individual cell within an exploration.
    Can be SQL, markdown, or visualization.
    """
    __tablename__ = "exploration_cells"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    exploration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("explorations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    cell_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # 'sql', 'markdown', 'visualization'
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    # Content stores the cell's input (query, markdown text, or viz config)
    content: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)

    # Output stores execution results (query results, rendered markdown, etc.)
    output: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

    # Execution metadata
    executed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    execution_time_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # UI state
    is_collapsed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    exploration: Mapped["Exploration"] = relationship(
        "Exploration",
        back_populates="cells"
    )

    # Indexes
    __table_args__ = (
        Index("idx_cells_exploration_order", "exploration_id", "order_index"),
    )

    def to_dict(self) -> dict:
        """Convert cell to dictionary."""
        return {
            "id": str(self.id),
            "exploration_id": str(self.exploration_id),
            "cell_type": self.cell_type,
            "order_index": self.order_index,
            "content": self.content,
            "output": self.output,
            "executed_at": self.executed_at.isoformat() if self.executed_at else None,
            "execution_time_ms": self.execution_time_ms,
            "is_collapsed": self.is_collapsed,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ExplorationShare(Base):
    """
    Sharing configuration for an exploration.
    Supports both user-specific and link-based sharing.
    """
    __tablename__ = "exploration_shares"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    exploration_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("explorations.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    shared_by_user_id: Mapped[str] = mapped_column(String(255), nullable=False)

    # For user-specific sharing
    shared_with_user_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )
    shared_with_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Permission level: 'view', 'edit', 'admin'
    permission_level: Mapped[str] = mapped_column(
        String(20),
        default="view",
        nullable=False
    )

    # For link-based sharing
    share_token: Mapped[Optional[str]] = mapped_column(
        String(255),
        unique=True,
        nullable=True
    )
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    exploration: Mapped["Exploration"] = relationship(
        "Exploration",
        back_populates="shares"
    )

    def to_dict(self) -> dict:
        """Convert share to dictionary."""
        return {
            "id": str(self.id),
            "exploration_id": str(self.exploration_id),
            "shared_by_user_id": self.shared_by_user_id,
            "shared_with_user_id": self.shared_with_user_id,
            "shared_with_email": self.shared_with_email,
            "permission_level": self.permission_level,
            "share_token": self.share_token,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
