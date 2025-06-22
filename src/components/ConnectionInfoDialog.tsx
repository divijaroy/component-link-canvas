import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database, Server, AppWindow, Zap, Clock, Globe, MessageSquare, Warehouse, BarChart3 } from 'lucide-react';

interface ConnectionComponent {
  id: string;
  name: string;
  type: string;
  description?: string;
  labels: { label: string; value: string }[];
  app_ui_link?: string;
  metrics_ui_link?: string;
  queue_event_delay?: string;
  status?: string;
}

interface ConnectionInfoDialogProps {
  connection: ConnectionComponent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectionInfoDialog = ({ connection, open, onOpenChange }: ConnectionInfoDialogProps) => {
  if (!connection) return null;

  const getIcon = () => {
    const typeLabel = connection.labels.find(l => l.label.toLowerCase() === 'type');
    const typeValue = typeLabel?.value.toLowerCase();

    if (typeValue) {
      // Database types
      if (typeValue.includes('postgres') || typeValue.includes('mysql') || typeValue.includes('mongodb')) {
        return <Database className="w-6 h-6 text-purple-600" />;
      }
      if (typeValue.includes('cache') || typeValue.includes('redis')) {
        return <Database className="w-6 h-6 text-red-600" />;
      }
      if (typeValue.includes('data-warehouse')) {
        return <Warehouse className="w-6 h-6 text-indigo-600" />;
      }
      
      // Messaging and streaming
      if (typeValue.includes('spark') || typeValue.includes('stream')) {
        return <Zap className="w-6 h-6 text-yellow-600" />;
      }
      if (typeValue.includes('rabbitmq') || typeValue.includes('kafka') || typeValue.includes('queue')) {
        return <MessageSquare className="w-6 h-6 text-orange-600" />;
      }
      
      // API and gateway types
      if (typeValue.includes('kong') || typeValue.includes('gateway')) {
        return <Globe className="w-6 h-6 text-blue-600" />;
      }
      if (typeValue.includes('external-api')) {
        return <ExternalLink className="w-6 h-6 text-green-600" />;
      }
      
      // Service types
      if (typeValue.includes('drop-wizard') || typeValue.includes('rest')) {
        return <Server className="w-6 h-6 text-blue-600" />;
      }
      if (typeValue.includes('batch') || typeValue.includes('job') || typeValue.includes('azkaban')) {
        return <Clock className="w-6 h-6 text-green-600" />;
      }
    }

    const name = connection.name.toLowerCase();
    if (name.includes('spark') || name.includes('stream')) {
      return <Zap className="w-6 h-6 text-yellow-600" />;
    }
    if (name.includes('batch') || name.includes('job')) {
      return <Clock className="w-6 h-6 text-green-600" />;
    }
    if (name.includes('db') || name.includes('data') || name.includes('indexer')) {
      return <Database className="w-6 h-6 text-purple-600" />;
    }
    
    return <AppWindow className="w-6 h-6 text-gray-600" />;
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            <div>
              <div className="font-roboto font-semibold text-gray-800">
                {connection.name}
              </div>
              <div className="text-sm text-gray-500 font-normal">
                Connection Component
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {connection.description && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{connection.description}</p>
            </div>
          )}

          {/* Queue Event Delay */}
          {connection.queue_event_delay && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Queue Event Delay</h3>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-gray-900">{connection.queue_event_delay}</span>
              </div>
            </div>
          )}

          {/* Status */}
          {connection.status && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Status</h3>
              <Badge className={`${getStatusColor(connection.status)} border`}>
                {connection.status}
              </Badge>
            </div>
          )}

          {/* Labels Section */}
          {connection.labels && connection.labels.length > 0 && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Properties</h3>
              <div className="space-y-2">
                {connection.labels.map((label, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-roboto text-sm text-gray-600 font-medium">
                      {label.label.toLowerCase()}:
                    </span>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {String(label.value || 'N/A').toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links Section */}
          {(connection.app_ui_link || connection.metrics_ui_link) && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Quick Links</h3>
              <div className="space-y-2">
                {connection.app_ui_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkClick(connection.app_ui_link!)}
                    className="w-full justify-start"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open App UI
                  </Button>
                )}
                {connection.metrics_ui_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkClick(connection.metrics_ui_link!)}
                    className="w-full justify-start"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Open Metrics UI
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Component ID */}
          <div className="pt-2 border-t">
            <span className="text-xs text-gray-500 font-roboto">
              Component ID: {connection.id}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
