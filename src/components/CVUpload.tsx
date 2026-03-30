import React, { useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const CVUpload = ({ onUploadSuccess }: { onUploadSuccess: (data: any) => void }) => {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const processCV = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);

        try {
            // 1. Upload to Django
            const uploadRes = await api.uploadCV(formData);

            // 2. Trigger AI Parsing
            setStatus('parsing');
            const parseRes = await api.parseCV(uploadRes.id);

            setStatus('success');
            onUploadSuccess(parseRes.data); // This is the 'CVData' from your AI schema
        } catch (err: any) {
            setStatus('error');
            setError(err.message || 'Failed to process CV');
        }
    };

    return (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl bg-white text-center">
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
                        <button onClick={processCV} className="btn-primary block mx-auto mt-4 px-10">
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
                </div>
            )}
        </div>
    );
};

export default CVUpload;