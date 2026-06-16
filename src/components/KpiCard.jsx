import React from 'react';

export default function KpiCard({ title, value, icon, trend, onClick, badgeLabel, badgeType = 'info', loading }) {
  const trendUp = trend >= 0;

  const renderIcon = () => {
    if (!icon) return null;
    const isEmoji = /\p{Emoji}/u.test(icon);
    if (isEmoji) {
      return <span className="text-[20px]">{icon}</span>;
    }
    // Match icon configurations
    let iconClass = "text-electric-blue";
    if (title?.toLowerCase().includes("ssm")) iconClass = "text-royal-purple";
    else if (title?.toLowerCase().includes("sm")) iconClass = "text-emerald-green";
    else if (title?.toLowerCase().includes("sr")) iconClass = "text-vivid-orange";
    else if (title?.toLowerCase().includes("proposal")) iconClass = "text-royal-purple";
    else if (title?.toLowerCase().includes("renewals")) iconClass = "text-vivid-orange";

    return (
      <div className={`p-2 bg-surface-container-highest rounded-lg ${iconClass} group-hover:scale-110 transition-transform duration-200 flex items-center justify-center`}>
        <span className="material-symbols-outlined text-[22px]">{icon}</span>
      </div>
    );
  };

  let hoverClass = "hover:border-electric-blue";
  if (title?.toLowerCase().includes("ssm")) hoverClass = "hover:border-royal-purple";
  else if (title?.toLowerCase().includes("sm")) hoverClass = "hover:border-emerald-green";
  else if (title?.toLowerCase().includes("sr")) hoverClass = "hover:border-vivid-orange";
  else if (title?.toLowerCase().includes("proposal")) hoverClass = "hover:border-royal-purple";
  else if (title?.toLowerCase().includes("renewals")) hoverClass = "hover:border-vivid-orange";

  return (
    <div
      className={`bg-slate-gray p-4 rounded-xl border border-outline-variant flex flex-col justify-between min-h-[130px] select-none transition-all duration-200 group ${
        onClick ? `cursor-pointer ${hoverClass} hover:-translate-y-0.5` : ''
      }`}
      onClick={onClick}
      id={`kpi-${title?.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Top row: Icon and Trend/Badge */}
      <div className="flex justify-between items-start">
        {renderIcon()}
        
        {trend !== undefined && !loading && (
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-0.5 ${trendUp ? 'text-emerald-green' : 'text-crimson-red'} font-bold text-sm`}>
              <span className="material-symbols-outlined text-base font-black">{trendUp ? 'trending_up' : 'trending_down'}</span>
              <span className="font-mono-data">{Math.abs(trend).toFixed(0)}%</span>
            </div>
            <span className="text-[11px] text-outline font-bold tracking-tight mt-0.5">vs previous month</span>
          </div>
        )}

        {badgeLabel && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            badgeType === 'success' || badgeType === 'valid' ? 'bg-success/15 text-success' :
            badgeType === 'warning' || badgeType === 'expiring' ? 'bg-warning/15 text-warning' :
            badgeType === 'error' || badgeType === 'expired' ? 'bg-error/15 text-error' :
            'bg-primary/15 text-primary'
          }`}>
            {badgeLabel}
          </span>
        )}
      </div>

      {/* Bottom row: Value and Label */}
      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-wider text-on-surface-variant font-bold">{title}</p>
        {loading ? (
          <div className="h-8 bg-surface-container-highest/50 rounded animate-pulse w-2/3 mt-1.5" />
        ) : (
          <h3 className="text-2xl text-on-surface mt-1 font-extrabold tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </h3>
        )}
      </div>
    </div>
  );
}
