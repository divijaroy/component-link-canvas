import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BarChart3, Settings, Database, Server, Globe, FileText, Activity } from 'lucide-react';
import { Label } from '../types/ComponentTypes';
import { useEvalValue } from '../hooks/useEvalValue';
import { cn } from '@/lib/utils';

interface SystemInfo {
  name: string;
  description: string;
  labels?: Label[];
  total_components: number;
  status: string;
  links?: {
    dashboard?: string;
    documentation?: string;
    monitoring?: string;
    admin?: string;
    logs?: string;
    metrics?: string;
    [key: string]: string | undefined;
  };
}

interface SystemInfoDialogProps {
  systemInfo: SystemInfo;
  isOpen: boolean;
  onClose: () => void;
}

const LinkButton = ({ 
  href, 
  icon: Icon, 
  label, 
  description, 
  variant = "default" 
}: { 
  href: string; 
  icon: any; 
  label: string; 
  description?: string;
  variant?: "default" | "secondary" | "outline";
}) => {
  const handleClick = () => {
    window.open(href, '_blank');
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className="w-full justify-start gap-3 h-auto py-3 px-4"
    >
      <Icon className="w-5 h-5" />
      <div className="flex flex-col items-start">
        <span className="font-medium">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
      <ExternalLink className="w-4 h-4 ml-auto" />
    </Button>
  );
};

export const SystemInfoDialog = ({ systemInfo, isOpen, onClose }: SystemInfoDialogProps) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'error':
      case 'unhealthy':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const linkCategories = [
    {
      title: "Monitoring & Metrics",
      icon: BarChart3,
      links: [
        { key: 'dashboard', label: 'Main Dashboard', description: 'Primary system overview' },
        { key: 'monitoring', label: 'Monitoring', description: 'Real-time system monitoring' },
        { key: 'metrics', label: 'Metrics', description: 'Detailed performance metrics' }
      ]
    },
    {
      title: "Administration",
      icon: Settings,
      links: [
        { key: 'admin', label: 'Admin Panel', description: 'System administration' },
        { key: 'logs', label: 'Logs', description: 'System and application logs' }
      ]
    },
    {
      title: "Documentation",
      icon: FileText,
      links: [
        { key: 'documentation', label: 'Documentation', description: 'System documentation and guides' }
      ]
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Server className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-xl font-bold">{systemInfo.name}</div>
              <div className="text-sm text-muted-foreground">{systemInfo.description}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* System Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="font-medium">System Status</span>
              </div>
              <Badge className={getStatusBadgeClass(systemInfo.status)}>
                {systemInfo.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {systemInfo.total_components} Components
              </span>
            </div>
          </div>

          {/* System Labels */}
          {systemInfo.labels && systemInfo.labels.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                System Information
              </h3>
              <div className="flex flex-wrap gap-2">
                {systemInfo.labels.map((label, index) => (
                  <div key={index} className="flex items-center rounded-full overflow-hidden border">
                    <div className="px-3 py-1 bg-blue-500 text-white text-sm font-medium">
                      {label.label.replace(/_/g, ' ')}
                    </div>
                    <div className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium">
                      {String(useEvalValue(label.value) || 'Loading...')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {systemInfo.links && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Quick Links
              </h3>
              
              {linkCategories.map((category) => {
                const availableLinks = category.links.filter(link => systemInfo.links?.[link.key]);
                if (availableLinks.length === 0) return null;

                return (
                  <div key={category.title} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <category.icon className="w-4 h-4" />
                      {category.title}
                    </div>
                    <div className="grid gap-2">
                      {availableLinks.map((link) => (
                        <LinkButton
                          key={link.key}
                          href={systemInfo.links![link.key]!}
                          icon={ExternalLink}
                          label={link.label}
                          description={link.description}
                          variant="outline"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Links Message */}
          {(!systemInfo.links || Object.keys(systemInfo.links).length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No system links configured</p>
              <p className="text-sm">Add links to the system configuration to see them here</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 