import { motion } from 'framer-motion';
import { StatusDot } from './StatusDot';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'node_join' | 'node_leave' | 'deployment' | 'alert' | 'optimization';
  message: string;
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityIcons = {
  node_join: '🟢',
  node_leave: '🔴',
  deployment: '🚀',
  alert: '⚠️',
  optimization: '⚡',
};

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="neural-card">
      <h3 className="text-lg font-semibold text-neural-text mb-4">Recent Activity</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayedActivities.length === 0 ? (
          <p className="text-neutral-text-secondary text-sm text-center py-8">
            No recent activity
          </p>
        ) : (
          displayedActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-neural-hover transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                <StatusDot status={activity.status} size="sm" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-neural-text">
                    <span className="mr-2">{activityIcons[activity.type]}</span>
                    {activity.message}
                  </p>
                  <time className="text-xs text-neutral-text-secondary whitespace-nowrap">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </time>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
