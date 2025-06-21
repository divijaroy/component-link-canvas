
import { useState, useEffect } from 'react';
import { ComponentNode, Label } from '../types/ComponentTypes';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Component, ExternalLink, Server, Zap, Clock } from 'lucide-react';
import { LabelEvaluator } from '../services/LabelEvaluator';

interface MaterialComponentCardProps {
  node: ComponentNode;
  onClick?: () => void;
}

export const MaterialComponentCard = ({ node, onClick }: MaterialComponentCardProps) => {
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

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <Card 
      className={`
        ${isMainComponent ? 'w-80 min-h-[160px]' : 'w-72 min-h-[140px]'}
        bg-white shadow-md border border-gray-200 
        hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer
        ${isMainComponent ? 'ring-2 ring-blue-200' : 'ring-1 ring-gray-200'}
      `}
      onClick={onClick}
    >
      <CardHeader className={`${isMainComponent ? 'pb-3 px-5 pt-4' : 'pb-2 px-4 pt-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <h3 className={`font-roboto font-semibold text-gray-800 ${
              isMainComponent ? 'text-base' : 'text-sm'
            }`}>
              {node.name.replace(/"/g, '')}
            </h3>
          </div>
          
          {(node.app_ui_link || node.cosmos_link) && (
            <div className="flex gap-2">
              {node.app_ui_link && (
                <button
                  onClick={(e) => handleLinkClick(e, node.app_ui_link!)}
                  className="p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                  title="Open App UI"
                >
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                </button>
              )}
              {node.cosmos_link && (
                <button
                  onClick={(e) => handleLinkClick(e, node.cosmos_link!)}
                  className="p-1.5 hover:bg-purple-50 rounded-md transition-colors"
                  title="Open Cosmos"
                >
                  <Database className="w-4 h-4 text-purple-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className={`${isMainComponent ? 'px-5 pb-4 pt-0' : 'px-4 pb-3 pt-0'}`}>
        <div className="space-y-3">
          {evaluatedLabels.slice(0, isMainComponent ? 4 : 3).map((label, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className={`font-roboto text-gray-600 ${
                isMainComponent ? 'text-sm' : 'text-xs'
              } font-medium`}>
                {label.label}:
              </span>
              <Badge 
                variant="secondary" 
                className={`${
                  isMainComponent ? 'text-xs px-2.5 py-1' : 'text-xs px-2 py-0.5'
                } bg-gray-100 text-gray-700 font-roboto font-normal max-w-[120px] truncate`}
                title={String(label.value || 'Loading...')}
              >
                {label.value || 'Loading...'}
              </Badge>
            </div>
          ))}
          
          {evaluatedLabels.length > (isMainComponent ? 4 : 3) && (
            <div className="text-center pt-1">
              <Badge variant="outline" className="text-xs text-gray-500">
                +{evaluatedLabels.length - (isMainComponent ? 4 : 3)} more
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
