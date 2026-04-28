import { clsx } from 'clsx';

const variants = {
  default: 'bg-[#F0F0EE] text-[#0A0A0A]',
  green: 'bg-green-50 text-green-700',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-[#FFF0EB] text-[#FF4D00]',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  ink: 'bg-[#0A0A0A] text-white',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
      variants[variant], className
    )}>
      {children}
    </span>
  );
}