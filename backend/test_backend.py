import os
from main import convert_to_pdf

doc_path = os.path.abspath(r"..\Adult Intake Form (1).doc")
pdf_path = os.path.abspath(r"..\test_output.pdf")

try:
    print(f"Converting {doc_path} to {pdf_path}")
    convert_to_pdf(doc_path, pdf_path)
    print("Success!")
except Exception as e:
    import traceback
    traceback.print_exc()
