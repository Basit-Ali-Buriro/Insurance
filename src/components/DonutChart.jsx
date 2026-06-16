import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  remaining: '#273647', // surface-variant
};

export default function DonutChart({ title, achieved, target, color = '#adc6ff', id, onEditTarget }) {
  const pct     = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;
  const data    = [
    { name: 'Achieved', value: Math.max(pct, 0.5) },
    { name: 'Remaining', value: Math.max(100 - pct, 0) },
  ];

  const [editing, setEditing] = React.useState(false);
  const [editVal, setEditVal] = React.useState('');

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
    <div className="bg-surface-bright border border-border-subtle rounded-lg p-stack-md flex flex-col md:flex-row items-center gap-8 flex-1 select-none">
      {/* Left side: Recharts Donut Circle */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={66}
              startAngle={90} endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill={COLORS.remaining} />
            </Pie>
            <Tooltip
              formatter={(val, name) => [name === 'Achieved' ? `${pct.toFixed(1)}%` : `${(100-pct).toFixed(1)}%`, name]}
              contentStyle={{ background: '#122131', border: '1px solid #334155', borderRadius: 4, fontSize: '0.75rem', color: '#d4e4fa' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-headline-md font-bold text-on-surface">{pct.toFixed(0)}%</span>
          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Reached</span>
        </div>
      </div>

      {/* Right side: Title & Inputs */}
      <div className="flex-1 w-full space-y-4">
        <h3 className="text-headline-md font-bold text-on-surface leading-tight">{title}</h3>
        
        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider block mb-1">Target Amount (PKR)</label>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <input
                    id={`target-input-${id}`}
                    className="flex-1 bg-surface-deep border border-border-subtle text-on-surface rounded px-3 py-1.5 focus:ring-1 focus:ring-primary focus:border-primary font-mono-data text-sm outline-none"
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                    autoFocus
                    type="number"
                    min="0"
                  />
                  <button
                    className="bg-primary text-on-primary px-3 py-1.5 rounded font-bold hover:brightness-110 active:scale-95 transition-all"
                    onClick={commitEdit}
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 bg-surface-deep border border-border-subtle text-on-surface rounded px-3 py-1.5 font-mono-data text-sm flex items-center">
                    Rs. {target.toLocaleString()}
                  </div>
                  <button
                    id={`btn-edit-target-${id}`}
                    className="bg-surface-variant p-2 rounded hover:bg-surface-container-highest border border-border-subtle/50 text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                    onClick={startEdit}
                    title="Click to edit target"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between text-body-md border-t border-border-subtle/30 pt-2">
            <span className="text-on-surface-variant font-medium">Actual Business:</span>
            <span className="font-bold text-success">Rs. {achieved.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

