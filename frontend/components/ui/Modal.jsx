'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose}/>
      <div className={clsx(
        'relative w-full bg-[#FAFAF8] rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.12)]',
        'border border-[#E5E5E3] overflow-hidden max-h-[calc(100dvh-2rem)]', sizes[size]
      )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E5E3]">
          <h2 className="text-base font-bold text-[#0A0A0A]">{title}</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       hover:bg-[#F0F0EE] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors">
            <X size={15}/>
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}