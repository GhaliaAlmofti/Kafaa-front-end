import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { CV } from '../types';
import { AIProTipsPlaceholder } from './ai';

interface CVUploadProps {
  onUploadSuccess: (data: CV) => void;
}

/** Warmer copy for known backend messages (after JSON is already parsed). */
function friendlyCvUploadMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (
    m.includes('could not identify') ||
    m.includes('not a valid cv') ||
    m.includes('valid cv')
  ) {
    return "We couldn't recognize this file as a résumé. Try a clear PDF, Word document, or a sharp photo of the page with usual sections (summary, experience, education).";
  }
  if (m.includes('too large') || m.includes('file too big')) {
    return 'That file is too large. Please upload a smaller file (PDF, Word, or image).';
  }
  return raw;
}

const CVUpload = ({ onUploadSuccess }: CVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setStatus('idle');
    }
  };

  const processCV = async () => {
    if (!file) return;

    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const cv = await api.uploadCV(formData);
      setStatus('success');
      onUploadSuccess(cv);
    } catch (err: unknown) {
      console.error('CV Processing Error:', err);
      const base =
        err instanceof Error && err.message.trim()
          ? err.message.trim()
          : 'We could not upload your CV. Check your connection and try again.';
      setStatus('error');
      setError(friendlyCvUploadMessage(base));
    }
  };

  return (
    <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white text-center">
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-left text-sm text-red-800"
        >
          <div className="flex gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <>
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Upload your CV</h3>
          <p className="text-gray-500 mb-6 text-sm">
            PDF, DOCX, JPG, or PNG (English or Arabic). Photos are read with AI—use good lighting and a straight shot.
            We analyze automatically after upload.
          </p>
          <input
            type="file"
            id="cv-upload"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.docx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
          />
          <label
            htmlFor="cv-upload"
            className="btn-secondary cursor-pointer inline-block px-8 py-3"
          >
            {file ? file.name : 'Select File'}
          </label>

          {file && (
            <button
              type="button"
              onClick={() => void processCV()}
              className="btn-primary block mx-auto mt-4 px-10 py-3 rounded-xl font-bold"
            >
              Upload and analyze
            </button>
          )}
        </>
      )}

      {status === 'uploading' && (
        <div className="py-8">
          <div className="ai-analyzing-banner mx-auto max-w-md px-4 py-4 text-center">
            <Loader2 size={40} className="mx-auto mb-3 animate-spin text-ai-violet" />
            <p className="flex items-center justify-center gap-2 text-base font-bold text-brand-black">
              <Sparkles size={18} className="text-ai-violet shrink-0" aria-hidden />
              <span className="ai-text-gradient">Uploading &amp; analyzing your CV</span>
            </p>
            <p className="mt-2 text-xs text-gray-500">This usually takes about 5–15 seconds.</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6 py-4 text-left">
          <div className="text-center text-green-600">
            <CheckCircle size={44} className="mx-auto mb-3" aria-hidden />
            <p className="text-lg font-bold">CV saved</p>
            <p className="mt-1 text-sm text-gray-500">Your file is stored and analysis has started.</p>
          </div>
          <AIProTipsPlaceholder />
        </div>
      )}

      {status === 'error' && (
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-brand-primary font-bold text-sm underline"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default CVUpload;
