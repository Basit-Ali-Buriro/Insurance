import React, { useState, useRef, useEffect } from 'react';

/**
 * Searchable dropdown that filters a list by label.
 * Props: options[{value, label}], value, onChange, placeholder, id, disabled
 */
export default function SearchableDropdown({ options = [], value, onChange, placeholder = 'Search…', id, disabled }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    !query || o.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (opt) => {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
  };

  return (
    <div className="relative w-full" ref={wrapRef} id={id}>
      <div
        className={`w-full bg-surface-deep border border-border-subtle rounded px-4 py-2.5 text-on-surface flex items-center justify-between transition-all select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer focus-within:border-primary'
        }`}
        onClick={() => { if (!disabled) setOpen(v => !v); }}
      >
        {open ? (
          <input
            className="flex-1 bg-transparent border-none outline-none text-body-md text-on-surface p-0 focus:ring-0 placeholder:text-outline-variant font-body-md"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
            placeholder={placeholder}
          />
        ) : (
          <span className={`flex-1 text-body-md truncate ${selected ? 'text-on-surface' : 'text-outline-variant'}`}>
            {selected?.label ?? placeholder}
          </span>
        )}
        
        <div className="flex items-center gap-1.5 ml-2">
          {value && !disabled && (
            <button
              onClick={handleClear}
              className="text-outline hover:text-error transition-colors p-0.5"
              title="Clear selection"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
          <span className="material-symbols-outlined text-outline text-[18px] pointer-events-none select-none">
            {open ? 'arrow_drop_up' : 'unfold_more'}
          </span>
        </div>
      </div>

      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-surface-container border border-border-subtle rounded shadow-xl z-[200] max-h-56 overflow-y-auto divide-y divide-border-subtle/30">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-xs text-outline italic">No matches found</div>
          ) : (
            filtered.map(opt => {
              const isSelected = opt.value === value;
              return (
                <div
                  key={opt.value}
                  className={`px-4 py-2.5 text-body-md cursor-pointer transition-colors ${
                    isSelected
                      ? 'text-primary font-bold bg-surface-variant/30'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                  }`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

