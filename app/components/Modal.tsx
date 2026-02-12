'use client';

import { X } from '@phosphor-icons/react';
import { useCallback, useEffect } from 'react';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  size?: 'default' | 'large';
  title: string;
}

export default function Modal({ children, isOpen, onClose, size = 'default', title }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-h-[90vh] overflow-y-auto bg-white rounded-lg border border-emerald-900 ${
          size === 'large' ? 'max-w-4xl' : 'max-w-lg'
        }`}
        role="document"
      >
        <div className="flex items-center justify-between p-4 border-b border-emerald-900">
          <h2 className="text-xl font-medium text-emerald-900">{title}</h2>
          <button
            aria-label="Close modal"
            className="p-2 text-emerald-900 hover:bg-emerald-900/10 rounded-lg transition-colors"
            onClick={onClose}
            type="button"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
