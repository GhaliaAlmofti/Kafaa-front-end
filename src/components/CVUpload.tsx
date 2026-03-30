import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { CV } from '../types';

interface CVUploadProps {
    onUploadSuccess: (data: CV) => void;
}

const CVUpload = ({ onUploadSuccess }: CVUploadProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
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
            // 1. Upload the file to Django
            const uploadRes = await api.uploadCV(formData);

            // 2. Trigger AI Parsing
            setStatus('parsing');

            // parseRes now contains the full CV object: { id, file, parsed_data, ... }
            const parseRes = await api.parseCV(uploadRes.id);

            setStatus('success');

            // CRITICAL FIX: Pass the entire object so the dashboard gets the ID
            onUploadSuccess(parseRes);

        } catch (err: any) {
            console.error("CV Processing Error:", err);
            setStatus('error');
            setError(err.message || 'Failed to process CV. Please try again.');
        }
    };

    return (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white text-center">
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-sm border border-red-100">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {status === 'idle' && (
                <>
                    <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Upload your CV</h3>
                    <p className="text-gray-500 mb-6 text-sm">PDF or DOCX accepted (English or Arabic)</p>
                    <input
                        type="file"
                        id="cv-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.docx"
                    />
                    <label
                        htmlFor="cv-upload"
                        className="btn-secondary cursor-pointer inline-block px-8 py-3"
                    >
                        {file ? file.name : 'Select File'}
                    </label>

                    {file && (
                        <button
                            onClick={processCV}
                            className="btn-primary block mx-auto mt-4 px-10 py-3 rounded-xl font-bold"
                        >
                            Start AI Analysis
                        </button>
                    )}
                </>
            )}

            {(status === 'uploading' || status === 'parsing') && (
                <div className="py-10">
                    <Loader2 size={48} className="animate-spin text-brand-green mx-auto mb-4" />
                    <p className="text-lg font-semibold">
                        {status === 'uploading' ? 'Uploading file...' : 'AI is reading your CV...'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">This usually takes about 5-10 seconds</p>
                </div>
            )}

            {status === 'success' && (
                <div className="py-10 text-green-600">
                    <CheckCircle size={48} className="mx-auto mb-4" />
                    <p className="text-lg font-bold">Analysis Complete!</p>
                    <p className="text-sm text-gray-500 mt-2">Your profile has been updated.</p>
                </div>
            )}

            {status === 'error' && (
                <button
                    onClick={() => setStatus('idle')}
                    className="mt-4 text-brand-green font-bold text-sm underline"
                >
                    Try Again
                </button>
            )}
        </div>
    );
};

export default CVUpload;