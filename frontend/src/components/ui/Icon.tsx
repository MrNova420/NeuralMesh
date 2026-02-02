import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface IconProps {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Icon({ icon: IconComponent, size = 'md', className }: IconProps) {
  return (
    <IconComponent
      className={clsx(
        {
          'h-4 w-4': size === 'sm',
          'h-5 w-5': size === 'md',
          'h-6 w-6': size === 'lg',
          'h-8 w-8': size === 'xl',
        },
        className
      )}
    />
  );
}
