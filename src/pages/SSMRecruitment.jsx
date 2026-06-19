import React, { useState, useEffect, useCallback, useRef } from 'react';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import SearchableDropdown from '../components/SearchableDropdown.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const EMPTY = { 
  ssm_code: '', 
  ssm_name: '', 
  relation: '',
  address: '', 
  cnic: '', 
  contact_1: '', 
  contact_2: '', 
  am_id: null, 
  status: 'active',
  cnic_pic: '',
  nominee_cnic_pic: '',
  matric_cert: '',
  intermediate_cert: '',
  degree_cert: '',
  passport_pic: '',
  registration_no: '',
  registration_date: ''
};

function FileAttachmentInput({ label, value, fieldName, code, onChange }) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const handleUpload = async (e) => {
    e.stopPropagation();
    try {
      setUploading(true);
      const resPath = await api.uploadRecruitmentFile({ code: code || 'temp', fieldName });
      if (resPath) {
        onChange(resPath);
        toast(`${label} attached successfully!`, 'success');
      }
    } catch (err) {
      console.error(err);
      toast(err?.message || `Failed to attach ${label}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const fileName = value ? value.split(/[\\/]/).pop() : '';

  return (
    <div 
      className="border border-dashed border-border-subtle rounded-lg p-3 bg-surface-deep/50 hover:bg-surface-deep/80 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group relative h-24"
      onClick={handleUpload}
    >
      {uploading ? (
        <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
      ) : value ? (
        <div className="text-center w-full px-2">
          <span className="material-symbols-outlined text-success text-[24px] mb-1">description</span>
          <p className="text-[11px] font-semibold text-on-surface truncate" title={value}>{fileName}</p>
          <button 
            type="button"
            className="text-[10px] text-error hover:underline mt-1 block mx-auto z-10"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-[24px]">cloud_upload</span>
          <span className="text-body-md font-semibold text-on-surface-variant text-[12px]">{label}</span>
          <span className="text-[9px] text-outline">Click to attach</span>
        </>
      )}
    </div>
  );
}

export default function SSMRecruitment({ searchFilter, clearSearchFilter }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [ams, setAMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: EMPTY });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (searchFilter) {
      setSearch(searchFilter);
      clearSearchFilter?.();
    }
  }, [searchFilter, clearSearchFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([api.listSSM(), api.listAM()]);
      setRows(r); setAMs(a);
    } catch { 
      toast('Failed to load SSM data', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const amOpts = ams.map(a => ({ value: a.id, label: `${a.am_code} — ${a.am_name}` }));

  const filtered = rows.filter(r => {
    const matchSearch = !search ||
      r.ssm_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.ssm_code?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const validate = (d) => {
    const e = {};
    if (!d.ssm_code.trim()) e.ssm_code = 'Required';
    if (!d.ssm_name.trim()) e.ssm_name = 'Required';
    if (!d.cnic.trim()) e.cnic = 'Required';
    return e;
  };

  const set = (k, v) => { 
    setModal(m => ({ ...m, data: { ...m.data, [k]: v } })); 
    setErrors(e => ({ ...e, [k]: undefined })); 
  };

  const handleSave = async () => {
    const e = validate(modal.data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = modal.mode === 'create' ? await api.createSSM(modal.data) : await api.updateSSM(modal.data);
      if (res.ok) { 
        toast(`SSM ${modal.mode === 'create' ? 'created' : 'updated'}`, 'success'); 
        setModal(m => ({ ...m, open: false })); 
        load(); 
      } else {
        toast(res.error || 'Save failed', 'error');
      }
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    const res = await api.deleteSSM(confirm.id);
    if (res.ok) { 
      toast('SSM deleted', 'success'); 
      load(); 
    } else {
      toast(res.error || 'Delete failed', 'error');
    }
    setConfirm({ open: false, id: null });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const columns = [
    { key: 'id', label: 'Serial No', render: (v, row) => <span className="font-mono-data">{filtered.indexOf(row) + 1}</span> },
    { key: 'ssm_code', label: 'SSM code', render: v => <span className="font-mono-data text-primary">{v}</span> },
    { key: 'ssm_name', label: 'Name' },
    { key: 'relation', label: 'Son/Daughter/Wife of' },
    { key: 'cnic', label: 'CNIC', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'contact_1', label: 'Contact 1', render: v => <span className="font-mono-data">{v || '—'}</span> },
    { key: 'contact_2', label: 'Contact 2', render: v => <span className="font-mono-data">{v || '—'}</span> },
    { key: 'address', label: 'Address' },
    { key: 'am_code', label: 'AM code', render: v => v ? <span className="font-mono-data text-secondary">{v}</span> : '—' },
    { key: 'registration_no', label: 'Registration No' },
    { key: 'registration_date', label: 'Registration Date', render: v => formatDate(v) },
    { key: 'no_of_srs', label: "No of SR's", render: v => <span className="font-mono-data">{v}</span> },
    { key: 'no_of_sms', label: "No of SM's", render: v => <span className="font-mono-data">{v}</span> },
    { key: 'total_business', label: 'Total Business', render: v => <span className="font-mono-data text-primary">{`Rs. ${Number(v || 0).toLocaleString()}`}</span> },
    { key: 'second_year_premium', label: '2nd year premium', render: v => <span className="font-mono-data text-primary">{`Rs. ${Number(v || 0).toLocaleString()}`}</span> },
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
  ];

  return (
    <div className="space-y-6">
      {/* Sub-actions toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              id="ssm-search"
              className="w-full bg-surface-container border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
              placeholder="Search SSM..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="bg-surface-container border border-border-subtle rounded-lg text-body-md text-on-surface p-2 focus:ring-2 focus:ring-primary focus:outline-none w-36 cursor-pointer"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          id="btn-create-ssm"
          className="flex items-center gap-1.5 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
          onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY } })}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add SSM
        </button>
      </div>

      <DataTable 
        columns={columns} 
        rows={filtered} 
        loading={loading}
        highlightId={new URLSearchParams(window.location.search).get('highlight')}
        actions={row => (
          <div className="flex items-center gap-2">
            <button
              className="hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/40 rounded flex items-center justify-center"
              onClick={() => setPreviewData(row)}
              title="View Documents / Attachments"
            >
              <span className="material-symbols-outlined text-[18px]">folder_open</span>
            </button>
            <button
              className="hover:text-primary transition-colors p-1.5 hover:bg-surface-variant/40 rounded flex items-center justify-center"
              onClick={() => setModal({ open: true, mode: 'edit', data: { ...row } })}
              title="Edit SSM"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
              className="hover:text-error transition-colors p-1.5 hover:bg-surface-variant/40 rounded flex items-center justify-center"
              onClick={() => setConfirm({ open: true, id: row.id })}
              title="Delete SSM"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        )}
      />

      <Modal 
        open={modal.open} 
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.mode === 'create' ? 'Add SSM Record' : 'Edit SSM Record'} 
        size="lg"
        footer={<>
          <button 
            className="flex items-center gap-1.5 bg-surface-variant hover:bg-surface-container-highest text-on-surface transition-colors px-4 py-2 rounded" 
            onClick={() => setModal(m => ({ ...m, open: false }))}
          >
            Cancel
          </button>
          <button 
            className="flex items-center gap-1.5 bg-primary text-on-primary font-bold px-5 py-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? <span className="animate-spin h-4 w-4 border-2 border-on-primary border-t-transparent rounded-full" /> : 'Save'}
          </button>
        </>}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Form Fields */}
            <div className="form-group">
              <label className="form-label required">SSM Code</label>
              <input 
                autoFocus
                className={`bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full ${errors.ssm_code ? 'border-error' : ''}`}
                value={modal.data.ssm_code || ''} 
                onChange={e => set('ssm_code', e.target.value)} 
              />
              {errors.ssm_code && <span className="text-error text-xs mt-1">{errors.ssm_code}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">SSM Name</label>
              <input 
                className={`bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full ${errors.ssm_name ? 'border-error' : ''}`}
                value={modal.data.ssm_name || ''} 
                onChange={e => set('ssm_name', e.target.value)} 
              />
              {errors.ssm_name && <span className="text-error text-xs mt-1">{errors.ssm_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Son/Daughter/Wife of</label>
              <input 
                className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
                value={modal.data.relation || ''} 
                onChange={e => set('relation', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label required">CNIC</label>
              <input 
                className={`bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full ${errors.cnic ? 'border-error' : ''}`}
                value={modal.data.cnic || ''} 
                placeholder="35201-XXXXXXX-X"
                onChange={e => set('cnic', e.target.value)} 
              />
              {errors.cnic && <span className="text-error text-xs mt-1">{errors.cnic}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Contact 1</label>
              <input 
                className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
                value={modal.data.contact_1 || ''} 
                onChange={e => set('contact_1', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact 2</label>
              <input 
                className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
                value={modal.data.contact_2 || ''} 
                onChange={e => set('contact_2', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Registration No</label>
              <input 
                className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
                value={modal.data.registration_no || ''} 
                onChange={e => set('registration_no', e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full cursor-pointer"
                value={modal.data.status} 
                onChange={e => set('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Area Manager</label>
              <div className="relative">
                <SearchableDropdown id="ssm-am" options={amOpts} value={modal.data.am_id} onChange={v => set('am_id', v)} placeholder="Select Area Manager…" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Registration Date</label>
              <input 
                type="date"
                className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
                value={modal.data.registration_date || ''} 
                onChange={e => set('registration_date', e.target.value)} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea 
              className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
              value={modal.data.address || ''} 
              onChange={e => set('address', e.target.value)} 
              rows={2}
            />
          </div>

          {/* File Attachments Area */}
          <div className="border-t border-border-subtle pt-4 space-y-3">
            <label className="font-label-caps text-label-caps text-on-surface-variant opacity-70">FILE ATTACHMENTS</label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <FileAttachmentInput 
                label="Passport Size Picture" 
                value={modal.data.passport_pic} 
                fieldName="passport_pic"
                code={modal.data.ssm_code}
                onChange={v => set('passport_pic', v)} 
              />
              <FileAttachmentInput 
                label="CNIC Picture" 
                value={modal.data.cnic_pic} 
                fieldName="cnic_pic"
                code={modal.data.ssm_code}
                onChange={v => set('cnic_pic', v)} 
              />
              <FileAttachmentInput 
                label="Nominee CNIC" 
                value={modal.data.nominee_cnic_pic} 
                fieldName="nominee_cnic_pic"
                code={modal.data.ssm_code}
                onChange={v => set('nominee_cnic_pic', v)} 
              />
              <FileAttachmentInput 
                label="Matric Cert" 
                value={modal.data.matric_cert} 
                fieldName="matric_cert"
                code={modal.data.ssm_code}
                onChange={v => set('matric_cert', v)} 
              />
              <FileAttachmentInput 
                label="Inter Cert" 
                value={modal.data.intermediate_cert} 
                fieldName="intermediate_cert"
                code={modal.data.ssm_code}
                onChange={v => set('intermediate_cert', v)} 
              />
              <FileAttachmentInput 
                label="Degree Cert" 
                value={modal.data.degree_cert} 
                fieldName="degree_cert"
                code={modal.data.ssm_code}
                onChange={v => set('degree_cert', v)} 
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        open={confirm.open} 
        onClose={() => setConfirm({ open: false, id: null })} 
        onConfirm={handleDelete}
        title="Delete SSM Record" 
        message="Are you sure you want to delete this Senior Sales Manager? This action cannot be undone." 
      />

      {/* Document Preview Modal */}
      {previewData && (
        <Modal
          open={!!previewData}
          onClose={() => setPreviewData(null)}
          title={`Documents — ${previewData.ssm_name || 'Senior Sales Manager'}`}
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
                { label: 'Passport Size Picture', key: 'passport_pic' },
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
                        Open File
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
