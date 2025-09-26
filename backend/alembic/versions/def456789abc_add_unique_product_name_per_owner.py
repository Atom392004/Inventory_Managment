Add unique constraint on product name per owner

Revision ID: def456789abc
Revises: 123456789abc
Create Date: 2024-10-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'def456789abc'
down_revision: Union[str, Sequence[str], None] = '123456789abc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add unique constraint on (name, owner_id)
    op.create_unique_constraint('unique_product_name_per_owner', 'products', ['name', 'owner_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the per-owner unique constraint on name
    op.drop_constraint('unique_product_name_per_owner', 'products')
