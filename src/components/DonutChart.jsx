import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function DonutChart({ title, achieved, target, color = '#007AFF', id, onEditTarget }) {
  const pct     = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  const data    = [
    { name: 'Achieved', value: Math.max(pct, 0.5) },
    { name: 'Remaining', value: Math.max(100 - pct, 0) },
  ];

  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState('');

  const startEdit = () => {
    setEditVal(String(target || ''));
    setEditing(true);
  };
  const commitEdit = () => {
    const val = parseFloat(editVal);
    if (!isNaN(val) && val >= 0) onEditTarget?.(val);
    setEditing(false);
  };

  return (
    <div className="bg-slate-gray border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row items-center gap-8 flex-1 select-none">
      {/* Left side: Recharts Donut Circle */}
      <div className="relative w-36 h-36 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={48} outerRadius={62}
              startAngle={90} endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="var(--chart-remaining)" />
            </Pie>
            <Tooltip
              formatter={(val, name) => [name === 'Achieved' ? `${pct.toFixed(1)}%` : `${(100-pct).toFixed(1)}%`, name]}
              contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-primary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-on-surface font-title">{pct.toFixed(0)}%</span>
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Reached</span>
        </div>
      </div>

      {/* Right side: Title & Inputs */}
      <div className="flex-grow w-full space-y-4">
        <div>
          <h4 className="text-lg font-extrabold text-on-surface leading-tight font-title">{title}</h4>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">Target Amount (PKR)</label>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <input
                    id={`target-input-${id}`}
                    className="flex-1 bg-deep-charcoal border border-outline-variant text-on-surface rounded-lg px-3 py-1.5 focus:border-electric-blue focus:ring-1 focus:ring-electric-blue font-mono text-sm outline-none"
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                    autoFocus
                    type="number"
                    min="0"
                  />
                  <button
                    className="bg-electric-blue text-white px-3 py-1.5 rounded-lg font-bold hover:brightness-110 active:scale-95 transition-all text-xs"
                    onClick={commitEdit}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 bg-deep-charcoal border border-outline-variant text-on-surface rounded-lg px-3 py-1.5 font-mono text-sm flex items-center font-bold">
                    Rs. {target.toLocaleString()}
                  </div>
                  <button
                    id={`btn-edit-target-${id}`}
                    className="bg-surface-container-high p-2 rounded-lg hover:bg-surface-container-highest border border-outline-variant/50 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                    onClick={startEdit}
                    title="Click to edit target"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between border-t border-outline-variant/30 pt-2.5">
            <span className="text-on-surface-variant font-bold text-sm">Actual Business:</span>
            <span className="font-extrabold text-emerald-green text-sm">Rs. {achieved.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
