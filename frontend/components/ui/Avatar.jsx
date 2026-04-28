const palette = [
  'bg-[#FFF0EB] text-[#FF4D00]',
  'bg-blue-50 text-blue-700',
  'bg-purple-50 text-purple-700',
  'bg-green-50 text-green-700',
  'bg-yellow-50 text-yellow-700',
];

export default function Avatar({ name = '', size = 'md', className = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const color = palette[(name.charCodeAt(0) || 0) % palette.length];
  const sizes = { xs: 'w-7 h-7 text-xs', sm: 'w-8 h-8 text-xs',
                  md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center 
                     justify-center font-bold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
}