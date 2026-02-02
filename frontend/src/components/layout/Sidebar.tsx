import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Network,
  Server,
  Activity,
  Database,
  Settings,
  Terminal,
  ChevronLeft,
} from 'lucide-react';
import { Icon, Badge, Tooltip } from '../ui';
import { useUIStore } from '../../store';
import { clsx } from 'clsx';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { path: '/neural', icon: Network, label: 'Neural Network', badge: '12' },
  { path: '/nodes', icon: Server, label: 'Nodes', badge: null },
  { path: '/metrics', icon: Activity, label: 'Metrics', badge: null },
  { path: '/storage', icon: Database, label: 'Storage', badge: null },
  { path: '/terminal', icon: Terminal, label: 'Terminal', badge: null },
  { path: '/settings', icon: Settings, label: 'Settings', badge: null },
];

export function Sidebar() {
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside
      className={clsx(
        'h-full bg-neural-panel border-r border-neural-border transition-all duration-300',
        isSidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <nav className="flex flex-col h-full">
        {/* Navigation Items */}
        <div className="flex-1 py-4 space-y-1">
          {navItems.map((item) => (
            <Tooltip key={item.path} content={item.label} position="right">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all',
                    'hover:bg-neural-hover',
                    isActive
                      ? 'bg-neural-blue/10 text-neural-blue border-l-4 border-neural-blue'
                      : 'text-neural-text'
                  )
                }
              >
                <Icon icon={item.icon} size="md" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="info" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </NavLink>
            </Tooltip>
          ))}
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center p-4 border-t border-neural-border hover:bg-neural-hover transition-colors"
        >
          <ChevronLeft
            className={clsx(
              'h-5 w-5 text-neural-text transition-transform duration-300',
              isSidebarCollapsed && 'rotate-180'
            )}
          />
        </button>
      </nav>
    </aside>
  );
}
