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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Server className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{evaluatedInfo.name}</h1>
                <p className="text-gray-600 text-sm">{evaluatedInfo.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <div className="text-right">
                <div className="text-xs text-gray-500">System Lag</div>
                <div className="font-semibold text-gray-900">{evaluatedInfo.overall_lag}ms</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <div className="text-right">
                <div className="text-xs text-gray-500">Components</div>
                <div className="font-semibold text-gray-900">{evaluatedInfo.total_components}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <div className="text-right">
                <div className="text-xs text-gray-500">Last Updated</div>
                <div className="font-semibold text-gray-900">{evaluatedInfo.last_updated}</div>
              </div>
            </div>
            
            <Badge className={`${getStatusColor(evaluatedInfo.status)} border`}>
              {evaluatedInfo.status}
            </Badge>
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
                title="Refresh Layout"
              >
                <RefreshCw className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 