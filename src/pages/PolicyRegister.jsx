import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import SearchableDropdown from '../components/SearchableDropdown.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const EMPTY = { policy_no:'', holder_name:'', cnic:'', address:'', contact_1:'', contact_2:'', premium:'', issue_date:'', due_date:'', table_term:'', last_paid_date:'', sr_id:null, sm_id:null, ssm_id:null };

export default function PolicyRegister({ searchFilter, clearSearchFilter }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [srs,  setSRs]  = useState([]);
  const [sms,  setSMs]  = useState([]);
  const [ssms, setSSMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'create', data:EMPTY });
  const [confirm, setConfirm] = useState({ open:false, id:null });
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});

  useEffect(() => {
    if (searchFilter) {
      setSearch(searchFilter);
      clearSearchFilter?.();
    }
  }, [searchFilter, clearSearchFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, sr, sm, ssm] = await Promise.all([api.listPolicies(), api.listSR(), api.listSM(), api.listSSM()]);
      setRows(r); setSRs(sr); setSMs(sm); setSSMs(ssm);
    } catch { toast('Failed to load policies','error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const highlightId = urlParams.get('highlight');
    if (highlightId && rows.length > 0) {
      const matched = rows.find(r => r.id === Number(highlightId));
      if (matched && matched.policy_no && matched.policy_no.startsWith('TEMP-POL-')) {
        let editData = { ...matched };
        editData.policy_no = '';
        setModal({ open: true, mode: 'edit', data: editData });
        
        // Remove query param from browser URL without reloading
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState(null, '', url.pathname + url.search);
      }
    }
  }, [rows]);

  const handleExportExcel = async () => {
    toast('Generating Excel export of policy records...', 'info');
    const res = await api.exportPolicyExcel(filtered);
    if (res?.ok) {
      toast(`Excel saved to: ${res.path}`, 'success');
    } else if (res?.ok === false && res?.canceled) {
      toast('Export cancelled', 'info');
    } else {
      toast(res?.error || 'Excel export failed', 'error');
    }
  };

  const srOpts  = srs.map(s  => ({ value:s.id, label:`${s.sr_code} — ${s.sr_name}`   }));
  const smOpts  = sms.map(s  => ({ value:s.id, label:`${s.sm_code} — ${s.sm_name}`   }));
  const ssmOpts = ssms.map(s => ({ value:s.id, label:`${s.ssm_code} — ${s.ssm_name}` }));

  const filtered = rows.filter(r =>
    !search ||
    r.holder_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.policy_no?.toLowerCase().includes(search.toLowerCase()) ||
    r.sr_code?.toLowerCase().includes(search.toLowerCase()) ||
    r.sm_code?.toLowerCase().includes(search.toLowerCase()) ||
    r.ssm_code?.toLowerCase().includes(search.toLowerCase())
  );

  const validate = (d) => {
    const e = {};
    if (!d.policy_no.trim())  e.policy_no  = 'Required';
    if (!d.holder_name.trim())e.holder_name = 'Required';
    if (!d.cnic.trim())       e.cnic        = 'Required';
    if (!d.premium || isNaN(d.premium)) e.premium = 'Valid number required';
    if (!d.issue_date)        e.issue_date  = 'Required';
    return e;
  };

  const set = (k, v) => { setModal(m=>({...m, data:{...m.data,[k]:v}})); setErrors(e=>({...e,[k]:undefined})); };

  const handleSRChange = (srId) => {
    setModal(m => {
      const updatedData = { ...m.data, sr_id: srId };
      if (srId) {
        const selectedSR = srs.find(s => s.id === srId);
        if (selectedSR) {
          updatedData.sm_id = selectedSR.sm_id || null;
          updatedData.ssm_id = selectedSR.ssm_id || null;
        }
      }
      return { ...m, data: updatedData };
    });
    setErrors(e => ({ ...e, sr_id: undefined, sm_id: undefined, ssm_id: undefined }));
  };

  const handleSMChange = (smId) => {
    if (modal.data.sr_id) {
      const selectedSR = srs.find(s => s.id === modal.data.sr_id);
      if (selectedSR && selectedSR.sm_id !== smId) {
        const ok = window.confirm("Are you sure you want to change the SM? This deviates from the selected SR's default hierarchy.");
        if (!ok) return;
      }
    }
    set('sm_id', smId);
  };

  const handleSSMChange = (ssmId) => {
    if (modal.data.sr_id) {
      const selectedSR = srs.find(s => s.id === modal.data.sr_id);
      if (selectedSR && selectedSR.ssm_id !== ssmId) {
        const ok = window.confirm("Are you sure you want to change the SSM? This deviates from the selected SR's default hierarchy.");
        if (!ok) return;
      }
    }
    set('ssm_id', ssmId);
  };

  const handleSave = async () => {
    const e = validate(modal.data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = modal.mode==='create' ? await api.createPolicy(modal.data) : await api.updatePolicy(modal.data);
      if (res.ok) { toast(`Policy ${modal.mode==='create'?'created':'updated'}`, 'success'); setModal(m=>({...m,open:false})); load(); }
      else toast(res.error||'Save failed','error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const res = await api.deletePolicy(confirm.id);
    if (res.ok) { toast('Policy record deleted successfully','success'); load(); }
    else toast(res.error||'Delete failed','error');
    setConfirm({open:false,id:null});
  };

  const columns = [
    { key:'id',           label:'Serial No', render: (v, row) => <span className="font-mono-data">{filtered.indexOf(row) + 1}</span> },
    { key:'policy_no',    label:'Policy No', render: v => v && v.startsWith('TEMP-POL-') ? '' : v },
    { key:'holder_name',  label:'Holder Name' },
    { key:'cnic',         label:'CNIC' },
    { key:'address',      label:'Address' },
    { key:'contact_1',    label:'Contact 1' },
    { key:'contact_2',    label:'Contact 2' },
    { key:'premium',      label:'Premium', render: v=>`Rs. ${Number(v||0).toLocaleString()}` },
    { key:'issue_date',   label:'Issue Date' },
    { key:'due_date',     label:'Due Date' },
    { key:'table_term',    label:'Table Term' },
    { key:'last_paid_date',label:'Last Paid' },
    { key:'sr_code',      label:'SR Code' },
    { key:'sm_code',      label:'SM Code' },
    { key:'ssm_code',     label:'SSM Code' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none mb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            id="pol-search"
            className="bg-surface-deep border border-border-subtle text-on-surface rounded-full pl-9 pr-4 py-1.5 w-64 focus:ring-1 focus:ring-primary focus:border-primary text-body-md placeholder:text-outline-variant outline-none transition-all"
            placeholder="Search by name, policy no, SR/SM/SSM..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            id="btn-export-policies-excel"
            className="px-4 py-2 bg-green-600 hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 outline-none shadow-md"
            onClick={handleExportExcel}
          >
            <span className="material-symbols-outlined text-sm font-bold">table_chart</span>
            <span>Export Excel</span>
          </button>
          <button
            id="btn-create-policy"
            className="px-4 py-2 bg-primary hover:brightness-110 active:scale-[0.98] text-on-primary font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 outline-none shadow-md shadow-primary/10"
            onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY } })}
          >
            <span className="material-symbols-outlined text-sm font-bold">add</span>
            <span>Add Policy Record</span>
          </button>
        </div>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading}
        highlightId={new URLSearchParams(window.location.search).get('highlight')}
        actions={row=><>
          <button
            className="p-1.5 hover:text-primary transition-colors material-symbols-outlined text-[18px]"
            onClick={() => {
              let editData = { ...row };
              if (editData.policy_no && editData.policy_no.startsWith('TEMP-POL-')) {
                editData.policy_no = '';
              }
              setModal({ open: true, mode: 'edit', data: editData });
            }}
            title="Edit Policy"
          >
            edit
          </button>
          <button
            className="p-1.5 hover:text-error transition-colors material-symbols-outlined text-[18px]"
            onClick={() => setConfirm({ open: true, id: row.id })}
            title="Delete Policy"
          >
            delete
          </button>
        </>}
      />

      <Modal open={modal.open} onClose={()=>setModal(m=>({...m,open:false}))}
        title={modal.mode==='create'?'Add Policy Record':'Edit Policy Record'} size="lg"
        footer={<>
          <button
            className="px-4 py-2 border border-border-subtle hover:bg-surface-variant/30 text-on-surface rounded font-body-md text-body-md transition-colors outline-none"
            onClick={() => setModal(m => ({ ...m, open: false }))}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary text-on-primary hover:brightness-110 font-bold rounded transition-colors outline-none active:scale-95"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save Record'}
          </button>
        </>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
          {[
            ['policy_no','Policy Number',true,'text', 'PL-XXXX-XXXX'],
            ['holder_name','Policy Holder Name',true,'text', 'Full legal name'],
            ['cnic','CNIC / ID Number',true,'text', '00000-0000000-0'],
            ['contact_1','Contact No 1',false,'text', '+92 XXX XXXXXXX'],
            ['contact_2','Contact No 2',false,'text', '+92 XXX XXXXXXX'],
            ['premium','Premium Amount (PKR)',true,'number', '50,000'],
            ['issue_date','Issue Date',true,'date', ''],
            ['due_date','Due Date',false,'date', ''],
            ['table_term','Table Term',false,'text', 'e.g. 10 Years'],
            ['last_paid_date','Last Paid Date',false,'date', ''],
          ].map(([k,label,req,type,placeholder])=>(
            <div key={k} className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">
                {label} {req && <span className="text-error">*</span>}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                autoFocus={k === 'policy_no'}
                className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm ${
                  errors[k] ? 'border-error focus:border-error' : ''
                }`}
                value={modal.data[k]||''}
                onChange={e=>set(k,e.target.value)}
              />
              {errors[k]&&<span className="text-[11px] text-error font-semibold mt-0.5">{errors[k]}</span>}
            </div>
          ))}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Permanent Address</label>
            <textarea
              className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm resize-none"
              value={modal.data.address||''}
              onChange={e=>set('address',e.target.value)}
              placeholder="Building, Street, City"
              rows={2}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Assigned SR</label>
            <SearchableDropdown id="pol-sr" options={srOpts} value={modal.data.sr_id} onChange={handleSRChange} placeholder="Select SR…"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Assigned SM</label>
            <SearchableDropdown id="pol-sm" options={smOpts} value={modal.data.sm_id} onChange={handleSMChange} placeholder="Select SM…"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Assigned SSM</label>
            <SearchableDropdown id="pol-ssm" options={ssmOpts} value={modal.data.ssm_id} onChange={handleSSMChange} placeholder="Select SSM…"/>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})} onConfirm={handleDelete}
        title="Delete Policy Record" message="Are you sure you want to delete this policy record? This action cannot be undone." />
    </div>
  );
}

