import React from 'react';

/**
 * KPI card with trend indicator.
 * Props: title, value, icon, trend(%), onClick, badgeLabel, badgeType
 */
export default function KpiCard({ title, value, icon, trend, onClick, badgeLabel, badgeType = 'info', loading }) {
  const trendUp = trend >= 0;

  // Map emoji/icon to Material symbols if applicable, else render as is
  const renderIcon = () => {
    if (!icon) return null;
    const isEmoji = /\p{Emoji}/u.test(icon);
    if (isEmoji) {
      return <span className="text-[20px] opacity-75">{icon}</span>;
    }
    return <span className="material-symbols-outlined text-[24px] text-primary/80">{icon}</span>;
  };

  return (
    <div
      className={`bg-surface-bright p-stack-md border border-border-subtle rounded-lg shadow-sm flex flex-col justify-between min-h-[120px] select-none transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5' : ''
      }`}
      onClick={onClick}
      id={`kpi-${title?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider">{title}</span>
        {renderIcon()}
      </div>

      <div className="my-auto">
        {loading ? (
          <div className="h-9 bg-surface-variant/30 rounded animate-pulse w-1/2" />
        ) : (
          <div className="text-display-kpi font-display-kpi text-on-surface leading-none">
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border-subtle/30">
        {trend !== undefined && !loading && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trendUp ? 'text-success' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm font-bold">{trendUp ? 'trending_up' : 'trending_down'}</span>
            {Math.abs(trend).toFixed(1)}% vs last month
          </span>
        )}
        {badgeLabel && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            badgeType === 'success' || badgeType === 'valid' ? 'bg-success/10 text-success' :
            badgeType === 'warning' || badgeType === 'expiring' ? 'bg-warning/10 text-warning' :
            badgeType === 'error' || badgeType === 'expired' ? 'bg-error/10 text-error' :
            'bg-primary/10 text-primary'
          }`}>
            {badgeLabel}
          </span>
        )}
        {onClick && !badgeLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary-container transition-colors ml-auto">
            View Register →
          </span>
        )}
      </div>
    </div>
  );
}

