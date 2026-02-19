"""consolidated_user_tracking

Revision ID: 2ad13d23284f
Revises: 8b26e5fcfc4f
Create Date: 2025-12-19 23:39:58.811162

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2ad13d23284f'
down_revision: Union[str, None] = '8b26e5fcfc4f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create Settings table IF NOT EXISTS
    # Note: Using op.create_table directly is safe if it doesn't exist, 
    # but we'll be careful.
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    
    if 'settings' not in tables:
        op.create_table('settings',
            sa.Column('key', sa.String(), nullable=False),
            sa.Column('value', sa.String(), nullable=False),
            sa.Column('description', sa.String(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('key')
        )

    # 2. Update existing tables using batch mode (copy-and-move for SQLite)
    
    # --- Sales ---
    with op.batch_alter_table('sales') as batch_op:
        # Check if columns exist before adding
        cols = [c['name'] for c in inspector.get_columns('sales')]
        if 'created_by' not in cols:
            batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        if 'created_at' not in cols:
            batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        # Always try to add FK if not there (Alembic batch handles this)
        batch_op.create_foreign_key('fk_sales_creator', 'users', ['created_by'], ['user_id'])

    # --- Purchases ---
    with op.batch_alter_table('purchases') as batch_op:
        cols = [c['name'] for c in inspector.get_columns('purchases')]
        if 'created_by' not in cols:
            batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        if 'created_at' not in cols:
            batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_purchases_creator', 'users', ['created_by'], ['user_id'])

    # --- Expenses ---
    with op.batch_alter_table('expenses') as batch_op:
        cols = [c['name'] for c in inspector.get_columns('expenses')]
        if 'created_by' not in cols:
            batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        if 'created_at' not in cols:
            batch_op.add_column(sa.Column('created_at', sa.DateTime(), nullable=True))
        batch_op.create_foreign_key('fk_expenses_creator', 'users', ['created_by'], ['user_id'])

    # --- Payments ---
    with op.batch_alter_table('payments') as batch_op:
        cols = [c['name'] for c in inspector.get_columns('payments')]
        if 'created_by' not in cols:
            batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_payments_creator', 'users', ['created_by'], ['user_id'])

    # --- General Ledger ---
    with op.batch_alter_table('general_ledger') as batch_op:
        cols = [c['name'] for c in inspector.get_columns('general_ledger')]
        if 'created_by' not in cols:
            batch_op.add_column(sa.Column('created_by', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_gl_creator', 'users', ['created_by'], ['user_id'])


def downgrade() -> None:
    # Drop columns
    with op.batch_alter_table('general_ledger') as batch_op:
        batch_op.drop_column('created_by')
    with op.batch_alter_table('payments') as batch_op:
        batch_op.drop_column('created_by')
    with op.batch_alter_table('expenses') as batch_op:
        batch_op.drop_column('created_at')
        batch_op.drop_column('created_by')
    with op.batch_alter_table('purchases') as batch_op:
        batch_op.drop_column('created_at')
        batch_op.drop_column('created_by')
    with op.batch_alter_table('sales') as batch_op:
        batch_op.drop_column('created_at')
        batch_op.drop_column('created_by')
    op.drop_table('settings')
