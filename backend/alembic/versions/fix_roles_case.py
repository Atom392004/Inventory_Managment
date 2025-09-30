"""Fix user roles case to lowercase

Revision ID: fix_roles_case
Revises: sku_unique_per_owner
Create Date: 2024-10-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_roles_case'
down_revision: Union[str, Sequence[str], None] = 'sku_unique_per_owner'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create new enum with lowercase values
    op.execute("CREATE TYPE userrole_lower AS ENUM ('admin', 'warehouse_owner', 'user')")
    # Alter column to use new enum, casting existing values
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole_lower USING role::text::userrole_lower")
    # Drop old enum
    op.execute("DROP TYPE userrole")
    # Rename new enum to original name
    op.execute("ALTER TYPE userrole_lower RENAME TO userrole")


def downgrade() -> None:
    """Downgrade schema."""
    # Revert to uppercase (though not necessary)
    op.execute("UPDATE users SET role = 'USER' WHERE role = 'user'")
    op.execute("UPDATE users SET role = 'ADMIN' WHERE role = 'admin'")
    op.execute("UPDATE users SET role = 'WAREHOUSE_OWNER' WHERE role = 'warehouse_owner'")
