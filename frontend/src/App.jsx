import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, Download, Loader2, Settings2, FileImage } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Settings state
  const [action, setAction] = useState('remove'); // 'remove' or 'restore'
  const [formType, setFormType] = useState('InformedConsent');
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    const validTypes = ['.doc', '.docx', '.pdf'];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (validTypes.includes(ext)) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please upload a .doc, .docx, or .pdf file.');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', action);
    formData.append('form_type', formType);
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/process-document', formData, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
      link.setAttribute('download', `processed_${originalName}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setError(json.detail || 'An error occurred during processing.');
        } catch (e) {
          setError('An error occurred while processing the document. Please ensure the backend is running.');
        }
      } else {
        setError('An error occurred while processing the document. Please ensure the backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-4xl mx-auto pt-16 px-6">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 text-blue-600 rounded-2xl mb-4">
            <FileImage size={32} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">DocMasker</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Easily upload your `.doc`, `.docx`, or `.pdf` files and automatically mask headers and footers with a clean white overlay to prepare them for processing.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Main Upload Area */}
          <div className="md:col-span-2 space-y-6">
            <div 
              className={cn(
                "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all",
                file ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              )}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <div className="p-4 bg-slate-100 rounded-full mb-4 text-slate-500">
                    <UploadCloud size={40} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Drag & drop your document here</h3>
                  <p className="text-slate-500 mb-6">Supports .doc, .docx, and .pdf files up to 50MB</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-slate-900 text-white font-medium rounded-full hover:bg-slate-800 transition-colors"
                  >
                    Browse Files
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".doc,.docx,.pdf"
                  />
                </>
              ) : (
                <>
                  <div className="p-4 bg-blue-100 rounded-full mb-4 text-blue-600">
                    <FileText size={40} />
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-slate-900">{file.name}</h3>
                  <p className="text-slate-500 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setFile(null)}
                      className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-full hover:bg-slate-50 transition-colors"
                    >
                      Clear
                    </button>
                    <button 
                      onClick={handleProcess}
                      disabled={loading}
                      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      {loading ? 'Processing...' : 'Process & Download'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl flex items-center gap-3">
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-red-600"></div>
                {error}
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-fit">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <Settings2 size={20} className="text-slate-400" />
              <h2 className="text-lg font-semibold">Overlay Settings</h2>
            </div>
            
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Form Type</label>
                <select 
                  value={formType} 
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="InformedConsent">Informed Consent</option>
                  <option value="IntakeForm">Intake Form</option>
                  <option value="RegistrationForm">Registration Form</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Select the type of document you are processing.</p>
              </div>

              {/* Action Selector */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700">Action</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors", action === 'remove' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    onClick={() => setAction('remove')}
                  >
                    Remove
                  </button>
                  <button
                    className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors", action === 'restore' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    onClick={() => setAction('restore')}
                  >
                    Restore
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {action === 'remove' ? 'Wipes the original headers and footers clean.' : 'Stamps the exact original watermark back onto the document.'}
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
