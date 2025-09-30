"""Drop global unique on sku, add per-owner unique

Revision ID: sku_unique_per_owner
Revises:
Create Date: 2024-10-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'sku_unique_per_owner'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Drop the global unique index on sku
    op.drop_index('ix_products_sku', table_name='products')
    # Create unique constraint on (sku, owner_id)
    op.create_unique_constraint('unique_product_sku_per_owner', 'products', ['sku', 'owner_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop the per-owner unique constraint
    op.drop_constraint('unique_product_sku_per_owner', 'products')
    # Recreate the global unique index on sku
    op.create_index('ix_products_sku', 'products', ['sku'], unique=True)
