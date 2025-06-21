
import { ComponentNode } from '../types/ComponentTypes';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Component, Package } from 'lucide-react';

interface ComponentCardProps {
  node: ComponentNode;
  highlighted: boolean;
  selectedTags: string[];
}

export const ComponentCard = ({ node, highlighted, selectedTags }: ComponentCardProps) => {
  const isMainComponent = node.type === 'component';
  
  return (
    <Card 
      className={`transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 ${
        highlighted 
          ? 'border-blue-400 shadow-md bg-white' 
          : 'border-gray-200 opacity-60 bg-gray-50'
      } ${
        isMainComponent 
          ? 'w-64 h-32' 
          : 'w-48 h-24'
      }`}
    >
      <CardHeader className={`pb-2 ${isMainComponent ? 'p-4' : 'p-3'}`}>
        <CardTitle className={`flex items-center gap-2 ${
          isMainComponent ? 'text-sm' : 'text-xs'
        } font-semibold text-gray-800`}>
          {isMainComponent ? (
            <Package className="w-4 h-4 text-blue-600" />
          ) : (
            <Component className="w-3 h-3 text-purple-600" />
          )}
          <span className="truncate">{node.name}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className={`${isMainComponent ? 'p-4 pt-0' : 'p-3 pt-0'}`}>
        {node.description && (
          <p className={`text-gray-600 mb-2 ${
            isMainComponent ? 'text-xs' : 'text-xs'
          } line-clamp-2`}>
            {node.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-1">
          {node.tags.slice(0, isMainComponent ? 3 : 2).map(tag => (
            <Badge 
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              className={`${
                isMainComponent ? 'text-xs px-2 py-1' : 'text-xs px-1.5 py-0.5'
              } ${
                selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {tag}
            </Badge>
          ))}
          {node.tags.length > (isMainComponent ? 3 : 2) && (
            <Badge variant="outline" className={`${
              isMainComponent ? 'text-xs' : 'text-xs'
            } text-gray-500`}>
              +{node.tags.length - (isMainComponent ? 3 : 2)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
