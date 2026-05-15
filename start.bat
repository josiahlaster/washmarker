@echo off
echo Starting DocMasker Backend...
start cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

echo Starting DocMasker Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both services started!
