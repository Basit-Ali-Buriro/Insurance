import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const ROLE_TYPES = ['SR', 'SM', 'SSM'];

export default function ShowTeam() {
  const toast = useToast();
  const [roleFilter, setRoleFilter] = useState('SR');
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ SR: [], SM: [], SSM: [] });
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [srs, sms, ssms] = await Promise.all([api.listSR(), api.listSM(), api.listSSM()]);
      setData({ SR: srs, SM: sms, SSM: ssms });
    } catch { 
      toast('Failed to load team data', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rawRows = data[roleFilter] || [];
  const filtered = rawRows.filter(r => {
    if (!search) return true;
    const name = r.sr_name || r.sm_name || r.ssm_name || '';
    const code = r.sr_code || r.sm_code || r.ssm_code || '';
    return name.toLowerCase().includes(search.toLowerCase()) || code.toLowerCase().includes(search.toLowerCase());
  });

  const srColumns = [
    { key: 'sr_code', label: 'SR Code', render: v => <span className="font-mono-data text-primary">{v}</span> },
    { key: 'sr_name', label: 'SR Name' },
    { key: 'cnic', label: 'CNIC', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'contact_1', label: 'Contact', render: v => <span className="font-mono-data">{v || '—'}</span> },
    { key: 'sm_code', label: 'SM Code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { key: 'ssm_code', label: 'SSM Code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { key: 'am_code', label: 'AM Code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { 
      key: 'status', 
      label: 'Status', 
      render: v => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          v === 'active' ? 'bg-success/15 text-success' : 'bg-outline-variant/20 text-outline'
        }`}>
          {v}
        </span>
      ) 
    },
    { key: 'no_of_policies', label: 'Policies', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'second_year_premium', label: '2nd Yr Prem', render: v => <span className="font-mono-data text-primary">{`Rs. ${Number(v || 0).toLocaleString()}`}</span> },
  ];

  const smColumns = [
    { key: 'sm_code', label: 'SM Code', render: v => <span className="font-mono-data text-primary">{v}</span> },
    { key: 'sm_name', label: 'SM Name' },
    { key: 'cnic', label: 'CNIC', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'contact_1', label: 'Contact', render: v => <span className="font-mono-data">{v || '—'}</span> },
    { key: 'ssm_code', label: 'SSM Code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { key: 'am_code', label: 'AM Code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { 
      key: 'status', 
      label: 'Status', 
      render: v => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          v === 'active' ? 'bg-success/15 text-success' : 'bg-outline-variant/20 text-outline'
        }`}>
          {v}
        </span>
      ) 
    },
    { key: 'no_of_srs', label: 'SRs', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'total_business', label: 'Total Business', render: v => <span className="font-mono-data text-primary">{`Rs. ${Number(v || 0).toLocaleString()}`}</span> },
  ];

  const ssmColumns = [
    { key: 'ssm_code', label: 'SSM Code', render: v => <span className="font-mono-data text-primary">{v}</span> },
    { key: 'ssm_name', label: 'SSM Name' },
    { key: 'cnic', label: 'CNIC', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'contact_1', label: 'Contact', render: v => <span className="font-mono-data">{v || '—'}</span> },
    { key: 'am_code', label: 'AM Code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { 
      key: 'status', 
      label: 'Status', 
      render: v => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
          v === 'active' ? 'bg-success/15 text-success' : 'bg-outline-variant/20 text-outline'
        }`}>
          {v}
        </span>
      ) 
    },
    { key: 'no_of_sms', label: 'SMs', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'no_of_srs', label: 'SRs', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'total_business', label: 'Total Business', render: v => <span className="font-mono-data text-primary">{`Rs. ${Number(v || 0).toLocaleString()}`}</span> },
  ];

  const columns = roleFilter === 'SR' ? srColumns : roleFilter === 'SM' ? smColumns : ssmColumns;

  return (
    <div className="space-y-6">
      {/* Sub-actions toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              id="team-search"
              className="w-full bg-surface-container border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder={`Search by name or code...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1 bg-surface-container p-1 rounded-lg border border-border-subtle">
            {ROLE_TYPES.map(t => (
              <button
                key={t}
                id={`team-filter-${t}`}
                className={`px-6 py-1.5 rounded font-body-md transition-all ${
                  roleFilter === t
                    ? 'text-primary bg-primary-container/20 border border-primary/30'
                    : 'text-on-surface-variant hover:bg-surface-variant'
                }`}
                onClick={() => {
                  setRoleFilter(t);
                  setSearch('');
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
        Showing <strong className="text-primary">{filtered.length}</strong> {roleFilter} records
      </div>

      <DataTable 
        columns={columns} 
        rows={filtered} 
        loading={loading} 
        emptyMsg={`No ${roleFilter} records found.`}
        actions={row => (
          <div className="flex items-center gap-2">
            <button
              className="hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/40 rounded flex items-center justify-center"
              onClick={() => setPreviewData(row)}
              title="View Documents / Attachments"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
            </button>
          </div>
        )}
      />

      {/* Document Preview Modal */}
      {previewData && (
        <Modal
          open={!!previewData}
          onClose={() => setPreviewData(null)}
          title={`Documents — ${previewData.sr_name || previewData.sm_name || previewData.ssm_name || 'Team Member'}`}
          size="lg"
          footer={
            <button
              className="flex items-center gap-1.5 bg-surface-variant hover:bg-surface-container-highest text-on-surface transition-colors px-4 py-2 rounded"
              onClick={() => setPreviewData(null)}
            >
              Close
            </button>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'CNIC Picture', key: 'cnic_pic' },
                { label: 'Nominee CNIC Picture', key: 'nominee_cnic_pic' },
                { label: 'Matric Certificate', key: 'matric_cert' },
                { label: 'Intermediate Certificate', key: 'intermediate_cert' },
                { label: 'Degree Certificate', key: 'degree_cert' }
              ].map(doc => {
                const path = previewData[doc.key];
                return (
                  <div key={doc.key} className="glass-panel p-4 rounded-xl border border-border-subtle flex flex-col justify-between gap-3 bg-surface-deep/30">
                    <div>
                      <p className="font-label-caps text-label-caps text-on-surface-variant opacity-75">{doc.label}</p>
                      {path ? (
                        <p className="text-body-md text-on-surface font-semibold truncate mt-1.5" title={path}>
                          {path.split(/[\\/]/).pop()}
                        </p>
                      ) : (
                        <p className="text-body-md text-outline italic mt-1.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          Not Uploaded
                        </p>
                      )}
                    </div>
                    {path && (
                      <button
                        className="flex items-center justify-center gap-1.5 bg-primary text-on-primary text-xs py-1.5 rounded font-bold hover:opacity-90 transition-opacity w-full mt-2"
                        onClick={async () => {
                          const res = await api.openFile(path);
                          if (!res.ok) {
                            toast(res.error || 'Failed to open file', 'error');
                          }
                        }}
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        Open / Preview
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
