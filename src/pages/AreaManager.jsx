import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const EMPTY = { am_code: '', am_name: '', address: '', cnic: '', contact_1: '', contact_2: '', status: 'active' };

export default function AreaManager({ searchFilter, clearSearchFilter }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'create', data: EMPTY });
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (searchFilter) {
      setSearch(searchFilter);
      clearSearchFilter?.();
    }
  }, [searchFilter, clearSearchFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try { 
      setRows(await api.listAM()); 
    } catch { 
      toast('Failed to load Area Managers', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = rows.filter(r =>
    !search ||
    r.am_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.am_code?.toLowerCase().includes(search.toLowerCase())
  );

  const validate = (d) => {
    const e = {};
    if (!d.am_code.trim()) e.am_code = 'Required';
    if (!d.am_name.trim()) e.am_name = 'Required';
    if (!d.cnic.trim()) e.cnic = 'Required';
    return e;
  };

  const openCreate = () => setModal({ open: true, mode: 'create', data: { ...EMPTY } });
  const openEdit = (row) => setModal({ open: true, mode: 'edit', data: { ...row } });

  const handleSave = async () => {
    const e = validate(modal.data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = modal.mode === 'create'
        ? await api.createAM(modal.data)
        : await api.updateAM(modal.data);
      if (res.ok) { 
        toast(`Area Manager ${modal.mode === 'create' ? 'created' : 'updated'}`, 'success'); 
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
    const res = await api.deleteAM(confirm.id);
    if (res.ok) { 
      toast('Area Manager deleted', 'success'); 
      load(); 
    } else {
      toast(res.error || 'Delete failed', 'error');
    }
    setConfirm({ open: false, id: null });
  };

  const set = (k, v) => { 
    setModal(m => ({ ...m, data: { ...m.data, [k]: v } })); 
    setErrors(e => ({ ...e, [k]: undefined })); 
  };

  const columns = [
    { key: 'am_code', label: 'AM Code', render: v => <span className="font-mono-data text-primary">{v}</span> },
    { key: 'am_name', label: 'Name' },
    { key: 'cnic', label: 'CNIC', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'contact_1', label: 'Contact', render: v => <span className="font-mono-data">{v || '—'}</span> },
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
    { key: 'no_of_ssms', label: 'SSMs', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'no_of_sms', label: 'SMs', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'no_of_srs', label: 'SRs', render: v => <span className="font-mono-data">{v}</span> },
    { key: 'total_business', label: 'Total Business', render: v => <span className="font-mono-data text-primary">{`Rs. ${Number(v || 0).toLocaleString()}`}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-actions toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
          <input
            id="am-search"
            className="w-full bg-surface-container border border-border-subtle rounded-lg pl-9 pr-4 py-1.5 text-body-md text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Search Area Manager..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          id="btn-create-am"
          className="flex items-center gap-1.5 bg-primary text-on-primary font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity"
          onClick={openCreate}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add AM
        </button>
      </div>

      <DataTable 
        columns={columns} 
        rows={filtered} 
        loading={loading}
        actions={row => (
          <div className="flex items-center gap-2">
            <button
              className="hover:text-primary transition-colors p-1 hover:bg-surface-variant/40 rounded"
              onClick={() => openEdit(row)}
              title="Edit AM"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
            <button
              className="hover:text-error transition-colors p-1 hover:bg-surface-variant/40 rounded"
              onClick={() => setConfirm({ open: true, id: row.id })}
              title="Delete AM"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        )}
      />

      {/* Form Modal */}
      <Modal 
        open={modal.open} 
        onClose={() => setModal(m => ({ ...m, open: false }))} 
        title={modal.mode === 'create' ? 'Add Area Manager' : 'Edit Area Manager'} 
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
            <div className="form-group">
              <label className="form-label required">AM Code</label>
              <input 
                className={`bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full ${errors.am_code ? 'border-error' : ''}`}
                value={modal.data.am_code || ''} 
                onChange={e => set('am_code', e.target.value)} 
              />
              {errors.am_code && <span className="text-error text-xs mt-1">{errors.am_code}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">AM Name</label>
              <input 
                className={`bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full ${errors.am_name ? 'border-error' : ''}`}
                value={modal.data.am_name || ''} 
                onChange={e => set('am_name', e.target.value)} 
              />
              {errors.am_name && <span className="text-error text-xs mt-1">{errors.am_name}</span>}
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

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea 
              className="bg-surface-deep border border-border-subtle text-on-surface rounded p-2 focus:ring-2 focus:ring-primary focus:outline-none w-full"
              value={modal.data.address || ''} 
              onChange={e => set('address', e.target.value)} 
              rows={2}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        open={confirm.open} 
        onClose={() => setConfirm({ open: false, id: null })} 
        onConfirm={handleDelete}
        title="Delete Area Manager Record" 
        message="Are you sure you want to delete this Area Manager? This action cannot be undone." 
      />
    </div>
  );
}
