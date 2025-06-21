
import { useEffect, useRef, useState } from 'react';
import { ComponentNode, SystemData, ConnectionLine, Position } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { ComponentInfoDialog } from './ComponentInfoDialog';
import { ConnectionInfoDialog } from './ConnectionInfoDialog';

interface SystemDashboardProps {
  data: SystemData;
}

export const SystemDashboard = ({ data }: SystemDashboardProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<ComponentNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionLine | null>(null);

  const calculateLayout = () => {
    const containerWidth = canvasRef.current?.clientWidth || 1200;
    
    // Calculate dynamic height based on components
    const componentsWithSubs = data.components.filter(c => c.sub_components.length > 0);
    const componentsWithoutSubs = data.components.filter(c => c.sub_components.length === 0);
    const totalSubComponents = data.components.reduce((sum, c) => sum + c.sub_components.length, 0);
    
    // Dynamic height calculation
    const minHeight = 600;
    const componentHeight = 250;
    const subComponentPadding = totalSubComponents * 30;
    const calculatedHeight = Math.max(minHeight, data.components.length * componentHeight + subComponentPadding);
    
    setCanvasSize({ width: containerWidth, height: calculatedHeight });

    const newNodes: ComponentNode[] = [];
    const newConnections: ConnectionLine[] = [];
    
    // Improved layout calculation
    const componentsPerRow = Math.min(4, Math.max(2, Math.floor(containerWidth / 350)));
    const componentSpacing = { 
      x: containerWidth / componentsPerRow, 
      y: Math.max(300, calculatedHeight / Math.ceil(data.components.length / componentsPerRow))
    };
    
    data.components.forEach((component, componentIndex) => {
      const row = Math.floor(componentIndex / componentsPerRow);
      const col = componentIndex % componentsPerRow;
      
      const baseX = (col * componentSpacing.x) + (componentSpacing.x / 2);
      const baseY = row * componentSpacing.y + 120;
      
      // Add main component node with dynamic sizing
      const hasSubComponents = component.sub_components.length > 0;
      newNodes.push({
        id: component.id,
        name: component.name,
        labels: component.labels,
        position: { x: baseX, y: baseY },
        type: 'component',
        app_ui_link: component.app_ui_link,
        cosmos_link: component.cosmos_link
      });

      // Add sub-components with better organization
      if (hasSubComponents) {
        const subComponentCount = component.sub_components.length;
        const subCompRadius = Math.max(140, Math.min(200, subComponentCount * 25));
        
        component.sub_components.forEach((subComponent, subIndex) => {
          const angle = (2 * Math.PI * subIndex) / subComponentCount;
          const subX = baseX + subCompRadius * Math.cos(angle);
          const subY = baseY + 180 + subCompRadius * Math.sin(angle);
          
          newNodes.push({
            id: subComponent.id.replace(/"/g, ''),
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

    // Add connections with labels
    data.connections.forEach((connection, index) => {
      const cleanStart = connection.start.replace(/"/g, '');
      const cleanEnd = connection.end.replace(/"/g, '');
      
      // Generate connection label based on type or pattern
      let connectionLabel = connection.label;
      if (!connectionLabel) {
        if (cleanStart.toLowerCase().includes('kafka') || cleanEnd.toLowerCase().includes('kafka')) {
          connectionLabel = 'Kafka Queue';
        } else if (cleanStart.toLowerCase().includes('api') || cleanEnd.toLowerCase().includes('api')) {
          connectionLabel = 'REST API';
        } else if (cleanStart.toLowerCase().includes('stream')) {
          connectionLabel = 'Data Stream';
        } else {
          connectionLabel = 'Data Flow';
        }
      }
      
      newConnections.push({
        id: `connection-${index}`,
        source: cleanStart,
        target: cleanEnd,
        label: connectionLabel,
        type: connection.type
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
    if (!node) return null;
    
    // Return center position of the card for connections
    return { 
      x: node.position.x, 
      y: node.position.y 
    };
  };

  const handleNodeClick = (node: ComponentNode) => {
    setSelectedNode(node);
  };

  const handleConnectionClick = (connection: ConnectionLine) => {
    setSelectedConnection(connection);
  };

  return (
    <>
      <div 
        ref={canvasRef}
        className="relative w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-auto border-2 border-gray-100 rounded-lg"
        style={{ height: Math.max(600, canvasSize.height + 100) }}
      >
        {/* SVG for connections */}
        <svg
          className="absolute inset-0 pointer-events-none z-10"
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="11"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0 0, 12 4, 0 8"
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
                label={connection.label}
                onClick={() => handleConnectionClick(connection)}
              />
            );
          })}
        </svg>

        {/* Component nodes with improved positioning */}
        {nodes.map(node => {
          const isMainComponent = node.type === 'component';
          const cardWidth = isMainComponent ? 160 : 140;
          const cardHeight = isMainComponent ? 80 : 70;
          
          return (
            <div
              key={node.id}
              className="absolute transition-all duration-300 z-20"
              style={{
                left: node.position.x - cardWidth,
                top: node.position.y - cardHeight,
              }}
            >
              <MaterialComponentCard 
                node={node} 
                onClick={() => handleNodeClick(node)}
              />
            </div>
          );
        })}

        {data.components.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2 font-roboto">No system data provided</p>
              <p className="text-sm font-roboto">Please provide a valid JSON configuration</p>
            </div>
          </div>
        )}
      </div>

      {/* Component Info Dialog */}
      <ComponentInfoDialog
        node={selectedNode}
        open={!!selectedNode}
        onOpenChange={(open) => !open && setSelectedNode(null)}
      />

      {/* Connection Info Dialog */}
      <ConnectionInfoDialog
        connection={selectedConnection}
        open={!!selectedConnection}
        onOpenChange={(open) => !open && setSelectedConnection(null)}
      />
    </>
  );
};
