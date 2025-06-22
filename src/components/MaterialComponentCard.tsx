import { useState, useEffect } from 'react';
import { ComponentNode, Label } from '../types/ComponentTypes';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Database, AppWindow, ExternalLink, Server, Zap, Clock, BarChart3, Globe, MessageSquare, Warehouse } from 'lucide-react';
import { LabelEvaluator } from '../services/LabelEvaluator';
import { cn } from '@/lib/utils';

interface MaterialComponentCardProps {
  node: ComponentNode;
  onClick?: (nodeId: string) => void;
  isParent?: boolean;
}

export const MaterialComponentCard = ({ node, onClick, isParent = false }: MaterialComponentCardProps) => {
  const [evaluatedLabels, setEvaluatedLabels] = useState<Label[]>(node.labels);
  
  useEffect(() => {
    const evaluateLabels = async () => {
      const evaluated = await LabelEvaluator.evaluateLabels(node.labels);
      setEvaluatedLabels(evaluated);
    };
    evaluateLabels();
    const interval = setInterval(evaluateLabels, 5000);
    return () => clearInterval(interval);
  }, [node.labels]);
  
  const getIcon = () => {
    const typeLabel = node.labels.find(l => l.label.toLowerCase() === 'type');
    const typeValue = typeLabel?.value.toLowerCase();

    if (typeValue) {
      // Database types
      if (typeValue.includes('postgres') || typeValue.includes('mysql') || typeValue.includes('mongodb')) {
        return <Database className={cn("w-4 h-4 text-purple-600", { "w-5 h-5": isParent })} />;
      }
      if (typeValue.includes('cache') || typeValue.includes('redis')) {
        return <Database className={cn("w-4 h-4 text-red-600", { "w-5 h-5": isParent })} />;
      }
      if (typeValue.includes('data-warehouse')) {
        return <Warehouse className={cn("w-4 h-4 text-indigo-600", { "w-5 h-5": isParent })} />;
      }
      
      // Messaging and streaming
      if (typeValue.includes('spark') || typeValue.includes('stream')) {
        return <Zap className={cn("w-4 h-4 text-yellow-600", { "w-5 h-5": isParent })} />;
      }
      if (typeValue.includes('rabbitmq') || typeValue.includes('kafka') || typeValue.includes('queue')) {
        return <MessageSquare className={cn("w-4 h-4 text-orange-600", { "w-5 h-5": isParent })} />;
      }
      
      // API and gateway types
      if (typeValue.includes('kong') || typeValue.includes('gateway')) {
        return <Globe className={cn("w-4 h-4 text-blue-600", { "w-5 h-5": isParent })} />;
      }
      if (typeValue.includes('external-api')) {
        return <ExternalLink className={cn("w-4 h-4 text-green-600", { "w-5 h-5": isParent })} />;
      }
      
      // Service types
      if (typeValue.includes('drop-wizard') || typeValue.includes('rest')) {
        return <Server className={cn("w-4 h-4 text-blue-600", { "w-5 h-5": isParent })} />;
      }
      if (typeValue.includes('batch') || typeValue.includes('job') || typeValue.includes('azkaban')) {
        return <Clock className={cn("w-4 h-4 text-green-600", { "w-5 h-5": isParent })} />;
      }
    }

    const name = node.name.toLowerCase();
    if (name.includes('spark') || name.includes('stream')) {
      return <Zap className={cn("w-4 h-4 text-yellow-600", { "w-5 h-5": isParent })} />;
    }
    if (name.includes('batch') || name.includes('job')) {
      return <Clock className={cn("w-4 h-4 text-green-600", { "w-5 h-5": isParent })} />;
    }
    if (name.includes('indexer')) {
      return <Database className={cn("w-4 h-4 text-purple-600", { "w-5 h-5": isParent })} />;
    }
    if (name.includes('bdm')) {
      return <Server className={cn("w-4 h-4 text-blue-600", { "w-5 h-5": isParent })} />;
    }
    return <AppWindow className={cn("w-4 h-4 text-gray-600", { "w-5 h-5": isParent })} />;
  };

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const labelLimit = isParent ? 3 : 5;
  const labelsToShow = evaluatedLabels.slice(0, labelLimit);

  const headerContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {getIcon()}
        <h3 className={cn("font-medium", isParent ? "text-slate-700 text-base font-semibold" : "text-gray-800 text-sm")}>
          {node.name.replace(/"/g, '')}
        </h3>
      </div>
      {(node.app_ui_link || node.metrics_ui_link) && (
        <div className={cn("flex", isParent ? "gap-1" : "gap-0.5")}>
          {node.app_ui_link && (
            <button
              onClick={(e) => handleLinkClick(e, node.app_ui_link!)}
              className={cn("hover:bg-blue-50 rounded transition-colors", isParent ? "p-1" : "p-0.5")}
              title="Open App UI"
            >
              <ExternalLink className={cn("text-blue-600", isParent ? "w-4 h-4" : "w-3 h-3")} />
            </button>
          )}
          {node.metrics_ui_link && (
            <button
              onClick={(e) => handleLinkClick(e, node.metrics_ui_link!)}
              className={cn("hover:bg-purple-50 rounded transition-colors", isParent ? "p-1" : "p-0.5")}
              title="Open Metrics UI"
            >
              <BarChart3 className={cn("text-purple-600", isParent ? "w-4 h-4" : "w-3 h-3")} />
            </button>
          )}
        </div>
      )}
    </div>
  );
      
  const labelsContent = (
        <div className="flex flex-wrap gap-1">
      {labelsToShow.map((label, index) => (
        <div key={index} className={cn("flex items-center rounded-full overflow-hidden border", isParent ? "border-slate-300" : "border-gray-200")}>
              <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5">
                <span className="text-xs font-medium">
              {label.label.toLowerCase()}
                </span>
              </div>
          <div className={cn("px-1.5 py-0.5", isParent ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-700")}>
            <span className="text-xs font-normal max-w-[80px] truncate" title={String(label.value !== null && label.value !== undefined ? label.value : 'Loading...').toLowerCase()}>
              {String(label.value !== null && label.value !== undefined ? label.value : 'Loading...').toLowerCase()}
                </span>
              </div>
            </div>
          ))}
      {evaluatedLabels.length > labelLimit && (
        <div className={cn("flex items-center rounded-full overflow-hidden border", isParent ? "border-slate-300" : "border-gray-200")}>
              <div className="bg-blue-100 text-blue-700 px-1.5 py-0.5">
            <span className="text-xs font-medium">more</span>
              </div>
          <div className={cn("px-1.5 py-0.5", isParent ? "bg-slate-100 text-slate-700" : "bg-gray-100 text-gray-700")}>
                <span className="text-xs">
              +{evaluatedLabels.length - labelLimit}
                </span>
              </div>
            </div>
          )}
        </div>
  );

  if (isParent) {
    return (
      <div onClick={() => onClick?.(node.id)} className="cursor-pointer">
        <div className="mb-2">{headerContent}</div>
        {labelsToShow.length > 0 && labelsContent}
      </div>
    );
  }

  return (
    <Card
      className={`w-full h-full bg-white/80 backdrop-blur-sm shadow-sm border border-gray-200/60 hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer ring-1 ring-gray-200/30`}
      onClick={() => onClick?.(node.id)}
    >
      <CardHeader className="pb-1.5 px-2.5 pt-2">
        {headerContent}
      </CardHeader>
      <CardContent className="px-2.5 pb-2 pt-0">
        {labelsToShow.length > 0 && labelsContent}
      </CardContent>
    </Card>
  );
};
