import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Loader2, AlertCircle, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { api } from '../../services/api';
import CVUpload from '../../components/CVUpload';
import PageLayout from '../../components/PageLayout';
import type { CV } from '../../types';
import type { CandidateLayoutContext } from '../../layouts/CandidateLayout';

function cvLabel(cv: CV): string {
  return cv.display_name?.trim() || 'CV';
}

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
  const [replacingCvId, setReplacingCvId] = useState<number | null>(null);
  const [deletingCvId, setDeletingCvId] = useState<number | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const cvData = await api.getUserCV();
      setCvs(cvData);
      if (cvData.length > 0) {
        setSelectedCvId((prev) => {
          if (prev != null && cvData.some((c) => c.id === prev)) return prev;
          return cvData[0].id;
        });
      } else {
        setSelectedCvId(null);
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
      setError('');
      const blob = await api.downloadCVBlob(cvId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const row = cvs.find((c) => c.id === cvId);
      const raw = row?.display_name?.trim() || `cv-${cvId}`;
      a.download = raw.replace(/[<>:"/\\|?*\x00-\x1f]+/g, '_').slice(0, 120) || `cv-${cvId}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed.');
    }
  };

  const handleReplaceCv = async (cvId: number, file: File) => {
    try {
      setError('');
      setReplacingCvId(cvId);
      await api.replaceCV(cvId, file);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not replace this CV.');
    } finally {
      setReplacingCvId(null);
    }
  };

  const openReplacePicker = (cvId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.docx,.jpg,.jpeg,.png,image/jpeg,image/png';
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void handleReplaceCv(cvId, f);
    };
    input.click();
  };

  const handleDeleteCv = async (cvId: number) => {
    const ok = window.confirm(
      'Delete this CV permanently? You can only delete a CV that has not been used on any job application.',
    );
    if (!ok) return;
    try {
      setError('');
      setDeletingCvId(cvId);
      await api.deleteCV(cvId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete this CV.');
    } finally {
      setDeletingCvId(null);
    }
  };

  const startRename = (cv: CV) => {
    setRenamingId(cv.id);
    setRenameDraft(cvLabel(cv));
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft('');
  };

  const submitRename = async (cvId: number) => {
    const name = renameDraft.trim();
    if (!name) return;
    try {
      setRenameBusy(true);
      setError('');
      await api.patchCVDisplayName(cvId, name);
      await load();
      cancelRename();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not rename this CV.');
    } finally {
      setRenameBusy(false);
    }
  };

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex justify-center min-h-[40vh] items-center text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} />
          Loading CVs…
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="My CV"
      subtitle="Upload PDF, Word, or a clear photo of your CV. Replace a file to re-run analysis, or delete unused CVs (not allowed if you already applied with that CV)."
    >
      <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col gap-6">
        {error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        ) : null}
        <CVUpload
          onUploadSuccess={(cv) => {
            setCvs((prev) => [...prev.filter((c) => c.id !== cv.id), cv]);
            setSelectedCvId(cv.id);
            void load();
          }}
        />
        {cvs.length > 0 ? (
          <div className="flex flex-col gap-6">
            <div>
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
                    {cvLabel(cv)}
                    {cv.is_parsed ? ' · analyzed' : ' · not analyzed'}
                  </option>
                ))}
              </select>
            </div>
            <ul className="space-y-3">
              {cvs.map((cv) => {
                const parseErr = cvParseError(cv);
                return (
                  <li
                    key={cv.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/50"
                  >
                    <div className="min-w-0 flex-1">
                      {renamingId === cv.id ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          <input
                            type="text"
                            className="input-field max-w-md text-sm"
                            value={renameDraft}
                            onChange={(e) => setRenameDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void submitRename(cv.id);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            disabled={renameBusy}
                            aria-label="CV name"
                            autoFocus
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={renameBusy}
                              onClick={() => void submitRename(cv.id)}
                              className="text-xs font-bold px-3 py-2 rounded-xl bg-brand-primary text-white hover:opacity-95 disabled:opacity-50"
                            >
                              {renameBusy ? 'Saving…' : 'Save name'}
                            </button>
                            <button
                              type="button"
                              disabled={renameBusy}
                              onClick={cancelRename}
                              className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-bold text-brand-black break-words">{cvLabel(cv)}</p>
                          <p className="text-xs text-gray-500">
                            Uploaded {new Date(cv.uploaded_at).toLocaleString()} ·{' '}
                            {cv.is_parsed ? (
                              <span className="text-brand-primary font-semibold">Ready to apply</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">Analysis did not complete</span>
                            )}
                          </p>
                          {parseErr && (
                            <p className="text-xs text-red-600 mt-1">{parseErr}</p>
                          )}
                          {!cv.is_parsed && !parseErr && (
                            <p className="text-xs text-gray-500 mt-1">
                              Try again with a clearer PDF, DOCX, or photo.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {renamingId !== cv.id ? (
                        <button
                          type="button"
                          disabled={renameBusy}
                          onClick={() => startRename(cv)}
                          className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-primary flex items-center gap-1"
                        >
                          <Pencil size={14} /> Rename
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDownloadCv(cv.id)}
                        className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-primary flex items-center gap-1"
                      >
                        <Download size={14} /> Download
                      </button>
                      <button
                        type="button"
                        disabled={replacingCvId === cv.id}
                        onClick={() => openReplacePicker(cv.id)}
                        className="text-xs font-bold px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-primary flex items-center gap-1 disabled:opacity-50"
                      >
                        {replacingCvId === cv.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RefreshCw size={14} />
                        )}
                        Replace file
                      </button>
                      <button
                        type="button"
                        disabled={deletingCvId === cv.id}
                        onClick={() => void handleDeleteCv(cv.id)}
                        className="text-xs font-bold px-3 py-2 rounded-xl border border-red-100 text-red-700 hover:bg-red-50 flex items-center gap-1 disabled:opacity-50"
                      >
                        {deletingCvId === cv.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>
    </PageLayout>
  );
};

export default CandidateCvPage;
