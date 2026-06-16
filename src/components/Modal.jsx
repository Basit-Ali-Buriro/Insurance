import React, { useEffect, useRef } from 'react';

/**
 * Reusable modal with overlay.
 * Props: open, onClose, title, size('sm'|'md'|'lg'), children, footer
 */
export default function Modal({ open, onClose, title, size = 'md', children, footer }) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-sm' : 'max-w-xl';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[3px] flex items-center justify-center z-[1000] p-4 select-none animate-fadeIn"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <div
        className={`w-full bg-surface-bright border border-border-subtle rounded-xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden ${sizeClass}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Top boundary inner glow */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10" />

        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-border-subtle/50 bg-surface-container-high/30">
          <h3 className="text-body-lg font-bold text-on-surface">{title}</h3>
          <button
            className="w-8 h-8 rounded-lg bg-surface-deep/50 border border-border-subtle hover:text-on-surface hover:border-on-surface text-outline transition-all flex items-center justify-center outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-body-md text-on-surface-variant leading-relaxed">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple confirmation dialog.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm', message, danger = true, loading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-body-md text-on-surface-variant">{message}</p>
        <div className="flex justify-end gap-2.5">
          <button
            className="px-4 py-2 border border-border-subtle hover:bg-surface-variant/30 text-on-surface rounded font-body-md text-body-md transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded font-bold text-body-md transition-colors ${
              danger
                ? 'bg-error text-white hover:brightness-110'
                : 'bg-primary text-on-primary hover:brightness-110'
            }`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Confirming…' : 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

