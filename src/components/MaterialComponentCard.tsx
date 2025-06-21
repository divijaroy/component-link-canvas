
import { useState, useEffect } from 'react';
import { ComponentNode, Label } from '../types/ComponentTypes';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Component, ExternalLink, Server, Zap, Clock } from 'lucide-react';
import { LabelEvaluator } from '../services/LabelEvaluator';

interface MaterialComponentCardProps {
  node: ComponentNode;
}

export const MaterialComponentCard = ({ node }: MaterialComponentCardProps) => {
  const [evaluatedLabels, setEvaluatedLabels] = useState<Label[]>(node.labels);
  const isMainComponent = node.type === 'component';
  
  useEffect(() => {
    const evaluateLabels = async () => {
      const evaluated = await Promise.all(
        node.labels.map(async (label) => ({
          ...label,
          value: await LabelEvaluator.evaluateLabel(label)
        }))
      );
      setEvaluatedLabels(evaluated);
    };
    
    evaluateLabels();
    
    // Re-evaluate every 5 seconds for dynamic labels
    const interval = setInterval(evaluateLabels, 5000);
    return () => clearInterval(interval);
  }, [node.labels]);
  
  const getIcon = () => {
    if (isMainComponent) {
      return <Server className="w-5 h-5 text-blue-600" />;
    }
    
    const name = node.name.toLowerCase();
    if (name.includes('spark') || name.includes('stream')) {
      return <Zap className="w-4 h-4 text-yellow-600" />;
    }
    if (name.includes('batch') || name.includes('job')) {
      return <Clock className="w-4 h-4 text-green-600" />;
    }
    if (name.includes('db') || name.includes('data')) {
      return <Database className="w-4 h-4 text-purple-600" />;
    }
    return <Component className="w-4 h-4 text-gray-600" />;
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Card className={`
      ${isMainComponent ? 'w-72 min-h-[140px]' : 'w-64 min-h-[120px]'}
      bg-white shadow-lg border-0 
      hover:shadow-xl transition-all duration-300 hover:scale-105
      ${isMainComponent ? 'ring-2 ring-blue-100' : 'ring-1 ring-gray-100'}
    `}>
      <CardHeader className={`${isMainComponent ? 'pb-3 px-4 pt-4' : 'pb-2 px-3 pt-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className={`font-roboto font-semibold text-gray-800 ${
              isMainComponent ? 'text-sm' : 'text-xs'
            } truncate`}>
              {node.name}
            </h3>
          </div>
          
          {(node.app_ui_link || node.cosmos_link) && (
            <div className="flex gap-1">
              {node.app_ui_link && (
                <button
                  onClick={() => handleLinkClick(node.app_ui_link!)}
                  className="p-1 hover:bg-blue-50 rounded transition-colors"
                  title="Open App UI"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                </button>
              )}
              {node.cosmos_link && (
                <button
                  onClick={() => handleLinkClick(node.cosmos_link!)}
                  className="p-1 hover:bg-purple-50 rounded transition-colors"
                  title="Open Cosmos"
                >
                  <Database className="w-3 h-3 text-purple-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={`${isMainComponent ? 'px-4 pb-4 pt-0' : 'px-3 pb-3 pt-0'}`}>
        <div className="space-y-2">
          {evaluatedLabels.map((label, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`font-roboto text-gray-600 ${
                isMainComponent ? 'text-xs' : 'text-xs'
              } font-medium`}>
                {label.label}:
              </span>
              <Badge 
                variant="secondary" 
                className={`${
                  isMainComponent ? 'text-xs px-2 py-1' : 'text-xs px-1.5 py-0.5'
                } bg-gray-100 text-gray-700 font-roboto font-normal`}
              >
                {label.value || 'Loading...'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
