import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PageLayout from '../components/PageLayout';
import UserAvatarDisplay from '../components/UserAvatarDisplay';
import type { User, UserRole } from '../types';
import { formatApiErrorBody } from '../utils/apiErrorMessage';

function formatApiError(err: unknown, t: (k: string) => string): string {
  if (!(err instanceof Error)) return t('myAccount.somethingWrong');
  return formatApiErrorBody(err.message, err.message || t('myAccount.somethingWrong'));
}

function dashboardHref(role: UserRole | undefined): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'RECRUITER') return '/recruiter';
  return '/dashboard';
}

const MyAccount = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const roleLabel = (role: UserRole | undefined): string => {
    if (role === 'ADMIN') return t('myAccount.roleAdmin');
    if (role === 'RECRUITER') return t('myAccount.roleRecruiter');
    return t('myAccount.roleCandidate');
  };
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [major, setMajor] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const avatarPreviewRef = useRef<string | null>(null);

  const firstProfile = user?.is_verified && user.profiles?.length ? user.profiles[0] : undefined;

  const clearPendingAvatar = useCallback(() => {
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      avatarPreviewRef.current = null;
      return null;
    });
    setAvatarFile(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewRef.current) {
        URL.revokeObjectURL(avatarPreviewRef.current);
        avatarPreviewRef.current = null;
      }
    };
  }, []);

  const resetFormFromUser = useCallback((u: User) => {
    setUsername(u.username);
    setPhoneNumber(u.phone_number);
    const p = u.is_verified && u.profiles?.[0];
    if (p) {
      setMajor(p.major);
      setCity(p.city);
      setBio(p.bio ?? '');
    } else {
      setMajor('');
      setCity('');
      setBio('');
    }
  }, []);

  const handleStartEdit = () => {
    if (!user) return;
    clearPendingAvatar();
    resetFormFromUser(user);
    setError('');
    setEditing(true);
  };

  const handleCancelEdit = () => {
    clearPendingAvatar();
    if (user) resetFormFromUser(user);
    setError('');
    setEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await api.patchMe({
        username: username.trim(),
        phone_number: phoneNumber.trim(),
        ...(avatarFile ? { avatar: avatarFile } : {}),
      });
      clearPendingAvatar();
      if (firstProfile) {
        await api.patchProfile(firstProfile.id, {
          major: major.trim(),
          city: city.trim(),
          bio: bio.trim(),
        });
      }
      await refreshUser();
      setEditing(false);
    } catch (err) {
      setError(formatApiError(err, t));
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  const back = dashboardHref(user.role);

  return (
    <PageLayout
      maxWidth="medium"
      top={
        <Link
          to={back}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-primary"
        >
          <ArrowLeft size={18} aria-hidden />
          {t('myAccount.backToDashboard')}
        </Link>
      }
      title={t('myAccount.title')}
      subtitle={t('myAccount.subtitle')}
      actions={
        !editing ? (
          <button type="button" onClick={handleStartEdit} className="btn-primary inline-flex items-center gap-2">
            <Pencil size={18} aria-hidden />
            {t('myAccount.edit')}
          </button>
        ) : null
      }
    >
      <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8">
          {error ? (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-100">
              {error}
            </div>
          ) : null}

          {!editing ? (
            <dl className="space-y-5">
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.profilePhoto')}</dt>
                <dd className="mt-2">
                  <UserAvatarDisplay
                    photoUrl={user.avatar_url}
                    alt=""
                    className="w-20 h-20"
                    iconSize={36}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.username')}</dt>
                <dd className="mt-1 text-gray-900 font-medium">{user.username}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.phone')}</dt>
                <dd className="mt-1 text-gray-900 font-medium">{user.phone_number || t('common.dash')}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.accountType')}</dt>
                <dd className="mt-1 text-gray-900 font-medium">{roleLabel(user.role)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.verification')}</dt>
                <dd className="mt-1 text-gray-900 font-medium">
                  {user.is_verified ? t('myAccount.verified') : t('myAccount.pendingVerification')}
                </dd>
              </div>

              {firstProfile ? (
                <>
                  <div className="pt-4 border-t border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4">{t('myAccount.profile')}</h2>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.majorField')}</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{firstProfile.major}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.city')}</dt>
                    <dd className="mt-1 text-gray-900 font-medium">{firstProfile.city}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('myAccount.bio')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{firstProfile.bio || t('common.dash')}</dd>
                  </div>
                </>
              ) : user.is_verified ? (
                <p className="text-sm text-gray-500 pt-2">{t('myAccount.noProfileYet')}</p>
              ) : (
                <p className="text-sm text-gray-500 pt-2">{t('myAccount.completeVerification')}</p>
              )}
            </dl>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-2">Profile photo</span>
                <div className="flex flex-wrap items-center gap-4">
                  <UserAvatarDisplay
                    photoUrl={avatarPreview || user.avatar_url}
                    alt=""
                    className="w-20 h-20"
                    iconSize={36}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      ref={avatarInputRef}
                      id="account-avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                      className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary-soft file:text-brand-primary hover:file:bg-brand-primary/15"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setAvatarPreview((prev) => {
                          if (prev) URL.revokeObjectURL(prev);
                          const next = f ? URL.createObjectURL(f) : null;
                          avatarPreviewRef.current = next;
                          return next;
                        });
                        setAvatarFile(f);
                      }}
                    />
                    <p className="text-xs text-gray-500">{t('myAccount.photoHint')}</p>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="account-username" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('myAccount.username')}
                </label>
                <input
                  id="account-username"
                  className="input-field"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label htmlFor="account-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('myAccount.phoneNumber')}
                </label>
                <input
                  id="account-phone"
                  className="input-field"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="tel"
                  required
                />
              </div>

              {firstProfile ? (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">{t('myAccount.profile')}</p>
                  <div>
                    <label htmlFor="account-major" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('myAccount.majorField')}
                    </label>
                    <input
                      id="account-major"
                      className="input-field"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="account-city" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('myAccount.city')}
                    </label>
                    <input
                      id="account-city"
                      className="input-field"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="account-bio" className="block text-sm font-medium text-gray-700 mb-1">
                      {t('myAccount.bio')}
                    </label>
                    <textarea
                      id="account-bio"
                      className="input-field min-h-[100px] resize-y"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                    />
                  </div>
                </>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" className="btn-secondary px-5 py-2" onClick={handleCancelEdit}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary px-5 py-2 disabled:opacity-60" disabled={saving}>
                  {saving ? t('common.saving') : t('myAccount.saveChanges')}
                </button>
              </div>
            </form>
          )}
      </section>
    </PageLayout>
  );
};

export default MyAccount;
