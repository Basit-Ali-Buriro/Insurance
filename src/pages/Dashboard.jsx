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
    <div className="space-y-6">
      {/* Actions Toolbar */}
      <div className="flex justify-end gap-3 select-none">
        <button
          className="px-4 py-2 border border-border-subtle bg-surface-bright/20 hover:bg-surface-variant/40 rounded text-xs font-bold uppercase tracking-wider text-on-surface hover:text-primary transition-all flex items-center gap-2 outline-none"
          id="btn-download-backup"
          onClick={handleDownloadBackup}
        >
          <span className="material-symbols-outlined text-sm font-bold">backup</span>
          <span>Download Backup</span>
        </button>
        <button
          className="px-4 py-2 bg-primary text-on-primary font-bold hover:opacity-90 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 outline-none"
          id="btn-export-pdf"
          onClick={handleExportPDF}
        >
          <span className="material-symbols-outlined text-sm font-bold">picture_as_pdf</span>
          <span>Export Monthly Report</span>
        </button>
      </div>

      {/* Row 1 — Core KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Policies"   value={kpis?.totalPolicies}  icon="menu_book" loading={loading}
          trend={trendPct(currPrem, prevPrem)} onClick={() => onNavigate('policy')} />
        <KpiCard title="Total Proposals"  value={kpis?.totalProposals} icon="assignment" loading={loading}
          onClick={() => onNavigate('proposer')} />
        <KpiCard title="Total SRs"        value={kpis?.totalSRs}       icon="person" loading={loading}
          onClick={() => onNavigate('sr')} />
        <KpiCard title="Total SMs"        value={kpis?.totalSMs}       icon="groups" loading={loading}
          onClick={() => onNavigate('sm')} />
      </div>

      {/* Row 2 — Bento Grid (SSM card, Policies Due Soon, Financials) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SSM count card */}
        <div
          className="lg:col-span-3 bg-surface-bright border border-border-subtle rounded-lg p-6 flex flex-col justify-center items-center relative overflow-hidden select-none cursor-pointer hover:border-primary hover:-translate-y-0.5 transition-all shadow-sm duration-200"
          onClick={() => onNavigate('ssm')}
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 text-on-surface">
            <span className="material-symbols-outlined text-[100px]">stars</span>
          </div>
          <h3 className="text-label-caps font-label-caps text-on-surface-variant mb-2">Senior Sales Managers</h3>
          <div className="text-[64px] leading-none font-bold text-primary">
            {loading ? '—' : (kpis?.totalSSMs ?? 0).toString().padStart(2, '0')}
          </div>
          <p className="text-xs text-outline mt-4 font-semibold uppercase tracking-wider">Active regional SSMs</p>
        </div>

        {/* Policies Due Soon */}
        <div className="lg:col-span-5 bg-surface-bright border border-border-subtle rounded-lg flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center h-12 px-6 border-b border-border-subtle/50 select-none">
            <h3 className="text-label-caps font-label-caps text-on-surface uppercase tracking-wider font-bold">Policies Due Soon</h3>
            <div className="flex bg-surface-deep rounded p-0.5">
              {[7, 15, 30].map(d => (
                <button
                  key={d}
                  id={`btn-due-${d}`}
                  className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                    dueRange === d ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => setDueRange(d)}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div
                className="text-[54px] font-bold text-warning cursor-pointer hover:brightness-110 leading-none font-mono-data"
                onClick={() => onNavigate('notifications')}
                title="View approaching notifications"
              >
                {loading ? '—' : (dueCount ?? 0)}
              </div>
              <span className="text-xs text-outline font-semibold text-right leading-tight max-w-[150px]">
                Installments approaching renewal within chosen interval.
              </span>
            </div>
            
            <div className="mt-4 space-y-2 border-t border-border-subtle/30 pt-4 text-xs select-none">
              {[
                { label: '7 Days', val: kpis?.due7 },
                { label: '15 Days', val: kpis?.due15 },
                { label: '30 Days', val: kpis?.due30 }
              ].map(item => (
                <div key={item.label} className="flex justify-between text-on-surface-variant">
                  <span>Due within {item.label}:</span>
                  <span className="font-bold text-on-surface">{loading ? '—' : (item.val ?? 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="lg:col-span-4 bg-surface-bright border border-border-subtle rounded-lg p-6 flex flex-col justify-between shadow-sm">
          <h3 className="text-label-caps font-label-caps text-on-surface uppercase tracking-wider font-bold border-b border-border-subtle/30 pb-2 mb-2 select-none">Financial KPIs</h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">Current Month Premium</span>
              <div className="text-2xl font-bold text-success font-mono-data">
                {loading ? '—' : fmt(currPrem)}
              </div>
              {!loading && (
                <div className={`text-[10px] font-bold mt-1 flex items-center gap-0.5 ${currPrem >= prevPrem ? 'text-success' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-sm font-bold">{currPrem >= prevPrem ? 'trending_up' : 'trending_down'}</span>
                  <span>{Math.abs(trendPct(currPrem, prevPrem)).toFixed(1)}% vs last month</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-border-subtle/30 pt-3">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">Year-to-Date Premium</span>
              <div className="text-2xl font-bold text-primary font-mono-data">
                {loading ? '—' : fmt(kpis?.ytdPrem)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Monthly Bar Chart */}
      <div className="bg-surface-bright border border-border-subtle rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 select-none">
          <h3 className="text-headline-md font-bold text-on-surface">Monthly Premium Trends</h3>
          <div className="flex items-center gap-4 text-xs font-semibold text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-primary rounded-sm"></span> Collections
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyChart} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#273647" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip
              formatter={v => [fmt(v), 'Premium']}
              contentStyle={{ background: '#122131', border: '1px solid #334155', borderRadius: 4, fontSize: '0.75rem', color: '#d4e4fa' }}
              cursor={{ fill: 'rgba(173,198,255,0.04)' }}
            />
            <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 4 — Target Donuts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DonutChart
          id="monthly" title="Monthly Target Progress"
          achieved={currPrem} target={monthlyTarget}
          color="var(--accent)"
          onEditTarget={v => handleSaveTarget('monthly_target', v)}
        />
        <DonutChart
          id="yearly" title="Annual Growth Progress"
          achieved={kpis?.ytdPrem || 0} target={yearlyTarget}
          color="var(--success)"
          onEditTarget={v => handleSaveTarget('yearly_target', v)}
        />
      </div>

      {/* Row 5 — Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
        {/* Renewals */}
        <div
          className="bg-surface-bright border border-border-subtle rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px] cursor-pointer hover:border-primary hover:-translate-y-0.5 transition-all duration-200"
          onClick={() => onNavigate('policy')}
          id="widget-renewals"
        >
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider font-bold">Approaching Renewals</span>
          <div className="text-[42px] font-bold text-warning font-mono-data leading-none my-2">
            {loading ? '—' : (kpis?.renewals ?? 0)}
          </div>
          <p className="text-[11px] text-outline leading-tight font-medium">
            Policies with Last Paid Date exceeding 11 months ago.
          </p>
        </div>

        {/* Top SR */}
        <div className="bg-surface-bright border border-border-subtle rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]" id="widget-top-sr">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider font-bold">Top Representative (Month)</span>
          {loading || !kpis?.topSR ? (
            <div className="text-xs text-outline italic my-auto">No records found.</div>
          ) : (
            <div className="my-auto">
              <div className="text-lg font-bold text-on-surface truncate">{kpis.topSR.sr_name}</div>
              <div className="text-[11px] text-outline font-semibold uppercase tracking-wider mt-0.5">Code: {kpis.topSR.sr_code}</div>
              <div className="text-base font-bold text-success mt-2 font-mono-data">
                {fmt(kpis.topSR.biz)}
              </div>
            </div>
          )}
        </div>

        {/* Top SM */}
        <div className="bg-surface-bright border border-border-subtle rounded-lg p-6 shadow-sm flex flex-col justify-between min-h-[140px]" id="widget-top-sm">
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider font-bold">Top Manager (Month)</span>
          {loading || !kpis?.topSM ? (
            <div className="text-xs text-outline italic my-auto">No records found.</div>
          ) : (
            <div className="my-auto">
              <div className="text-lg font-bold text-on-surface truncate">{kpis.topSM.sm_name}</div>
              <div className="text-[11px] text-outline font-semibold uppercase tracking-wider mt-0.5">Code: {kpis.topSM.sm_code}</div>
              <div className="text-base font-bold text-success mt-2 font-mono-data">
                {fmt(kpis.topSM.biz)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

