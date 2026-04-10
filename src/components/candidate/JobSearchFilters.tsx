import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Banknote, Building2, Briefcase, MapPin, Radio, SlidersHorizontal, X } from 'lucide-react';
import type { JobSeniority, JobWorkMode } from '../../types';

export type JobSearchSidebarProps = {
  /** Distinct location strings from loaded jobs */
  cities: string[];
  city: string;
  onCityChange: (value: string) => void;
  salaryMin: string;
  salaryMax: string;
  onSalaryMinChange: (value: string) => void;
  onSalaryMaxChange: (value: string) => void;
  seniority: string;
  onSeniorityChange: (value: string) => void;
  workMode: string;
  onWorkModeChange: (value: string) => void;
  onClear: () => void;
  activeFilterCount: number;
};

export function JobSearchFilters({
  cities,
  city,
  onCityChange,
  salaryMin,
  salaryMax,
  onSalaryMinChange,
  onSalaryMaxChange,
  seniority,
  onSeniorityChange,
  workMode,
  onWorkModeChange,
  onClear,
  activeFilterCount,
}: JobSearchSidebarProps) {
  const { t } = useTranslation();

  const seniorityOptions = useMemo(
    (): { value: JobSeniority | ''; label: string }[] => [
      { value: '', label: t('jobSearchFilters.anyLevel') },
      { value: 'intern', label: t('jobSearchFilters.intern') },
      { value: 'junior', label: t('jobSearchFilters.junior') },
      { value: 'mid', label: t('jobSearchFilters.mid') },
      { value: 'senior', label: t('jobSearchFilters.senior') },
      { value: 'lead', label: t('jobSearchFilters.lead') },
      { value: 'executive', label: t('jobSearchFilters.executive') },
    ],
    [t],
  );

  const workModeOptions = useMemo(
    (): { value: JobWorkMode | ''; label: string }[] => [
      { value: '', label: t('jobSearchFilters.any') },
      { value: 'remote', label: t('workMode.remote') },
      { value: 'hybrid', label: t('workMode.hybrid') },
      { value: 'on_site', label: t('workMode.on_site') },
    ],
    [t],
  );

  return (
    <aside
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4 lg:self-start"
      aria-label={t('jobSearchFilters.aria')}
    >
      <div className="flex items-start justify-between gap-2 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary-soft text-brand-primary">
            <SlidersHorizontal size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black text-brand-black uppercase tracking-wide">{t('jobSearchFilters.title')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{t('jobSearchFilters.subtitle')}</p>
          </div>
        </div>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-brand-primary hover:underline"
          >
            <X size={14} aria-hidden />
            {t('jobSearchFilters.clear', { count: activeFilterCount })}
          </button>
        ) : null}
      </div>

      <div className="space-y-6">
        <div>
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
            <MapPin size={14} className="text-brand-primary" aria-hidden />
            {t('jobSearchFilters.city')}
          </label>
          <select
            className="input-field w-full text-sm"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          >
            <option value="">{t('jobSearchFilters.allCities')}</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
            <Banknote size={14} className="text-brand-primary" aria-hidden />
            {t('jobSearchFilters.salaryMonthly')}
          </label>
          <p className="text-[11px] text-gray-500 mb-2">{t('jobSearchFilters.salaryHint')}</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="sr-only">{t('jobSearchFilters.min')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t('jobSearchFilters.min')}
                className="input-field w-full text-sm tabular-nums"
                value={salaryMin}
                onChange={(e) => onSalaryMinChange(e.target.value)}
              />
            </div>
            <div>
              <span className="sr-only">{t('jobSearchFilters.max')}</span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder={t('jobSearchFilters.max')}
                className="input-field w-full text-sm tabular-nums"
                value={salaryMax}
                onChange={(e) => onSalaryMaxChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
            <Briefcase size={14} className="text-brand-primary" aria-hidden />
            {t('jobSearchFilters.seniority')}
          </label>
          <select
            className="input-field w-full text-sm"
            value={seniority}
            onChange={(e) => onSeniorityChange(e.target.value)}
          >
            {seniorityOptions.map((o) => (
              <option key={o.value || 'any'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
            <Radio size={14} className="text-brand-primary" aria-hidden />
            {t('jobSearchFilters.workArrangement')}
          </label>
          <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('jobSearchFilters.workModeGroup')}>
            {workModeOptions.map((o) => {
              const id = `wm-${o.value || 'any'}`;
              return (
                <label
                  key={o.value || 'any'}
                  htmlFor={id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                    workMode === o.value
                      ? 'border-brand-primary bg-brand-primary-faint ring-1 ring-brand-primary/20'
                      : 'border-gray-100 hover:border-gray-200 bg-gray-50/80'
                  }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name="work_mode_filter"
                    className="sr-only"
                    checked={workMode === o.value}
                    onChange={() => onWorkModeChange(o.value)}
                  />
                  <Building2 size={16} className="text-gray-500 shrink-0" aria-hidden />
                  <span className="text-sm font-semibold text-brand-black">{o.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}
