"""
CRUD Package - Backward Compatible Re-exports

This package contains all CRUD operations split into logical modules.
All functions are re-exported here for backward compatibility with existing code
that imports from `app.crud`.
"""

# Crop CRUD
from .crops import (
    get_crop,
    get_crop_by_name,
    get_crops,
    create_crop,
    delete_crop,
    get_crop_dependencies,
    migrate_crop_data,
    delete_crop_with_dependencies,
)

# Contact CRUD
from .contacts import (
    get_contact,
    get_contacts,
    create_contact,
    delete_contact,
    get_contact_dependencies,
    migrate_contact_data,
    delete_contact_with_dependencies,
)

# Finance CRUD
from .finance import (
    get_financial_account,
    get_financial_accounts,
    create_financial_account,
    update_financial_account,
    delete_financial_account,
    create_ledger_entry,
)

# Inventory CRUD
from .inventory import (
    get_or_create_inventory,
    get_inventory_levels,
    create_inventory_adjustment,
)

# Operations CRUD (Sales, Purchases, Expenses)
from .operations import (
    get_purchases,
    create_purchase_record,
    get_sales,
    create_sale_record,
    get_expenses,
    create_expense,
    update_expense,
    delete_expense,
)

# Returns CRUD
from .returns import (
    create_sale_return,
    get_sale_returns,
    create_purchase_return,
    get_purchase_returns,
)

# Seasons CRUD
from .seasons import (
    get_seasons,
    get_season,
    create_season,
    update_season,
    delete_season,
    create_daily_price,
    get_daily_prices,
    get_active_season,
    activate_season,
)

# Export all for easy access
__all__ = [
    # Crops
    'get_crop', 'get_crop_by_name', 'get_crops', 'create_crop', 'delete_crop',
    'get_crop_dependencies', 'migrate_crop_data', 'delete_crop_with_dependencies',
    # Contacts
    'get_contact', 'get_contacts', 'create_contact', 'delete_contact',
    'get_contact_dependencies', 'migrate_contact_data', 'delete_contact_with_dependencies',
    # Finance
    'get_financial_account', 'get_financial_accounts', 'create_financial_account',
    'update_financial_account', 'delete_financial_account', 'create_ledger_entry',
    # Inventory
    'get_or_create_inventory', 'get_inventory_levels', 'create_inventory_adjustment',
    # Operations
    'get_purchases', 'create_purchase_record', 'get_sales', 'create_sale_record',
    'get_expenses', 'create_expense', 'update_expense', 'delete_expense',
    # Returns
    'create_sale_return', 'get_sale_returns', 'create_purchase_return', 'get_purchase_returns',
    # Seasons
    'get_seasons', 'get_season', 'create_season', 'update_season', 'delete_season',
    'create_daily_price', 'get_daily_prices', 'get_active_season', 'activate_season',
]
