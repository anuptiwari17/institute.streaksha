import { clsx } from 'clsx';

export default function Input({ label, error, hint, icon, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A0] pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'w-full bg-white border text-[#0A0A0A] rounded-xl px-4 py-3 text-sm',
            'focus:outline-none focus:ring-2 focus:border-transparent transition-all',
            'placeholder:text-[#C0C0BC]',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-[#E5E5E3] focus:ring-[#0A0A0A]',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      {hint && !error && <p className="text-xs text-[#6B6B6B] mt-0.5">{hint}</p>}
    </div>
  );
}