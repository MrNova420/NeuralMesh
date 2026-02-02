import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-neural-border text-neural-text': variant === 'default',
          'bg-neural-green/20 text-neural-green': variant === 'success',
          'bg-neural-yellow/20 text-neural-yellow': variant === 'warning',
          'bg-neural-red/20 text-neural-red': variant === 'danger',
          'bg-neural-blue/20 text-neural-blue': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
