import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Database, Server, RefreshCw } from 'lucide-react';
import { LabelEvaluator } from '../services/LabelEvaluator';

interface SystemInfo {
  name: string;
  description: string;
  overall_lag: string;
  total_components: number;
  status: string;
  last_updated: string;
}

interface SystemHeaderProps {
  systemInfo: SystemInfo;
  onRefresh?: () => void;
}

export const SystemHeader = ({ systemInfo, onRefresh }: SystemHeaderProps) => {
  const [evaluatedInfo, setEvaluatedInfo] = useState<SystemInfo>(systemInfo);

  useEffect(() => {
    const evaluateSystemInfo = async () => {
      const updatedInfo = { ...systemInfo };
      
      // Evaluate dynamic values
      if (systemInfo.overall_lag.startsWith('$eval(')) {
        try {
          const lagValue = await LabelEvaluator.evaluate(systemInfo.overall_lag);
          updatedInfo.overall_lag = lagValue;
        } catch (error) {
          updatedInfo.overall_lag = 'N/A';
        }
      }
      
      if (systemInfo.last_updated.startsWith('$eval(')) {
        try {
          const updatedValue = await LabelEvaluator.evaluate(systemInfo.last_updated);
          updatedInfo.last_updated = updatedValue;
        } catch (error) {
          updatedInfo.last_updated = 'N/A';
        }
      }
      
      setEvaluatedInfo(updatedInfo);
    };

    evaluateSystemInfo();
    const interval = setInterval(evaluateSystemInfo, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [systemInfo]);

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
        return 'bg-green-500 text-white font-semibold border border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white font-semibold border border-yellow-600';
      case 'error':
        return 'bg-red-500 text-white font-semibold border border-red-600';
      default:
        return 'bg-blue-400 text-white font-semibold border border-blue-500';
    }
  };

  return (
    <div className="w-full bg-blue-500 rounded-xl shadow-lg border border-blue-600">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Server className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">{evaluatedInfo.name}</h1>
                <p className="text-blue-200 text-sm">{evaluatedInfo.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-white" />
              <div className="text-right">
                <div className="text-xs text-blue-200">System Lag</div>
                <div className="font-semibold text-white">{evaluatedInfo.overall_lag}ms</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-white" />
              <div className="text-right">
                <div className="text-xs text-blue-200">Components</div>
                <div className="font-semibold text-white">{evaluatedInfo.total_components}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white" />
              <div className="text-right">
                <div className="text-xs text-blue-200">Last Updated</div>
                <div className="font-semibold text-white">{evaluatedInfo.last_updated}</div>
              </div>
            </div>
            
            <Badge className={getStatusBadgeClass(evaluatedInfo.status)}>
              {evaluatedInfo.status}
            </Badge>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
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
  );
}; 