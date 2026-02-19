"""add_idempotency_keys_table

Revision ID: c1ccb05706bf
Revises: 2ad13d23284f
Create Date: 2026-01-29 03:01:54.555029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1ccb05706bf'
down_revision: Union[str, None] = '2ad13d23284f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create idempotency_keys table only
    op.create_table('idempotency_keys',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('key', sa.String(length=36), nullable=False),
    sa.Column('endpoint', sa.String(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('response_status', sa.Integer(), nullable=True),
    sa.Column('response_body', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_idempotency_keys_id'), 'idempotency_keys', ['id'], unique=False)
    op.create_index(op.f('ix_idempotency_keys_key'), 'idempotency_keys', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_idempotency_keys_key'), table_name='idempotency_keys')
    op.drop_index(op.f('ix_idempotency_keys_id'), table_name='idempotency_keys')
    op.drop_table('idempotency_keys')
