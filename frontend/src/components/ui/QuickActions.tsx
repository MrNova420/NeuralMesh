import { Button } from './Button';
import { Plus, RefreshCw, Terminal, Settings, Download, Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export function QuickActions() {
  const actions = [
    { icon: Plus, label: 'Add Node', color: 'blue', action: () => console.log('Add node') },
    { icon: RefreshCw, label: 'Sync All', color: 'green', action: () => console.log('Sync all') },
    { icon: Terminal, label: 'Terminal', color: 'purple', action: () => console.log('Open terminal') },
    { icon: Download, label: 'Deploy', color: 'cyan', action: () => console.log('Deploy') },
    { icon: Upload, label: 'Backup', color: 'yellow', action: () => console.log('Backup') },
    { icon: Settings, label: 'Configure', color: 'red', action: () => console.log('Configure') },
  ];

  return (
    <div className="neural-card">
      <h3 className="text-lg font-semibold text-neural-text mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Button
              variant="secondary"
              className="w-full flex flex-col items-center gap-2 py-4 h-auto"
              onClick={action.action}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
