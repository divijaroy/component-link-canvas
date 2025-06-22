import { useState, useEffect } from 'react';
import { ComponentNode, Label } from '../types/ComponentTypes';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Database, AppWindow, ExternalLink, Server, Zap, Clock, BarChart3, Globe, MessageSquare, Warehouse } from 'lucide-react';
import { useEvalValue } from '../hooks/useEvalValue';
import { cn } from '@/lib/utils';

interface MaterialComponentCardProps {
  node: ComponentNode;
  onClick?: (nodeId: string) => void;
  isParent?: boolean;
}

const StatusIndicator = ({ status }: { status: string }) => {
  const lowerCaseStatus = status?.toLowerCase();
  const color =
    lowerCaseStatus === 'healthy'
      ? 'bg-green-500'
      : lowerCaseStatus === 'warning'
      ? 'bg-yellow-500'
      : lowerCaseStatus === 'error' || lowerCaseStatus === 'unhealthy'
      ? 'bg-red-500'
      : 'bg-gray-400';

  return <div className={cn('w-2.5 h-2.5 rounded-full', color)} title={`Status: ${status}`} />;
};

const CapsuleLabel = ({ label, value, isParent }: { label: string; value: any; isParent: boolean }) => {
  const stringValue = String(value || 'Loading...');
  const lowerCaseValue = stringValue.toLowerCase();
  
  // Determine value background color based on content
  const getValueBackground = () => {
    // Health/status related values
    if (lowerCaseValue === 'healthy' || lowerCaseValue === 'operational' || lowerCaseValue === 'success') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (lowerCaseValue === 'unhealthy' || lowerCaseValue === 'error' || lowerCaseValue === 'failed' || lowerCaseValue === 'down') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (lowerCaseValue === 'warning' || lowerCaseValue === 'degraded') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    
    // Numeric values (lag, metrics)
    if (!isNaN(Number(stringValue))) {
      const num = Number(stringValue);
      if (num <= 2) return 'bg-green-100 text-green-800 border-green-200';
      if (num <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    // Default blue for most values
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <div className={cn(
      "flex items-center rounded-full overflow-hidden border",
      isParent ? "text-sm" : "text-xs"
    )}>
      {/* Label capsule - subtle gray background */}
      <div className={cn(
        "px-2 py-1 bg-gray-100 text-gray-600 font-medium border-gray-200",
        isParent ? "px-3 py-1.5" : "px-2 py-1"
      )}>
        {label.toLowerCase()}
      </div>
      
      {/* Value capsule - blue or color-coded background */}
      <div className={cn(
        "px-2 py-1 border-l-0 font-medium",
        getValueBackground(),
        isParent ? "px-3 py-1.5" : "px-2 py-1"
      )}>
        {stringValue}
      </div>
    </div>
  );
};

export const MaterialComponentCard = ({ node, onClick, isParent = false }: MaterialComponentCardProps) => {
  // Use centralized evaluation for status
  const evaluatedStatus = node.status ? useEvalValue(node.status) : 'unknown';

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
  const labelsToShow = node.labels.slice(0, labelLimit);

  const headerContent = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <StatusIndicator status={evaluatedStatus} />
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
    <div className="flex flex-wrap gap-1.5 mt-2">
      {labelsToShow.map((label, index) => (
        <CapsuleLabel
          key={index}
          label={label.label}
          value={useEvalValue(label.value)}
          isParent={isParent}
        />
      ))}
      {node.labels.length > labelLimit && (
        <div className={cn(
          "flex items-center rounded-full px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200",
          isParent ? "text-sm px-3 py-1.5" : "text-xs px-2 py-1"
        )}>
          +{node.labels.length - labelLimit} more
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
