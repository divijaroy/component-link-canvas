
import { useEffect, useRef, useState } from 'react';
import { ComponentNode, ComponentData, Connection, Position } from '../types/ComponentTypes';
import { ComponentCard } from './ComponentCard';
import { ConnectionLine } from './ConnectionLine';

interface ComponentCanvasProps {
  data: ComponentData[];
  selectedTags: string[];
}

export const ComponentCanvas = ({ data, selectedTags }: ComponentCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Calculate layout positions
  const calculateLayout = () => {
    const containerWidth = canvasRef.current?.clientWidth || 1200;
    const containerHeight = Math.max(800, data.length * 300);
    
    setCanvasSize({ width: containerWidth, height: containerHeight });

    const newNodes: ComponentNode[] = [];
    const newConnections: Connection[] = [];
    
    const componentsPerRow = Math.min(3, Math.max(1, Math.floor(containerWidth / 400)));
    const componentSpacing = { x: containerWidth / componentsPerRow, y: 350 };
    
    data.forEach((component, componentIndex) => {
      const row = Math.floor(componentIndex / componentsPerRow);
      const col = componentIndex % componentsPerRow;
      
      const baseX = (col * componentSpacing.x) + (componentSpacing.x / 2) - 150;
      const baseY = row * componentSpacing.y + 50;
      
      // Add main component node
      newNodes.push({
        id: component.id,
        name: component.name,
        tags: component.tags,
        position: { x: baseX, y: baseY },
        type: 'component',
        description: component.description
      });

      // Add sub-components in a circular layout around the main component
      const subComponentCount = component.subComponents.length;
      const radius = Math.max(120, subComponentCount * 15);
      
      component.subComponents.forEach((subComponent, subIndex) => {
        const angle = (2 * Math.PI * subIndex) / subComponentCount;
        const subX = baseX + radius * Math.cos(angle);
        const subY = baseY + 100 + radius * Math.sin(angle);
        
        newNodes.push({
          id: subComponent.id,
          name: subComponent.name,
          tags: subComponent.tags,
          position: { x: subX, y: subY },
          type: 'subcomponent',
          parentId: component.id,
          description: subComponent.description
        });

        // Add connection from component to sub-component
        newConnections.push({
          id: `${component.id}-${subComponent.id}`,
          source: component.id,
          target: subComponent.id
        });

        // Add connections between sub-components
        if (subComponent.connections) {
          subComponent.connections.forEach(targetId => {
            if (component.subComponents.find(sub => sub.id === targetId)) {
              newConnections.push({
                id: `${subComponent.id}-${targetId}`,
                source: subComponent.id,
                target: targetId
              });
            }
          });
        }
      });

      // Add connections between main components
      if (component.connections) {
        component.connections.forEach(targetId => {
          if (data.find(comp => comp.id === targetId)) {
            newConnections.push({
              id: `${component.id}-${targetId}`,
              source: component.id,
              target: targetId
            });
          }
        });
      }
    });

    setNodes(newNodes);
    setConnections(newConnections);
  };

  useEffect(() => {
    calculateLayout();
    
    const handleResize = () => {
      setTimeout(calculateLayout, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  const getNodePosition = (nodeId: string): Position | null => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.position : null;
  };

  const isHighlighted = (tags: string[]) => {
    return selectedTags.length === 0 || selectedTags.some(tag => tags.includes(tag));
  };

  return (
    <div 
      ref={canvasRef}
      className="relative overflow-auto bg-gradient-to-br from-gray-50 to-blue-50"
      style={{ height: Math.max(600, canvasSize.height) }}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width={canvasSize.width}
        height={canvasSize.height}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6366f1"
              opacity="0.6"
            />
          </marker>
        </defs>
        
        {connections.map(connection => {
          const sourcePos = getNodePosition(connection.source);
          const targetPos = getNodePosition(connection.target);
          
          if (!sourcePos || !targetPos) return null;
          
          const sourceNode = nodes.find(n => n.id === connection.source);
          const targetNode = nodes.find(n => n.id === connection.target);
          
          const isConnectionHighlighted = 
            sourceNode && targetNode &&
            isHighlighted(sourceNode.tags) && isHighlighted(targetNode.tags);
          
          return (
            <ConnectionLine
              key={connection.id}
              source={sourcePos}
              target={targetPos}
              highlighted={isConnectionHighlighted}
            />
          );
        })}
      </svg>

      {nodes.map(node => (
        <div
          key={node.id}
          className="absolute transition-all duration-300"
          style={{
            left: node.position.x,
            top: node.position.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <ComponentCard
            node={node}
            highlighted={isHighlighted(node.tags)}
            selectedTags={selectedTags}
          />
        </div>
      ))}

      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2">No components match your filters</p>
            <p className="text-sm">Try adjusting your search or tag filters</p>
          </div>
        </div>
      )}
    </div>
  );
};
