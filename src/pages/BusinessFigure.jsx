import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const ROLES = ['SR', 'SM', 'SSM', 'AM'];

function today() { return new Date().toISOString().split('T')[0]; }
function monthStart() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().split('T')[0];
}
function fmt(n) { return `Rs. ${Number(n || 0).toLocaleString()}`; }

export default function BusinessFigure() {
  const toast = useToast();
  const [role, setRole] = useState('SR');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (role === 'SR') data = await api.srFigure({ from, to });
      else if (role === 'SM') data = await api.smFigure({ from, to });
      else if (role === 'SSM') data = await api.ssmFigure({ from, to });
      else data = await api.amFigure({ from, to });
      setRows(data || []);
    } catch {
      toast('Failed to load business figures', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(r => {
    if (!search) return true;
    const name = r.sr_name || r.sm_name || r.ssm_name || r.am_name || '';
    const code = r.sr_code || r.sm_code || r.ssm_code || r.am_code || '';
    return name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
  });

  // Grand totals
  const grandTotal = filtered.reduce((acc, r) => ({
    total_business: acc.total_business + (r.total_business || 0),
    no_of_policies: acc.no_of_policies + (r.no_of_policies || 0),
    second_year_premium: acc.second_year_premium + (r.second_year_premium || 0),
  }), { total_business: 0, no_of_policies: 0, second_year_premium: 0 });

  // Append grand total row
  const displayRows = filtered.length ? [
    ...filtered,
    {
      id: '__grand__',
      sr_code: '', sm_code: '', ssm_code: '', am_code: '',
      sr_name: 'GRAND TOTAL', sm_name: 'GRAND TOTAL', ssm_name: 'GRAND TOTAL', am_name: 'GRAND TOTAL',
      ssm_code_ref: '', sm_code_ref: '',
      total_business: grandTotal.total_business,
      no_of_policies: grandTotal.no_of_policies,
      no_of_srs_added: '', no_of_sms_added: '', no_of_ssms_added: '',
      second_year_premium: grandTotal.second_year_premium,
    }
  ] : [];

  const handleExportPDF = async () => {
    toast('Generating PDF performance report...', 'info');
    const res = await api.exportBusinessPDF({ from, to, role, data: displayRows });
    if (res?.ok) {
      toast(`PDF saved to: ${res.path}`, 'success');
    } else if (res?.ok === false && res?.canceled) {
      toast('Export cancelled', 'info');
    } else {
      toast(res?.error || 'PDF export failed', 'error');
    }
  };

  const handleExportExcel = async () => {
    toast('Generating Excel performance report...', 'info');
    const res = await api.exportBusinessExcel({ from, to, role, data: displayRows });
    if (res?.ok) {
      toast(`Excel saved to: ${res.path}`, 'success');
    } else if (res?.ok === false && res?.canceled) {
      toast('Export cancelled', 'info');
    } else {
      toast(res?.error || 'Excel export failed', 'error');
    }
  };

  const srCols = [
    { key: 'sr_code', label: 'SR Code' },
    { key: 'sr_name', label: 'SR Name' },
    { key: 'sm_code', label: 'SM Code' },
    { key: 'total_business', label: 'Total Business', render: v => fmt(v) },
    { key: 'no_of_policies', label: 'No of Policies' },
    { key: 'second_year_premium', label: '2nd Year Premium', render: v => fmt(v) },
  ];
  const smCols = [
    { key: 'sm_code', label: 'SM Code' },
    { key: 'sm_name', label: 'SM Name' },
    { key: 'ssm_code', label: 'SSM Code' },
    { key: 'total_business', label: 'Total Business', render: v => fmt(v) },
    { key: 'no_of_policies', label: 'No of Policies' },
    { key: 'no_of_srs_added', label: 'SRs Added' },
    { key: 'second_year_premium', label: '2nd Year Premium', render: v => fmt(v) },
  ];
  const ssmCols = [
    { key: 'ssm_code', label: 'SSM Code' },
    { key: 'ssm_name', label: 'SSM Name' },
    { key: 'am_name', label: 'Area Manager' },
    { key: 'total_business', label: 'Total Business', render: v => fmt(v) },
    { key: 'no_of_policies', label: 'No of Policies' },
    { key: 'no_of_srs_added', label: 'SRs Added' },
    { key: 'no_of_sms_added', label: 'SMs Added' },
    { key: 'second_year_premium', label: '2nd Year Premium', render: v => fmt(v) },
  ];

  const amCols = [
    { key: 'am_code', label: 'AM Code' },
    { key: 'am_name', label: 'AM Name' },
    { key: 'no_of_ssms_added', label: 'SSMs Added' },
    { key: 'no_of_sms_added', label: 'SMs Added' },
    { key: 'no_of_srs_added', label: 'SRs Added' },
    { key: 'total_business', label: 'Total Business', render: v => fmt(v) },
    { key: 'no_of_policies', label: 'No of Policies' },
    { key: 'second_year_premium', label: '2nd Year Premium', render: v => fmt(v) },
  ];

  const columns = role === 'SR' ? srCols : role === 'SM' ? smCols : role === 'SSM' ? ssmCols : amCols;



  return (
    <div className="space-y-6">
      {/* Controls */}
      <section className="glass-panel p-6 rounded-xl flex flex-wrap items-end justify-between gap-6 shadow-xl">
        <div className="flex flex-wrap gap-8 items-end">
          {/* Date Range Selectors */}
          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant opacity-70">DATE RANGE</label>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  id="bf-from"
                  type="date"
                  className="bg-surface-deep border border-border-subtle text-body-md p-2 rounded focus:ring-2 focus:ring-primary focus:outline-none w-40 text-on-surface"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                />
              </div>
              <span className="text-on-surface-variant font-medium mx-1">to</span>
              <div className="relative">
                <input
                  id="bf-to"
                  type="date"
                  className="bg-surface-deep border border-border-subtle text-body-md p-2 rounded focus:ring-2 focus:ring-primary focus:outline-none w-40 text-on-surface"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Role Filters */}
          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-surface-variant opacity-70">ROLE FILTER</label>
            <div className="flex bg-deep-charcoal p-1 rounded-lg border border-outline-variant">
              {ROLES.map(r => (
                <button
                  key={r}
                  id={`bf-role-${r}`}
                  className={`px-6 py-1.5 rounded-md font-semibold text-xs tracking-wider transition-all ${
                    role === r
                      ? 'bg-electric-blue text-white shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  onClick={() => {
                    setRole(r);
                    setSearch('');
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            id="btn-bf-reset"
            className="flex items-center gap-2 bg-surface-variant text-on-surface px-4 py-2 rounded font-body-md hover:bg-surface-container-highest transition-colors"
            onClick={() => {
              setFrom(monthStart());
              setTo(today());
            }}
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Reset
          </button>
          <button
            id="btn-bf-pdf"
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded font-bold hover:opacity-90 transition-opacity"
            onClick={handleExportPDF}
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            id="btn-bf-excel"
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded font-bold hover:opacity-90 transition-opacity"
            onClick={handleExportExcel}
          >
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
            Export Excel
          </button>
        </div>
      </section>

      {/* KPI Summary Cards */}
      {!loading && filtered.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-5 rounded-xl border-l-4 border-l-primary shadow-md">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">TOTAL BUSINESS</p>
              <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
            </div>
            <p className="font-display-kpi text-display-kpi text-primary">{fmt(grandTotal.total_business)}</p>
          </div>

          <div className="glass-panel p-5 rounded-xl border-l-4 border-l-success shadow-md">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">TOTAL POLICIES</p>
              <span className="material-symbols-outlined text-success text-[22px]">verified_user</span>
            </div>
            <p className="font-display-kpi text-display-kpi text-on-surface">{grandTotal.no_of_policies}</p>
          </div>

          <div className="glass-panel p-5 rounded-xl border-l-4 border-l-purple-500 shadow-md">
            <div className="flex justify-between items-start mb-2">
              <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">2ND YEAR PREMIUM</p>
              <span className="material-symbols-outlined text-purple-400 text-[22px]">rebase_edit</span>
            </div>
            <p className="font-display-kpi text-display-kpi text-on-surface">{fmt(grandTotal.second_year_premium)}</p>
          </div>
        </section>
      )}

      {/* Main Data Table Container */}
      <section className="glass-panel rounded-xl overflow-hidden shadow-2xl flex flex-col border border-border-subtle">
        <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface-container-low flex-wrap gap-4">
          <h2 className="font-headline-md text-headline-md text-on-surface">Agent Performance Metrics</h2>
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input
              id="bf-search"
              className="w-full bg-surface-deep border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Search by name or code..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-border-subtle">
                {columns.map(c => (
                  <th key={c.key} className="px-6 py-4 font-label-caps text-label-caps text-on-surface-variant">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="row-hover transition-colors">
                    {columns.map(c => (
                      <td key={c.key} className="px-6 py-4">
                        <div className="h-4 bg-surface-container-highest rounded animate-pulse w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : displayRows.length ? (
                displayRows.map((row, idx) => {
                  const isGrand = row.id === '__grand__';
                  if (isGrand) {
                    return (
                      <tr key={row.id ?? idx} className="bg-surface-container-highest border-t-2 border-primary/50 font-bold">
                        {columns.map(c => {
                          const val = c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—');
                          return (
                            <td
                              key={c.key}
                              className={`px-6 py-5 font-mono-data text-mono-data text-[15px] ${
                                c.key === 'total_business' || c.key === 'second_year_premium' ? 'text-primary' : 'text-on-surface'
                              }`}
                            >
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  }
                  return (
                    <tr key={row.id ?? idx} className="row-hover transition-colors">
                      {columns.map(c => {
                        const val = c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—');
                        const isCode = c.key.endsWith('_code');
                        return (
                          <td
                            key={c.key}
                            className={`px-6 py-3 text-body-md ${
                              isCode ? 'font-mono-data text-mono-data text-primary' : 'text-on-surface-variant'
                            }`}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-on-surface-variant">
                    No data for selected range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
