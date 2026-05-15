# DocMasker Pro

DocMasker Pro is a full-stack web application designed to automate the processing of intake forms by precisely masking and restoring watermarks, headers, and footers. It supports `.doc`, `.docx`, and `.pdf` files.

## Features

- **Automated Masking**: Instantly clears watermarks and logos from documents based on pre-configured, pixel-perfect boundary definitions.
- **Smart Restoration**: Extracts original watermarks from pristine PDF templates and perfectly stamps them back onto processed or filled-out documents.
- **Document Conversion**: Automatically converts legacy Word documents (`.doc`, `.docx`) into PDFs using native COM automation.
- **Dynamic Configuration**: Supports multi-page forms with varying header heights per page (e.g., larger headers on page 1 vs page 2).
- **Modern UI**: Features a clean, drag-and-drop interface built with React and Tailwind CSS.

## Architecture

- **Frontend**: React, Vite, Tailwind CSS v4.
- **Backend**: Python, FastAPI, PyMuPDF (fitz) for PDF manipulation, `win32com` for Word-to-PDF conversion.

## Prerequisites

- **Python 3.8+**
- **Node.js** (for running the frontend development server)
- **Microsoft Word** (Must be installed on the host machine if you intend to convert `.doc` or `.docx` files).

## Setup & Running

1. **Clone the repository:**
   ```bash
   git clone https://github.com/josiahlaster/washmarker.git
   cd washmarker
   ```

2. **Add Original Forms (Optional but required for Restore mode):**
   Place your pristine PDF templates inside `backend/original_forms/` (e.g., `InformedConsent.pdf`, `IntakeForm.pdf`, `RegistrationForm.pdf`). 
   *Note: This folder is deliberately ignored by git for privacy.*

3. **Start the Application:**
   Simply double-click the `start.bat` file in the root directory. 
   
   This batch script will:
   - Install backend requirements and start the FastAPI server on `http://127.0.0.1:8000`.
   - Install frontend dependencies and start the Vite React app on `http://localhost:5173`.

## Usage

1. Open your browser to `http://localhost:5173`.
2. Select your target **Form Type** (Informed Consent, Intake Form, or Registration Form).
3. Select an **Action**:
   - **Remove**: Clears out the header and footer regions to produce a clean canvas.
   - **Restore**: Pulls the headers/footers from the original pristine PDFs and stamps them back onto the uploaded document.
4. Upload your document and click **Process & Download**.
