import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import win32com.client
import pythoncom

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def convert_to_pdf(input_path: str, output_path: str):
    """Converts a Word document to PDF using win32com."""
    import pywintypes
    pythoncom.CoInitialize()
    try:
        word = win32com.client.Dispatch('Word.Application')
    except pywintypes.com_error:
        pythoncom.CoUninitialize()
        raise Exception("Microsoft Word is not installed on this system. Cannot convert .doc/.docx to PDF automatically. Please upload a PDF directly.")
        
    word.Visible = False
    doc = None
    try:
        doc = word.Documents.Open(input_path)
        doc.SaveAs(output_path, FileFormat=17) # 17 is wdFormatPDF
    except Exception as e:
        raise Exception(f"Failed to convert document: {e}")
    finally:
        if doc:
            doc.Close(False)
        word.Quit()
        pythoncom.CoUninitialize()

FORM_CONFIGS = {
    "InformedConsent": {"headers": [90, 80, 135, 135], "footer": 50},
    "IntakeForm": {"headers": [120, 80], "footer": 80},
    "RegistrationForm": {"headers": [95], "footer": 50},
}

def apply_overlay_to_pdf(pdf_path: str, action: str, form_type: str):
    """Applies a white rectangle overlay, and optionally restores the original watermark."""
    doc = fitz.open(pdf_path)
    
    config = FORM_CONFIGS.get(form_type, {"headers": [100], "footer": 80})
    headers = config["headers"]
    footer_height = config["footer"]
    
    src_doc = None
    if action == "restore" and form_type:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        src_path = os.path.join(base_dir, "original_forms", f"{form_type}.pdf")
        if os.path.exists(src_path):
            src_doc = fitz.open(src_path)
            
    for i, page in enumerate(doc):
        rect = page.rect
        
        # Get the header height for the current page, falling back to the last specified height
        current_header_height = headers[i] if i < len(headers) else headers[-1]
            
        if current_header_height > 0:
            header_rect = fitz.Rect(0, 0, rect.width, current_header_height)
            page.draw_rect(header_rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)
            for annot in page.annots():
                if annot.rect.intersects(header_rect):
                    page.delete_annot(annot)
            
            if src_doc:
                src_page_num = min(i, len(src_doc) - 1)
                page.show_pdf_page(header_rect, src_doc, pno=src_page_num, clip=header_rect, overlay=True)
        
        if footer_height > 0:
            footer_rect = fitz.Rect(0, rect.height - footer_height, rect.width, rect.height)
            page.draw_rect(footer_rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)
            for annot in page.annots():
                if annot.rect.intersects(footer_rect):
                    page.delete_annot(annot)
                    
            if src_doc:
                src_page_num = min(i, len(src_doc) - 1)
                page.show_pdf_page(footer_rect, src_doc, pno=src_page_num, clip=footer_rect, overlay=True)
    
    if src_doc:
        src_doc.close()
        
    tmp_path = pdf_path + ".tmp.pdf"
    doc.save(tmp_path)
    doc.close()
    os.replace(tmp_path, pdf_path)

@app.post("/process-document")
async def process_document(
    file: UploadFile = File(...),
    action: str = Form("remove"),
    form_type: str = Form("InformedConsent")
):
    try:
        temp_dir = tempfile.mkdtemp()
        
        original_filename = file.filename
        file_ext = os.path.splitext(original_filename)[1].lower()
        input_filepath = os.path.join(temp_dir, f"input{file_ext}")
        
        with open(input_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        pdf_filepath = os.path.join(temp_dir, "output.pdf")
        
        if file_ext in ['.doc', '.docx']:
            abs_input = os.path.abspath(input_filepath)
            abs_output = os.path.abspath(pdf_filepath)
            convert_to_pdf(abs_input, abs_output)
        elif file_ext == '.pdf':
            shutil.copyfile(input_filepath, pdf_filepath)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")

        apply_overlay_to_pdf(pdf_filepath, action, form_type)
        
        # Send the file back
        return FileResponse(
            path=pdf_filepath, 
            filename=f"processed_{os.path.splitext(original_filename)[0]}.pdf",
            media_type='application/pdf',
            background=None # we don't clean up temp dir immediately to allow download, could improve this
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
