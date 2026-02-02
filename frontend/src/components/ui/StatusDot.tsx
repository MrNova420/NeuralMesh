import { clsx } from 'clsx';

interface StatusDotProps {
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  withPulse?: boolean;
  className?: string;
}

export function StatusDot({ status, size = 'md', withPulse = true, className }: StatusDotProps) {
  return (
    <span className={clsx('relative inline-flex', className)}>
      <span
        className={clsx('rounded-full', {
          // Status colors
          'bg-neural-green': status === 'healthy',
          'bg-neural-yellow': status === 'warning',
          'bg-neural-red': status === 'critical',
          'bg-neural-text-secondary': status === 'offline',
          
          // Sizes
          'h-2 w-2': size === 'sm',
          'h-3 w-3': size === 'md',
          'h-4 w-4': size === 'lg',
        })}
      />
      {withPulse && status !== 'offline' && (
        <span
          className={clsx(
            'absolute inline-flex rounded-full opacity-75 animate-ping',
            {
              'bg-neural-green': status === 'healthy',
              'bg-neural-yellow': status === 'warning',
              'bg-neural-red': status === 'critical',
              
              'h-2 w-2': size === 'sm',
              'h-3 w-3': size === 'md',
              'h-4 w-4': size === 'lg',
            }
          )}
        />
      )}
    </span>
  );
}
