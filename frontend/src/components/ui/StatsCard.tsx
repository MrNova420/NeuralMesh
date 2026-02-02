import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'cyan';
  className?: string;
}

const colorClasses = {
  blue: {
    icon: 'text-neural-blue bg-neural-blue/10',
    value: 'text-neural-blue',
    border: 'border-neural-blue/20',
  },
  green: {
    icon: 'text-neural-green bg-neural-green/10',
    value: 'text-neural-green',
    border: 'border-neural-green/20',
  },
  yellow: {
    icon: 'text-neural-yellow bg-neural-yellow/10',
    value: 'text-neural-yellow',
    border: 'border-neural-yellow/20',
  },
  purple: {
    icon: 'text-neural-purple bg-neural-purple/10',
    value: 'text-neural-purple',
    border: 'border-neural-purple/20',
  },
  red: {
    icon: 'text-neural-red bg-neural-red/10',
    value: 'text-neural-red',
    border: 'border-neural-red/20',
  },
  cyan: {
    icon: 'text-neural-cyan bg-neural-cyan/10',
    value: 'text-neural-cyan',
    border: 'border-neural-cyan/20',
  },
};

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue', className }: StatsCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={clsx(
        'relative overflow-hidden rounded-lg border bg-neural-panel p-6',
        'hover:border-opacity-50 transition-all duration-300',
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-text-secondary">{title}</p>
          <motion.p
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={clsx('mt-2 text-3xl font-bold', colors.value)}
          >
            {value}
          </motion.p>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className={clsx(trend.isPositive ? 'text-neural-green' : 'text-neural-red')}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-neutral-text-secondary">vs last hour</span>
            </div>
          )}
        </div>
        <div className={clsx('rounded-lg p-3', colors.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Animated background glow */}
      <motion.div
        className={clsx('absolute inset-0 opacity-5', colors.icon)}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.1, 0.05],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
