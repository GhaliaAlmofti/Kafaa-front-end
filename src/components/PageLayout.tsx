import React from 'react';
import { cn } from '../lib/utils';

export type PageLayoutMaxWidth = 'narrow' | 'comfortable' | 'medium' | 'wide' | 'full';

const maxWidthMap: Record<PageLayoutMaxWidth, string> = {
  narrow: 'max-w-2xl',
  comfortable: 'max-w-3xl',
  medium: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
};

export type PageLayoutProps = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Renders above the title row (e.g. back link). */
  top?: React.ReactNode;
  /**
   * When false, the title/subtitle/actions block is not rendered.
   * Use with `top` and `children` only (e.g. detail pages with an in-card title).
   */
  showHeader?: boolean;
  maxWidth?: PageLayoutMaxWidth;
  className?: string;
  /** Applied to the vertical stack wrapping `children`. */
  contentClassName?: string;
  children: React.ReactNode;
};

const hasRenderableNode = (n: React.ReactNode) =>
  n != null && n !== false && n !== true && (typeof n !== 'string' || n.trim() !== '');

function PageLayoutShell({
  maxWidth = 'wide',
  className,
  children,
}: {
  maxWidth?: PageLayoutMaxWidth;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('w-full px-6 md:px-8 py-8 md:py-10', className)}>
      <div className={cn('mx-auto w-full', maxWidthMap[maxWidth])}>{children}</div>
    </div>
  );
}

/**
 * Shared shell for dashboard/account pages: consistent horizontal padding, max-width, header row, and vertical rhythm.
 */
function PageLayout({
  title,
  subtitle,
  actions,
  top,
  showHeader = true,
  maxWidth = 'wide',
  className,
  contentClassName,
  children,
}: PageLayoutProps) {
  const headerVisible =
    showHeader &&
    (hasRenderableNode(title) || hasRenderableNode(subtitle) || hasRenderableNode(actions));

  return (
    <div className={cn('w-full px-6 md:px-8 py-8 md:py-10', className)}>
      <div className={cn('mx-auto w-full', maxWidthMap[maxWidth])}>
        {hasRenderableNode(top) ? <div className="mb-6 md:mb-8">{top}</div> : null}

        {headerVisible ? (
          <header className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {hasRenderableNode(title) ? (
                <h1 className="text-3xl md:text-4xl font-bold text-brand-black flex flex-wrap items-center gap-2">
                  {title}
                </h1>
              ) : null}
              {hasRenderableNode(subtitle) ? (
                <p className="text-sm text-gray-500 mt-1.5 max-w-3xl">{subtitle}</p>
              ) : null}
            </div>
            {hasRenderableNode(actions) ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
            ) : null}
          </header>
        ) : null}

        <div className={cn('flex flex-col gap-6 md:gap-8', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

const PageLayoutExport = Object.assign(PageLayout, { Shell: PageLayoutShell });
const DashboardPage = PageLayoutExport;

export { PageLayoutExport as PageLayout, DashboardPage };
export default PageLayoutExport;
