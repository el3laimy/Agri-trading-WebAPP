import sys
sys.path.append('.')
import traceback
print("Starting full import...")
try:
    from app import models, schemas, crud
    from app.services import sales, purchasing, inventory
    print("Success")
except Exception:
    traceback.print_exc()
print("Done")
