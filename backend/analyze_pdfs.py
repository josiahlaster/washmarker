import fitz
import os

pdf_files = ["InformedConsent.pdf", "IntakeForm.pdf", "RegistrationForm.pdf"]
base_dir = os.path.dirname(os.path.abspath(__file__))

for filename in pdf_files:
    path = os.path.join(base_dir, "original_forms", filename)
    if not os.path.exists(path):
        print(f"{filename} not found.")
        continue
        
    doc = fitz.open(path)
    print(f"\n--- Analysis for {filename} ---")
    print(f"Total Pages: {len(doc)}")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        print(f"\nPage {page_num}: MediaBox: {page.rect}")
        
        # Look at images
        image_list = page.get_image_info()
        print(f"Images found: {len(image_list)}")
        for img in image_list:
            print(f"  Image bbox: {img['bbox']}")
            
        # Look at drawings/paths
        drawings = page.get_drawings()
        if drawings:
            # Find the bounding box of all drawings
            draw_rects = [d["rect"] for d in drawings]
            print(f"  Drawings found: {len(drawings)}")
            print(f"  Top drawing rect: {min(draw_rects, key=lambda r: r.y1)}")
            print(f"  Bottom drawing rect: {max(draw_rects, key=lambda r: r.y1)}")
            
        # Text blocks
        blocks = page.get_text("dict")["blocks"]
        text_blocks = [b for b in blocks if b["type"] == 0]
        if text_blocks:
            top_blocks = sorted(text_blocks, key=lambda b: b["bbox"][1])[:3]
            bottom_blocks = sorted(text_blocks, key=lambda b: b["bbox"][3], reverse=True)[:3]
            print("  Top text blocks:")
            for b in top_blocks:
                print(f"    bbox: {b['bbox']}")
            print("  Bottom text blocks:")
            for b in bottom_blocks:
                print(f"    bbox: {b['bbox']}")
