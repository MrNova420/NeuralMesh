import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './Badge';
import type { FC } from 'react';

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  nodeId?: string;
  nodeName?: string;
  timestamp: Date;
  read: boolean;
}

interface AlertCenterProps {
  alerts: Alert[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onClear?: () => void;
}

const alertIcons = {
  info: '💡',
  warning: '⚠️',
  critical: '🔴',
  success: '✅',
};

export const AlertCenter: FC<AlertCenterProps> = ({ alerts, onMarkRead, onMarkAllRead, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = alerts.filter((a) => !a.read).length;
  const displayedAlerts = filter === 'unread' ? alerts.filter((a) => !a.read) : alerts;

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-neural-border rounded-lg transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-neural-red rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 max-h-[600px] bg-neural-bg-secondary border border-neural-border rounded-lg shadow-xl z-40 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-neural-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-neural-text">Alerts</h3>
                  <Badge variant={unreadCount > 0 ? 'danger' : 'default'}>
                    {unreadCount} unread
                  </Badge>
                </div>

                {/* Filter buttons */}
                <div className="flex gap-2">
                  <FilterButton
                    active={filter === 'all'}
                    onClick={() => setFilter('all')}
                    label="All"
                  />
                  <FilterButton
                    active={filter === 'unread'}
                    onClick={() => setFilter('unread')}
                    label="Unread"
                  />
                </div>
              </div>

              {/* Alert List */}
              <div className="flex-1 overflow-y-auto">
                {displayedAlerts.length === 0 ? (
                  <div className="p-8 text-center text-neutral-text-secondary">
                    {filter === 'unread' ? 'No unread alerts' : 'No alerts'}
                  </div>
                ) : (
                  <div className="divide-y divide-neural-border">
                    {displayedAlerts.map((alert) => (
                      <AlertItem
                        key={alert.id}
                        alert={alert}
                        onMarkRead={onMarkRead}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {alerts.length > 0 && (
                <div className="p-3 border-t border-neural-border flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllRead}
                      className="flex-1 px-3 py-2 text-sm bg-neural-blue text-white rounded-md hover:bg-neural-blue/80 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClear}
                    className="flex-1 px-3 py-2 text-sm bg-neural-border text-neutral-text-secondary rounded-md hover:bg-neural-border/80 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const AlertItem: FC<{ alert: Alert; onMarkRead?: (id: string) => void }> = ({
  alert,
  onMarkRead,
}) => {
  const timeAgo = getTimeAgo(new Date(alert.timestamp));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-4 hover:bg-neural-border/30 cursor-pointer transition-colors ${
        !alert.read ? 'bg-neural-border/10' : ''
      }`}
      onClick={() => onMarkRead?.(alert.id)}
    >
      <div className="flex gap-3">
        <div className="text-2xl">{alertIcons[alert.type]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-semibold text-neural-text truncate">{alert.title}</h4>
            {!alert.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-neural-blue rounded-full" />
            )}
          </div>
          <p className="text-sm text-neutral-text-secondary mb-2">{alert.message}</p>
          <div className="flex items-center gap-2 text-xs text-neutral-text-secondary">
            <span>{timeAgo}</span>
            {alert.nodeName && (
              <>
                <span>•</span>
                <span>{alert.nodeName}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FilterButton: FC<{ active: boolean; onClick: () => void; label: string }> = ({
  active,
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
      active
        ? 'bg-neural-blue text-white'
        : 'bg-neural-bg text-neutral-text-secondary hover:bg-neural-border'
    }`}
  >
    {label}
  </button>
);

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
