
import { useEffect, useRef, useState } from 'react';
import { ComponentNode, SystemData, ConnectionLine, Position } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';

interface SystemDashboardProps {
  data: SystemData;
}

export const SystemDashboard = ({ data }: SystemDashboardProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const calculateLayout = () => {
    const containerWidth = canvasRef.current?.clientWidth || 1400;
    const containerHeight = Math.max(800, data.components.length * 300);
    
    setCanvasSize({ width: containerWidth, height: containerHeight });

    const newNodes: ComponentNode[] = [];
    const newConnections: ConnectionLine[] = [];
    
    // Calculate layout with compact padding
    const componentsPerRow = Math.min(4, Math.max(2, Math.floor(containerWidth / 320)));
    const componentSpacing = { x: containerWidth / componentsPerRow, y: 280 };
    
    data.components.forEach((component, componentIndex) => {
      const row = Math.floor(componentIndex / componentsPerRow);
      const col = componentIndex % componentsPerRow;
      
      const baseX = (col * componentSpacing.x) + (componentSpacing.x / 2) - 140;
      const baseY = row * componentSpacing.y + 80;
      
      // Add main component node
      newNodes.push({
        id: component.id,
        name: component.name,
        labels: component.labels,
        position: { x: baseX, y: baseY },
        type: 'component',
        app_ui_link: component.app_ui_link,
        cosmos_link: component.cosmos_link
      });

      // Add sub-components in a compact circular layout
      const subComponentCount = component.sub_components.length;
      if (subComponentCount > 0) {
        const radius = Math.max(100, subComponentCount * 12);
        
        component.sub_components.forEach((subComponent, subIndex) => {
          const angle = (2 * Math.PI * subIndex) / subComponentCount;
          const subX = baseX + radius * Math.cos(angle);
          const subY = baseY + 90 + radius * Math.sin(angle);
          
          newNodes.push({
            id: subComponent.id,
            name: subComponent.name,
            labels: subComponent.labels,
            position: { x: subX, y: subY },
            type: 'subcomponent',
            parentId: component.id,
            app_ui_link: subComponent.app_ui_link,
            cosmos_link: subComponent.cosmos_link
          });
        });
      }
    });

    // Add connections based on the connections array
    data.connections.forEach((connection, index) => {
      const cleanStart = connection.start.replace(/"/g, '');
      const cleanEnd = connection.end.replace(/"/g, '');
      
      newConnections.push({
        id: `connection-${index}`,
        source: cleanStart,
        target: cleanEnd
      });
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

  return (
    <div 
      ref={canvasRef}
      className="relative w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-auto"
      style={{ height: Math.max(600, canvasSize.height + 100) }}
    >
      {/* SVG for connections */}
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
              fill="#3b82f6"
              opacity="0.8"
            />
          </marker>
        </defs>
        
        {connections.map(connection => {
          const sourcePos = getNodePosition(connection.source);
          const targetPos = getNodePosition(connection.target);
          
          if (!sourcePos || !targetPos) return null;
          
          return (
            <MovingConnectionLine
              key={connection.id}
              source={sourcePos}
              target={targetPos}
              id={connection.id}
            />
          );
        })}
      </svg>

      {/* Component nodes */}
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
          <MaterialComponentCard node={node} />
        </div>
      ))}

      {data.components.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-2 font-roboto">No system data provided</p>
            <p className="text-sm font-roboto">Please provide a valid JSON configuration</p>
          </div>
        </div>
      )}
    </div>
  );
};
