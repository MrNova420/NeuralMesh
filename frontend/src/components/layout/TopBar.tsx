import { Search, Bell, Settings, Moon, Sun, Command } from 'lucide-react';
import { Avatar, Icon, Badge, StatusDot } from '../ui';
import { useUIStore } from '../../store';

export function TopBar() {
  const { isDarkMode, toggleDarkMode, toggleCommandPalette } = useUIStore();

  return (
    <header className="h-16 border-b border-neural-border bg-neural-panel/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Logo + Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neural-blue to-neural-purple flex items-center justify-center">
              <span className="text-white font-bold text-sm">NM</span>
            </div>
            <h1 className="text-lg font-bold text-neural-text hidden sm:block">NeuralMesh</h1>
          </div>
          
          <button
            onClick={toggleCommandPalette}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neural-panel border border-neural-border rounded-lg hover:border-neural-blue/50 transition-colors text-neural-text-secondary text-sm max-w-md flex-1"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Search...</span>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-neural-bg border border-neural-border rounded">
                <Command className="h-3 w-3 inline" />
              </kbd>
              <kbd className="px-1.5 py-0.5 text-xs bg-neural-bg border border-neural-border rounded">K</kbd>
            </div>
          </button>
        </div>

        {/* Right: Status + Actions */}
        <div className="flex items-center gap-3">
          {/* Global Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-neural-panel border border-neural-border rounded-lg">
            <StatusDot status="healthy" size="sm" />
            <span className="text-sm text-neural-text">All Systems Online</span>
            <Badge variant="success">12 nodes</Badge>
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-neural-hover rounded-lg transition-colors">
            <Icon icon={Bell} size="md" className="text-neural-text" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-neural-blue rounded-full" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-neural-hover rounded-lg transition-colors"
          >
            <Icon
              icon={isDarkMode ? Sun : Moon}
              size="md"
              className="text-neural-text"
            />
          </button>

          {/* Settings */}
          <button className="p-2 hover:bg-neural-hover rounded-lg transition-colors">
            <Icon icon={Settings} size="md" className="text-neural-text" />
          </button>

          {/* User Avatar */}
          <Avatar fallback="A" size="md" />
        </div>
      </div>
    </header>
  );
}
