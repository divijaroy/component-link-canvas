import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Database, Server, RefreshCw } from 'lucide-react';
import { useEvalValue } from '../hooks/useEvalValue';
import { Label } from '../types/ComponentTypes';
import { SystemInfoDialog } from './SystemInfoDialog';

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

interface SystemHeaderProps {
  systemInfo: SystemInfo;
  onRefresh?: () => void;
}

export const SystemHeader = ({ systemInfo, onRefresh }: SystemHeaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-500 text-white font-semibold border border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white font-semibold border border-yellow-600';
      case 'error':
      case 'unhealthy':
        return 'bg-red-500 text-white font-semibold border border-red-600';
      default:
        return 'bg-blue-400 text-white font-semibold border border-blue-500';
    }
  };

  const handleSystemClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <>
      <div 
        className="w-full bg-blue-500 rounded-xl shadow-lg border border-blue-600 cursor-pointer hover:bg-blue-600 transition-colors duration-200"
        onClick={handleSystemClick}
        title="Click to view system information and links"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Server className="w-8 h-8 text-white" />
                <div>
                  <h1 className="text-2xl font-bold text-white">{systemInfo.name}</h1>
                  <p className="text-blue-200 text-sm">{systemInfo.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* System Labels */}
              {systemInfo.labels?.map((label, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-white" />
                  <div className="text-right">
                    <div className="text-xs text-blue-200 capitalize">{label.label.replace(/_/g, ' ')}</div>
                    <div className="font-semibold text-white">{useEvalValue(label.value)}</div>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-white" />
                <div className="text-right">
                  <div className="text-xs text-blue-200">Components</div>
                  <div className="font-semibold text-white">{systemInfo.total_components}</div>
                </div>
              </div>
              
              <Badge className={getStatusBadgeClass(systemInfo.status)}>
                {systemInfo.status}
              </Badge>
              
              {onRefresh && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  className="p-2 bg-white/10 rounded-lg shadow-sm border border-blue-400 hover:bg-white/20 transition-all duration-200"
                  title="Refresh Layout"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <SystemInfoDialog
        systemInfo={systemInfo}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}; 