import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database, Server, AppWindow, Zap, Clock } from 'lucide-react';

interface ComponentInfoDialogProps {
  node: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ComponentInfoDialog = ({ node, open, onOpenChange }: ComponentInfoDialogProps) => {
  if (!node) return null;

  const getIcon = () => {
    if (node.isParent) {
      return <Server className="w-6 h-6 text-blue-600" />;
    }
    
    const typeLabel = node.labels.find((l: any) => l.label.toLowerCase() === 'type');
    const typeValue = typeLabel?.value.toLowerCase();

    if (typeValue) {
      if (typeValue.includes('spark') || typeValue.includes('stream')) {
        return <Zap className="w-6 h-6 text-yellow-600" />;
      }
      if (typeValue.includes('batch') || typeValue.includes('job') || typeValue.includes('azkaban')) {
        return <Clock className="w-6 h-6 text-green-600" />;
      }
      if (typeValue.includes('drop-wizard') || typeValue.includes('rest')) {
        return <Server className="w-6 h-6 text-blue-600" />;
      }
    }

    // Fallback to name-based detection
    const name = node.name.toLowerCase();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            <div>
              <div className="font-roboto font-semibold text-gray-800">
                {node.name}
              </div>
              <div className="text-sm text-gray-500 font-normal">
                {node.isParent ? 'Component Group' : 'Component'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Labels Section */}
          {node.labels && node.labels.length > 0 && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Labels</h3>
              <div className="space-y-2">
                {node.labels.map((label: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-roboto text-sm text-gray-600 font-medium">
                      {label.label.toLowerCase()}:
                    </span>
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                      {String(label.value || 'Loading...').toLowerCase()}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links Section */}
          {(node.app_ui_link) && (
            <div>
              <h3 className="font-roboto font-medium text-gray-700 mb-2">Quick Links</h3>
              <div className="space-y-2">
                {node.app_ui_link && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLinkClick(node.app_ui_link!)}
                    className="w-full justify-start"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open App UI
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Component ID */}
          <div className="pt-2 border-t">
            <span className="text-xs text-gray-500 font-roboto">
              Component ID: {node.id}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
