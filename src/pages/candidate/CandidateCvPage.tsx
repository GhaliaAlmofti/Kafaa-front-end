import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import CVUpload from '../../components/CVUpload';
import type { CV } from '../../types';
import type { CandidateLayoutContext } from '../../layouts/CandidateLayout';

const CandidateCvPage = () => {
  const { selectedCvId, setSelectedCvId } = useOutletContext<CandidateLayoutContext>();
  const [cvs, setCvs] = useState<CV[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [parsingCvId, setParsingCvId] = useState<number | null>(null);

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

  const handleParseCv = async (cvId: number) => {
    try {
      setParsingCvId(cvId);
      setError('');
      const updated = await api.parseCV(cvId);
      setCvs((prev) => prev.map((c) => (c.id === cvId ? updated : c)));
    } catch {
      setError('Could not parse this CV. Try again later.');
    } finally {
      setParsingCvId(null);
    }
  };

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
          Upload, parse with AI, and set the default CV used when you apply from Find jobs.
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
                    {cv.is_parsed ? ' · parsed' : ' · not parsed'}
                  </option>
                ))}
              </select>
            </div>
            <ul className="mt-6 space-y-3">
              {cvs.map((cv) => (
                <li
                  key={cv.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                >
                  <div>
                    <p className="font-bold text-brand-black">CV #{cv.id}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(cv.uploaded_at).toLocaleString()} ·{' '}
                      {cv.is_parsed ? (
                        <span className="text-emerald-600 font-semibold">Ready for ranking</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Parse recommended</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDownloadCv(cv.id)}
                      className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-green flex items-center gap-1"
                    >
                      <Download size={14} /> Download
                    </button>
                    {!cv.is_parsed && (
                      <button
                        type="button"
                        disabled={parsingCvId === cv.id}
                        onClick={() => void handleParseCv(cv.id)}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-brand-green text-white hover:bg-opacity-90 flex items-center gap-1 disabled:opacity-50"
                      >
                        {parsingCvId === cv.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Parse CV
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

export default CandidateCvPage;
