
import { ConnectionLine } from '../types/ComponentTypes';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Database, MessageSquare, Globe, ArrowRight } from 'lucide-react';

interface ConnectionInfoDialogProps {
  connection: ConnectionLine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConnectionInfoDialog = ({ connection, open, onOpenChange }: ConnectionInfoDialogProps) => {
  if (!connection) return null;

  const getConnectionIcon = () => {
    const type = connection.type?.toLowerCase() || '';
    const label = connection.label?.toLowerCase() || '';
    
    if (type.includes('kafka') || label.includes('kafka')) {
      return <MessageSquare className="w-6 h-6 text-orange-600" />;
    }
    if (type.includes('database') || type.includes('db') || label.includes('db')) {
      return <Database className="w-6 h-6 text-purple-600" />;
    }
    if (type.includes('api') || type.includes('http') || label.includes('api')) {
      return <Globe className="w-6 h-6 text-blue-600" />;
    }
    return <Zap className="w-6 h-6 text-green-600" />;
  };

  const getConnectionType = () => {
    if (connection.type) return connection.type;
    if (connection.label?.toLowerCase().includes('kafka')) return 'Kafka Message Queue';
    if (connection.label?.toLowerCase().includes('api')) return 'REST API';
    if (connection.label?.toLowerCase().includes('db')) return 'Database Connection';
    return 'Data Flow';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getConnectionIcon()}
            <div>
              <div className="font-roboto font-semibold text-gray-800">
                {connection.label || 'Connection'}
              </div>
              <div className="text-sm text-gray-500 font-normal">
                {getConnectionType()}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Flow */}
          <div>
            <h3 className="font-roboto font-medium text-gray-700 mb-2">Data Flow</h3>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                {connection.source}
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                {connection.target}
              </Badge>
            </div>
          </div>

          {/* Connection Details */}
          <div>
            <h3 className="font-roboto font-medium text-gray-700 mb-2">Details</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-roboto text-sm text-gray-600 font-medium">
                  Type:
                </span>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  {getConnectionType()}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="font-roboto text-sm text-gray-600 font-medium">
                  Status:
                </span>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                  Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Connection ID */}
          <div className="pt-2 border-t">
            <span className="text-xs text-gray-500 font-roboto">
              Connection ID: {connection.id}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
