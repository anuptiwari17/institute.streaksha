import { clsx } from 'clsx';

const variants = {
  primary: 'bg-[#0A0A0A] text-white hover:bg-[#1a1a1a]',
  secondary: 'bg-white text-[#0A0A0A] border border-[#E5E5E3] hover:bg-[#F5F5F3]',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  ghost: 'text-[#0A0A0A] hover:bg-[#F5F5F3]',
  orange: 'bg-[#FF4D00] text-white hover:bg-[#e64400]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
  xl: 'px-8 py-4 text-base rounded-2xl',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  className, loading, icon, ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold',
        'active:scale-[0.97] transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
        variants[variant], sizes[size], className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      ) : icon}
      {children}
    </button>
  );
}