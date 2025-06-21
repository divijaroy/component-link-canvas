import { useState, useEffect } from 'react';
import { ComponentNode, Label } from '../types/ComponentTypes';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Component, ExternalLink, Server, Zap, Clock, BarChart3 } from 'lucide-react';
import { LabelEvaluator } from '../services/LabelEvaluator';

interface MaterialComponentCardProps {
  node: ComponentNode;
  onClick?: (nodeId: string) => void;
}

export const MaterialComponentCard = ({ node, onClick }: MaterialComponentCardProps) => {
  const [evaluatedLabels, setEvaluatedLabels] = useState<Label[]>(node.labels);
  const isMainComponent = node.type === 'component';
  
  useEffect(() => {
    const evaluateLabels = async () => {
      const evaluated = await LabelEvaluator.evaluateLabels(node.labels);
      setEvaluatedLabels(evaluated);
    };
    
    evaluateLabels();
    
    // Re-evaluate every 5 seconds for dynamic labels
    const interval = setInterval(evaluateLabels, 5000);
    return () => clearInterval(interval);
  }, [node.labels]);
  
  const getIcon = () => {
    const name = node.name.toLowerCase();
    if (name.includes('spark') || name.includes('stream')) {
      return <Zap className="w-3.5 h-3.5 text-yellow-600" />;
    }
    if (name.includes('batch') || name.includes('job')) {
      return <Clock className="w-3.5 h-3.5 text-green-600" />;
    }
    if (name.includes('indexer')) {
      return <Database className="w-3.5 h-3.5 text-purple-600" />;
    }
    if (name.includes('bdm')) {
      return <Server className="w-3.5 h-3.5 text-blue-600" />;
    }
    return <Component className="w-3.5 h-3.5 text-gray-600" />;
  };

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <Card 
      className={`w-full h-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/60 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer ring-1 ring-gray-200/30`}
      onClick={() => onClick?.(node.id)}
    >
      <CardHeader className="pb-1.5 px-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {getIcon()}
            <h3 className="font-medium text-gray-800 text-sm">
              {node.name.replace(/"/g, '')}
            </h3>
          </div>
          
          {(node.app_ui_link || node.metrics_ui_link) && (
            <div className="flex gap-0.5">
              {node.app_ui_link && (
                <button
                  onClick={(e) => handleLinkClick(e, node.app_ui_link!)}
                  className="p-0.5 hover:bg-blue-50 rounded transition-colors"
                  title="Open App UI"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </button>
              )}
              {node.metrics_ui_link && (
                <button
                  onClick={(e) => handleLinkClick(e, node.metrics_ui_link!)}
                  className="p-0.5 hover:bg-purple-50 rounded transition-colors"
                  title="Open Metrics UI"
                >
                  <BarChart3 className="w-3 h-3 text-purple-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-2.5 pb-2 pt-0">
        <div className="flex flex-wrap gap-1">
          {evaluatedLabels.slice(0, 5).map((label, index) => (
            <div key={index} className="flex items-center rounded-full overflow-hidden border border-gray-200">
              <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5">
                <span className="text-xs font-medium">
                  {label.label}
                </span>
              </div>
              <div className="bg-gray-100 text-gray-700 px-1.5 py-0.5">
                <span className="text-xs font-normal max-w-[80px] truncate" title={String(label.value || 'Loading...')}>
                  {label.value || 'Loading...'}
                </span>
              </div>
            </div>
          ))}
          
          {evaluatedLabels.length > 5 && (
            <div className="flex items-center rounded-full overflow-hidden border border-gray-200">
              <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5">
                <span className="text-xs font-medium">More</span>
              </div>
              <div className="bg-gray-100 text-gray-700 px-1.5 py-0.5">
                <span className="text-xs">
                  +{evaluatedLabels.length - 5}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
