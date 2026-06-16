import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import SearchableDropdown from '../components/SearchableDropdown.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const EMPTY = { proposal_no:'', holder_name:'', premium:'', pr_no:'', pr_date:'', amount_type:'cash', requirements:'', sr_id:null, sm_id:null, ssm_id:null, status:'not_ok' };

export default function ProposerRegister({ onNavigate, searchFilter, clearSearchFilter }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [srs,  setSRs]  = useState([]);
  const [sms,  setSMs]  = useState([]);
  const [ssms, setSSMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState({ open:false, mode:'create', data:EMPTY });
  const [confirm, setConfirm] = useState({ open:false, id:null, type:'delete' });
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [convertId, setConvertId] = useState(null);

  useEffect(() => {
    if (searchFilter) {
      setSearch(searchFilter);
      clearSearchFilter?.();
    }
  }, [searchFilter, clearSearchFilter]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, sr, sm, ssm] = await Promise.all([api.listProposers(), api.listSR(), api.listSM(), api.listSSM()]);
      setRows(r); setSRs(sr); setSMs(sm); setSSMs(ssm);
    } catch { toast('Failed to load proposals','error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const srOpts  = srs.map(s  => ({ value:s.id, label:`${s.sr_code} — ${s.sr_name}`   }));
  const smOpts  = sms.map(s  => ({ value:s.id, label:`${s.sm_code} — ${s.sm_name}`   }));
  const ssmOpts = ssms.map(s => ({ value:s.id, label:`${s.ssm_code} — ${s.ssm_name}` }));

  const filtered = rows.filter(r =>
    !search ||
    r.holder_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.proposal_no?.toLowerCase().includes(search.toLowerCase()) ||
    r.sr_code?.toLowerCase().includes(search.toLowerCase()) ||
    r.sm_code?.toLowerCase().includes(search.toLowerCase())
  );

  const validate = (d) => {
    const e = {};
    if (!d.proposal_no.trim()) e.proposal_no = 'Required';
    if (!d.holder_name.trim()) e.holder_name = 'Required';
    if (!d.premium || isNaN(d.premium)) e.premium = 'Valid number required';
    return e;
  };

  const set = (k, v) => { setModal(m=>({...m, data:{...m.data,[k]:v}})); setErrors(e=>({...e,[k]:undefined})); };

  const handleSave = async () => {
    const e = validate(modal.data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const willConvert = modal.data.status === 'ok' && modal.mode === 'edit';
    try {
      const res = modal.mode==='create' ? await api.createProposer(modal.data) : await api.updateProposer(modal.data);
      if (res.ok) {
        toast(`Proposal ${modal.mode==='create'?'created':'updated'}`, 'success');
        setModal(m=>({...m,open:false}));
        load();
        if (willConvert && !modal.data.converted_to_policy) setConvertId(modal.data.id);
      } else toast(res.error||'Save failed','error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const res = await api.deleteProposer(confirm.id);
    if (res.ok) { toast('Proposal deleted successfully','success'); load(); }
    else toast(res.error||'Delete failed','error');
    setConfirm({open:false,id:null,type:'delete'});
  };

  const handleConvert = async () => {
    const res = await api.convertProposerToPolicy(convertId);
    if (res.ok) {
      toast('Proposal converted successfully. Complete the policy record.','success');
      setConvertId(null);
      onNavigate('policy');
    } else {
      toast(res.error||'Conversion failed','error');
      setConvertId(null);
    }
  };

  const columns = [
    { key:'proposal_no',  label:'Proposal No' },
    { key:'holder_name',  label:'Holder Name' },
    { key:'premium',      label:'Premium', render: v=>`Rs. ${Number(v).toLocaleString()}` },
    { key:'pr_no',        label:'PR No' },
    { key:'pr_date',      label:'PR Date' },
    { key:'amount_type',  label:'Type', render: v=><span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">{v}</span> },
    { key:'sr_code',      label:'SR Code' },
    { key:'sm_code',      label:'SM Code' },
    { key:'status',       label:'Status', render: v=><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${v==='ok'?'bg-success/10 text-success':'bg-warning/10 text-warning'}`}>{v==='not_ok'?'Not OK':'OK'}</span> },
    { key:'converted_to_policy', label:'Converted', render: v=><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${v?'bg-success/15 text-success':'bg-surface-variant/40 text-outline'}`}>{v?'Yes':'No'}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none mb-2">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">search</span>
          <input
            id="prop-search"
            className="bg-surface-deep border border-border-subtle text-on-surface rounded-full pl-9 pr-4 py-1.5 w-64 focus:ring-1 focus:ring-primary focus:border-primary text-body-md placeholder:text-outline-variant outline-none transition-all"
            placeholder="Search by name, proposal no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          id="btn-create-proposer"
          className="px-4 py-2 bg-primary hover:brightness-110 active:scale-[0.98] text-on-primary font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 outline-none shadow-md shadow-primary/10"
          onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY } })}
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          <span>Add Proposal</span>
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} loading={loading}
        actions={row=><>
          <button
            className="p-1.5 hover:text-primary transition-colors material-symbols-outlined text-[18px]"
            onClick={() => setModal({ open: true, mode: 'edit', data: { ...row } })}
            title="Edit Proposal"
          >
            edit
          </button>
          <button
            className="p-1.5 hover:text-error transition-colors material-symbols-outlined text-[18px]"
            onClick={() => setConfirm({ open: true, id: row.id, type: 'delete' })}
            title="Delete Proposal"
          >
            delete
          </button>
          {!row.converted_to_policy && row.status==='ok' && (
            <button
              className="p-1.5 hover:text-success transition-colors material-symbols-outlined text-[18px]"
              onClick={() => setConvertId(row.id)}
              title="Convert to Policy"
            >
              check_circle
            </button>
          )}
        </>}
      />

      {/* Form Modal */}
      <Modal open={modal.open} onClose={()=>setModal(m=>({...m,open:false}))}
        title={modal.mode==='create'?'Add Proposal Record':'Edit Proposal Record'} size="lg"
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
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Proposal No <span className="text-error">*</span></label>
            <input
              className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm ${
                errors.proposal_no ? 'border-error focus:border-error' : ''
              }`}
              placeholder="PR-XXXX-XXXX"
              value={modal.data.proposal_no}
              onChange={e=>set('proposal_no',e.target.value)}
            />
            {errors.proposal_no&&<span className="text-[11px] text-error font-semibold mt-0.5">{errors.proposal_no}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Holder Name <span className="text-error">*</span></label>
            <input
              className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm ${
                errors.holder_name ? 'border-error focus:border-error' : ''
              }`}
              placeholder="Full legal name"
              value={modal.data.holder_name}
              onChange={e=>set('holder_name',e.target.value)}
            />
            {errors.holder_name&&<span className="text-[11px] text-error font-semibold mt-0.5">{errors.holder_name}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Amount / Premium (PKR) <span className="text-error">*</span></label>
            <input
              type="number"
              className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm ${
                errors.premium ? 'border-error focus:border-error' : ''
              }`}
              placeholder="50,000"
              value={modal.data.premium}
              onChange={e=>set('premium',e.target.value)}
            />
            {errors.premium&&<span className="text-[11px] text-error font-semibold mt-0.5">{errors.premium}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">PR No</label>
            <input
              className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm"
              placeholder="PR Number"
              value={modal.data.pr_no}
              onChange={e=>set('pr_no',e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">PR Date</label>
            <input
              type="date"
              className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm"
              value={modal.data.pr_date}
              onChange={e=>set('pr_date',e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Amount Type</label>
            <select
              className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm"
              value={modal.data.amount_type}
              onChange={e=>set('amount_type',e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Assigned SR</label>
            <SearchableDropdown id="prop-sr" options={srOpts} value={modal.data.sr_id} onChange={v=>set('sr_id',v)} placeholder="Select SR…"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Assigned SM</label>
            <SearchableDropdown id="prop-sm" options={smOpts} value={modal.data.sm_id} onChange={v=>set('sm_id',v)} placeholder="Select SM…"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Assigned SSM</label>
            <SearchableDropdown id="prop-ssm" options={ssmOpts} value={modal.data.ssm_id} onChange={v=>set('ssm_id',v)} placeholder="Select SSM…"/>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Status</label>
            <select
              className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm"
              value={modal.data.status}
              onChange={e=>set('status',e.target.value)}
            >
              <option value="not_ok">Not OK</option>
              <option value="ok">OK</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Requirements / Notes</label>
            <textarea
              className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm resize-none"
              value={modal.data.requirements}
              onChange={e=>set('requirements',e.target.value)}
              placeholder="List specific guidelines or underwriting requirements..."
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Convert to Policy confirm */}
      <ConfirmDialog open={!!convertId} onClose={()=>setConvertId(null)} onConfirm={handleConvert} danger={false}
        title="Convert to Policy?" message="Convert this proposal to a Policy Record? You will be taken to the Policy Register to complete the remaining fields." />

      <ConfirmDialog open={confirm.open&&confirm.type==='delete'} onClose={()=>setConfirm({open:false,id:null,type:'delete'})} onConfirm={handleDelete}
        title="Delete Proposal" message="Are you sure you want to delete this proposal record? This action cannot be undone." />
    </div>
  );
}

