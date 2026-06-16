import React, { useState, useEffect, useCallback } from 'react';
import DataTable from '../components/DataTable.jsx';
import Modal, { ConfirmDialog } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import api from '../lib/api.js';

const EMPTY = { name:'', username:'', contact_email:'', contact_number:'', password:'', role:'admin', status:'active' };

export default function UsersPage({ user: currentUser }) {
  const toast = useToast();
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState({ open:false, mode:'create', data:EMPTY });
  const [confirm, setConfirm] = useState({ open:false, id:null });
  const [saving,  setSaving]  = useState(false);
  const [errors,  setErrors]  = useState({});
  const [showPwd, setShowPwd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await api.listUsers()); }
    catch { toast('Failed to load users','error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const validate = (d, mode) => {
    const e = {};
    if (!d.name.trim())     e.name     = 'Required';
    if (!d.username.trim()) e.username = 'Required';
    if (d.contact_email && d.contact_email.trim() && !/\S+@\S+\.\S+/.test(d.contact_email)) {
      e.contact_email = 'Invalid email address';
    }
    if (mode==='create' && !d.password) e.password = 'Required';
    if (d.password && d.password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const set = (k, v) => { setModal(m=>({...m, data:{...m.data,[k]:v}})); setErrors(e=>({...e,[k]:undefined})); };

  const handleSave = async () => {
    const e = validate(modal.data, modal.mode);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const res = modal.mode==='create' ? await api.createUser(modal.data) : await api.updateUser(modal.data);
      if (res.ok) {
        toast(`User ${modal.mode==='create'?'created':'updated'} successfully`, 'success');
        setModal(m=>({...m,open:false}));
        load();
      } else toast(res.error||'Save failed','error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const res = await api.deleteUser(confirm.id);
    if (res.ok) { toast('User account deleted successfully','success'); load(); }
    else toast(res.error||'Cannot delete this account','error');
    setConfirm({open:false,id:null});
  };

  const columns = [
    { key:'user_id',        label:'ID' },
    { key:'name',           label:'Display Name' },
    { key:'username',       label:'Username' },
    { key:'contact_email',  label:'Contact Email', render: v => v || '—' },
    { key:'contact_number', label:'Contact Number', render: v => v || '—' },
    { key:'role',           label:'Role',   render: v=><span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${v==='developer'?'bg-purple-500/10 text-purple-400 border border-purple-500/20':'bg-primary/10 text-primary border border-primary/20'}`}>{v}</span> },
    { key:'status',         label:'Status', render: v=><span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${v==='active'?'bg-success/10 text-success':'bg-surface-variant/40 text-outline'}`}><span className={`w-1.5 h-1.5 rounded-full ${v==='active'?'bg-success':'bg-outline'}`}></span>{v}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Page Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none mb-2">
        <div className="text-body-md font-semibold text-on-surface-variant">Active System Terminals</div>
        <button
          id="btn-create-user"
          className="px-4 py-2 bg-primary hover:brightness-110 active:scale-[0.98] text-on-primary font-bold rounded-lg text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 outline-none shadow-md shadow-primary/10"
          onClick={() => setModal({ open: true, mode: 'create', data: { ...EMPTY }, setShowPwd: false })}
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          <span>Add User Account</span>
        </button>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading}
        actions={row=><>
          <button
            className="p-1.5 hover:text-primary transition-colors material-symbols-outlined text-[18px]"
            onClick={() => { setShowPwd(false); setModal({ open: true, mode: 'edit', data: { ...row, password: '' } }); }}
            title="Edit User"
          >
            edit
          </button>
          {row.role !== 'developer' && (
            <button
              className="p-1.5 hover:text-error transition-colors material-symbols-outlined text-[18px]"
              onClick={() => setConfirm({ open: true, id: row.user_id })}
              title="Delete User"
            >
              delete
            </button>
          )}
        </>}
      />

      <Modal open={modal.open} onClose={()=>setModal(m=>({...m,open:false}))}
        title={modal.mode==='create'?'Add User Account':'Edit User Account'} size="md"
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
        <div className="space-y-4 select-none">
          {[
            ['name','Display Name',true,'text', 'Enter full name'],
            ['username','Username',true,'text', 'Enter unique username'],
            ['contact_email','Contact Email',false,'email', 'Enter contact email'],
            ['contact_number','Contact Number',false,'text', 'Enter contact number']
          ].map(([k,label,req,type,placeholder])=>(
            <div key={k} className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">
                {label} {req && <span className="text-error">*</span>}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                autoFocus={k === 'name'}
                className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm ${
                  errors[k] ? 'border-error focus:border-error' : ''
                }`}
                value={modal.data[k]||''}
                onChange={e=>set(k,e.target.value)}
              />
              {errors[k]&&<span className="text-[11px] text-error font-semibold mt-0.5">{errors[k]}</span>}
            </div>
          ))}
          
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center select-none">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">
                Password {modal.mode==='create' && <span className="text-error">*</span>}
              </label>
              {modal.mode==='edit' && <span className="text-[10px] text-outline tracking-tight">Leave blank to keep current</span>}
            </div>
            <div className="relative">
              <input
                id="user-password"
                type={showPwd?'text':'password'}
                className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 pr-10 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all placeholder:text-outline-variant font-body-md text-sm ${
                  errors.password ? 'border-error' : ''
                }`}
                value={modal.data.password||''}
                onChange={e=>set('password',e.target.value)}
                placeholder={modal.mode==='edit' ? '••••••••••••' : 'Enter password'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                tabIndex={-1}
              >
                <span className="material-symbols-outlined text-[18px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password&&<span className="text-[11px] text-error font-semibold mt-0.5">{errors.password}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Role</label>
              <select
                className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm"
                value={modal.data.role}
                onChange={e=>set('role',e.target.value)}
                disabled={modal.data.role==='developer'}
              >
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-label-caps font-label-caps text-on-surface-variant uppercase tracking-wider block">Status</label>
              <select
                className="w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface focus:border-primary focus:ring-0 outline-none transition-all font-body-md text-sm"
                value={modal.data.status}
                onChange={e=>set('status',e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})} onConfirm={handleDelete}
        title="Delete User" message="Are you sure you want to delete this user account? This action cannot be undone." />
    </div>
  );
}
