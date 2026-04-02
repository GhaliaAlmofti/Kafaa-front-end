import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import CVUpload from '../../components/CVUpload';
import type { CV } from '../../types';
import type { CandidateLayoutContext } from '../../layouts/CandidateLayout';

function cvParseError(cv: CV): string | null {
  if (cv.is_parsed) return null;
  const pd = cv.parsed_data;
  if (pd && typeof pd === 'object' && 'error' in pd && typeof (pd as { error?: unknown }).error === 'string') {
    return (pd as { error: string }).error;
  }
  return null;
}

const CandidateCvPage = () => {
  const { selectedCvId, setSelectedCvId } = useOutletContext<CandidateLayoutContext>();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const cvData = await api.getUserCV();
      setCvs(cvData);
      if (cvData.length > 0) {
        setSelectedCvId((prev) => prev ?? cvData[0].id);
      }
    } catch {
      setError('Could not load CVs.');
    } finally {
      setLoading(false);
    }
  }, [setSelectedCvId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownloadCv = async (cvId: number) => {
    try {
      const blob = await api.downloadCVBlob(cvId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cv-${cvId}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500 gap-2">
        <Loader2 className="animate-spin" size={22} />
        Loading CVs…
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-black flex items-center gap-2">
          <FileText className="text-brand-green" size={28} /> My CV
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Upload a file — we analyze it automatically. Choose your default CV for applications on
          Find jobs.
        </p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        <CVUpload
          onUploadSuccess={(cv) => {
            setCvs((prev) => [...prev.filter((c) => c.id !== cv.id), cv]);
            setSelectedCvId(cv.id);
            void load();
          }}
        />
        {cvs.length > 0 && (
          <>
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Default CV for applications
              </label>
              <select
                className="input-field max-w-md"
                value={selectedCvId ?? ''}
                onChange={(e) => setSelectedCvId(Number(e.target.value))}
              >
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    CV #{cv.id}
                    {cv.is_parsed ? ' · analyzed' : ' · not analyzed'}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-6 space-y-3">
              {cvs.map((cv) => {
                const parseErr = cvParseError(cv);
                return (
                  <li
                    key={cv.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-brand-black">CV #{cv.id}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded {new Date(cv.uploaded_at).toLocaleString()} ·{' '}
                        {cv.is_parsed ? (
                          <span className="text-emerald-600 font-semibold">Ready to apply</span>
                        ) : (
                          <span className="text-amber-600 font-semibold">Analysis did not complete</span>
                        )}
                      </p>
                      {parseErr && (
                        <p className="text-xs text-red-600 mt-1">{parseErr}</p>
                      )}
                      {!cv.is_parsed && !parseErr && (
                        <p className="text-xs text-gray-500 mt-1">
                          Try uploading again with a clearer PDF or DOCX.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void handleDownloadCv(cv.id)}
                        className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-green flex items-center gap-1"
                      >
                        <Download size={14} /> Download
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

export default CandidateCvPage;
