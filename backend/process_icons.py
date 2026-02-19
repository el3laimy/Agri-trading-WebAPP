from PIL import Image
import os

SOURCE_ICON = r"C:/Users/el3la/.gemini/antigravity/brain/f48f0505-cb48-43eb-b1f7-fd2b8386489b/app_icon_1765492982566.png"
DEST_DIR = r"c:/Users/el3la/OneDrive/Desktop/webapp/Agri-trading-WebAPP/frontend/public"

def process_icons():
    if not os.path.exists(SOURCE_ICON):
        print(f"Source icon not found at {SOURCE_ICON}")
        return

    try:
        img = Image.open(SOURCE_ICON)
        
        # Save logo192.png
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(os.path.join(DEST_DIR, "logo192.png"))
        print("Created logo192.png")

        # Save logo512.png
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(os.path.join(DEST_DIR, "logo512.png"))
        print("Created logo512.png")

        # Save favicon.ico (64x64)
        img_fav = img.resize((64, 64), Image.Resampling.LANCZOS)
        img_fav.save(os.path.join(DEST_DIR, "favicon.ico"))
        print("Created favicon.ico")

    except Exception as e:
        print(f"Error processing icons: {e}")

if __name__ == "__main__":
    process_icons()
