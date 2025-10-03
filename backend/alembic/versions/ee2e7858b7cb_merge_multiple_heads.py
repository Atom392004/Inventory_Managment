"""merge multiple heads

Revision ID: ee2e7858b7cb
Revises: 0b98175a0320, fix_roles_case
Create Date: 2025-10-03 10:44:46.817289

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ee2e7858b7cb'
down_revision: Union[str, Sequence[str], None] = ('0b98175a0320', 'fix_roles_case')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
