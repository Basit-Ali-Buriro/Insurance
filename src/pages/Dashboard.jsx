import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import KpiCard    from '../components/KpiCard.jsx';
import DonutChart from '../components/DonutChart.jsx';
import api        from '../lib/api.js';
import { useToast } from '../components/Toast.jsx';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmt(n) { return `Rs. ${Number(n||0).toLocaleString()}`; }
function trendPct(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

export default function Dashboard({ onNavigate }) {
  const toast = useToast();
  const [kpis,    setKpis]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [dueRange, setDueRange] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.dashboardKpis();
      setKpis(data);
    } catch (err) {
      toast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleSaveTarget = async (key, value) => {
    await api.saveTarget({ key, value });
    toast('Target updated successfully', 'success');
    load();
  };

  const handleDownloadBackup = async () => {
    const res = await api.downloadBackup();
    if (res?.ok) toast('Database backup saved successfully', 'success');
    else if (res?.ok === false) toast('Backup cancelled', 'info');
    else toast('Database backup failed', 'error');
  };

  const handleExportPDF = async () => {
    toast('Generating PDF monthly report...', 'info');
    const res = await api.exportDashboardPDF();
    if (res?.ok) {
      toast(`PDF saved to: ${res.path}`, 'success');
    } else if (res?.ok === false && res?.canceled) {
      toast('Export cancelled', 'info');
    } else {
      toast(res?.error || 'PDF export failed', 'error');
    }
  };

  const monthlyChart = (kpis?.monthlyChart || []).map((m) => ({
    name: `${MONTHS[m.month - 1]} ${String(m.year).slice(-2)}`, value: m.premium,
  }));

  const dueCount = dueRange === 7 ? kpis?.due7 : dueRange === 15 ? kpis?.due15 : kpis?.due30;

  const monthlyTarget = parseFloat(kpis?.config?.monthly_target || 0);
  const yearlyTarget  = parseFloat(kpis?.config?.yearly_target  || 0);

  const prevPrem = kpis?.prevMonthPrem || 0;
  const currPrem = kpis?.currentMonthPrem || 0;

  return (
    <div className="space-y-6 select-none font-['Outfit']">
      {/* Action Toolbar */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface">Dashboard Overview</h2>
          <p className="text-sm font-semibold text-on-surface-variant mt-1">Real-time enterprise performance metrics.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 border border-outline-variant bg-slate-gray rounded-lg hover:bg-surface-container-high transition-colors font-semibold text-xs tracking-wider text-on-surface hover:text-electric-blue uppercase outline-none"
          >
            <span className="material-symbols-outlined text-sm">download</span> Download PDF
          </button>
          <button 
            onClick={handleDownloadBackup}
            className="flex items-center gap-2 px-5 py-2.5 bg-electric-blue text-white rounded-lg hover:brightness-110 active:scale-[0.98] transition-all font-semibold text-xs tracking-wider uppercase outline-none shadow-md shadow-electric-blue/20"
          >
            <span className="material-symbols-outlined text-sm">cloud_download</span> Download Backup
          </button>
        </div>
      </div>

      {/* Row 1 KPI Cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <KpiCard 
            title="Total Policies" 
            value={kpis?.totalPolicies} 
            icon="description" 
            loading={loading}
            trend={trendPct(kpis?.currPolicies || 0, kpis?.prevPolicies || 0)} 
            onClick={() => onNavigate('policy')} 
          />
        </div>
        <div className="col-span-12 md:col-span-5">
          <KpiCard 
            title="Total Proposals" 
            value={kpis?.totalProposals} 
            icon="assignment" 
            loading={loading}
            trend={trendPct(kpis?.currProposals || 0, kpis?.prevProposals || 0)} 
            onClick={() => onNavigate('proposer')} 
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <KpiCard 
            title="Approaching Renewals" 
            value={kpis?.renewals} 
            icon="history" 
            loading={loading}
            onClick={() => onNavigate('policy')} 
          />
        </div>
      </div>

      {/* Row 2 KPI Cards */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3">
          <KpiCard 
            title="Total SRs" 
            value={kpis?.totalSRs} 
            icon="support_agent" 
            loading={loading}
            onClick={() => onNavigate('sr')} 
          />
        </div>
        <div className="col-span-12 md:col-span-4">
          <KpiCard 
            title="Total SMs" 
            value={kpis?.totalSMs} 
            icon="handshake" 
            loading={loading}
            onClick={() => onNavigate('sm')} 
          />
        </div>
        <div className="col-span-12 md:col-span-5">
          <KpiCard 
            title="Total SSM" 
            value={kpis?.totalSSMs} 
            icon="stars" 
            loading={loading}
            onClick={() => onNavigate('ssm')} 
          />
        </div>
      </div>

      {/* Row 3: Monthly Premium Trends Chart (Full Width) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 bg-slate-gray rounded-xl border border-outline-variant p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-extrabold text-on-surface">Monthly Premium Overview</h4>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                <span className="w-3 h-3 rounded bg-electric-blue"></span> Premium
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={v => [fmt(v), 'Premium']}
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-primary)' }}
                  cursor={{ fill: 'rgba(0, 122, 255, 0.04)' }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={28} className="chart-bar-hover" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Performers & Renewals Due Widget */}
      <div className="grid grid-cols-12 gap-6">
        {/* Performers (Left - stacked, col-span-8) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Top SR */}
          <div className="bg-slate-gray p-6 rounded-xl border border-outline-variant flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-300">
              <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            </div>
            <div className="w-16 h-16 rounded-full border-2 border-electric-blue flex items-center justify-center text-electric-blue bg-electric-blue/10 text-xl font-bold font-title uppercase shrink-0">
              {kpis?.topSR?.sr_name ? kpis.topSR.sr_name.slice(0, 2) : 'SR'}
            </div>
            <div className="flex-grow z-10 truncate">
              <p className="text-xs text-electric-blue uppercase font-black tracking-wider">Top Sales Representative (Month)</p>
              <h4 className="text-xl font-extrabold text-on-surface mt-1 truncate">
                {loading || !kpis?.topSR ? 'No Active Performance Records' : kpis.topSR.sr_name}
              </h4>
              <div className="flex items-center gap-6 mt-3 text-xs font-semibold text-on-surface-variant">
                <div>
                  <p className="text-[11px] text-outline uppercase font-bold tracking-wider">Total Premium</p>
                  <p className="text-on-surface font-mono font-bold mt-0.5 text-sm">{loading || !kpis?.topSR ? 'Rs. 0' : fmt(kpis.topSR.biz)}</p>
                </div>
                <div className="w-[1px] h-6 bg-outline-variant"></div>
                <div>
                  <p className="text-[11px] text-outline uppercase font-bold tracking-wider">Representative Code</p>
                  <p className="text-on-surface font-mono font-bold mt-0.5 text-sm">{loading || !kpis?.topSR ? 'SR-XXXX' : kpis.topSR.sr_code}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top SM */}
          <div className="bg-slate-gray p-6 rounded-xl border border-outline-variant flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-300">
              <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
            </div>
            <div className="w-16 h-16 rounded-full border-2 border-emerald-green flex items-center justify-center text-emerald-green bg-emerald-green/10 text-xl font-bold font-title uppercase shrink-0">
              {kpis?.topSM?.sm_name ? kpis.topSM.sm_name.slice(0, 2) : 'SM'}
            </div>
            <div className="flex-grow z-10 truncate">
              <p className="text-xs text-emerald-green uppercase font-black tracking-wider">Top Sales Manager (Month)</p>
              <h4 className="text-xl font-extrabold text-on-surface mt-1 truncate">
                {loading || !kpis?.topSM ? 'No Active Manager Performance' : kpis.topSM.sm_name}
              </h4>
              <div className="flex items-center gap-6 mt-3 text-xs font-semibold text-on-surface-variant">
                <div>
                  <p className="text-[11px] text-outline uppercase font-bold tracking-wider">Team Premium</p>
                  <p className="text-on-surface font-mono font-bold mt-0.5 text-sm">{loading || !kpis?.topSM ? 'Rs. 0' : fmt(kpis.topSM.biz)}</p>
                </div>
                <div className="w-[1px] h-6 bg-outline-variant"></div>
                <div>
                  <p className="text-[11px] text-outline uppercase font-bold tracking-wider">Manager Code</p>
                  <p className="text-on-surface font-mono font-bold mt-0.5 text-sm">{loading || !kpis?.topSM ? 'SM-XXXX' : kpis.topSM.sm_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Renewals Due Widget (Right, col-span-4) */}
        <div className="col-span-12 lg:col-span-4 bg-slate-gray rounded-xl border border-outline-variant flex flex-col justify-between overflow-hidden">
          <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-deep-charcoal/20">
            <h4 className="text-lg font-extrabold text-on-surface">Renewals Due</h4>
            <div className="flex bg-deep-charcoal p-0.5 rounded-lg border border-outline-variant/50">
              {[7, 15, 30].map(d => (
                <button
                  key={d}
                  id={`btn-due-${d}`}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    dueRange === d ? 'bg-electric-blue text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => setDueRange(d)}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center gap-6 min-h-[180px]">
            <div className="flex items-center justify-between">
              <div 
                onClick={() => onNavigate('notifications')}
                className="text-6xl font-black text-vivid-orange cursor-pointer hover:brightness-110 leading-none font-mono tracking-tight"
                title="Click to view alerts"
              >
                {loading ? '—' : (dueCount ?? 0)}
              </div>
              <span className="text-xs text-on-surface-variant font-bold text-right leading-relaxed max-w-[170px]">
                Active policies approaching installment limits within selected buffer.
              </span>
            </div>

            <div className="space-y-2.5 border-t border-outline-variant/30 pt-4 text-sm font-bold text-on-surface-variant">
              {[
                { label: '7 Days Buffer', val: kpis?.due7 },
                { label: '15 Days Buffer', val: kpis?.due15 },
                { label: '30 Days Buffer', val: kpis?.due30 }
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center">
                  <span>Due within {item.label}:</span>
                  <span className="font-mono text-on-surface font-black text-sm">{loading ? '—' : (item.val ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Target donut charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          id="monthly" title="Monthly Target Achieved"
          achieved={currPrem} target={monthlyTarget}
          color="var(--accent)"
          onEditTarget={v => handleSaveTarget('monthly_target', v)}
        />
        <DonutChart
          id="yearly" title="Yearly Target Achieved"
          achieved={kpis?.ytdPrem || 0} target={yearlyTarget}
          color="var(--accent-green)"
          onEditTarget={v => handleSaveTarget('yearly_target', v)}
        />
      </div>
    </div>
  );
}
