
import { useEffect, useRef, useState } from 'react';
import { ComponentNode, SystemData, ConnectionLine, Position } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { ComponentInfoDialog } from './ComponentInfoDialog';
import { ConnectionInfoDialog } from './ConnectionInfoDialog';

interface SystemDashboardProps {
  data: SystemData;
}

interface ComponentGroup {
  id: string;
  name: string;
  mainComponent: ComponentNode;
  subComponents: ComponentNode[];
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export const SystemDashboard = ({ data }: SystemDashboardProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [componentGroups, setComponentGroups] = useState<ComponentGroup[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<ComponentNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionLine | null>(null);

  const calculateLayout = () => {
    const containerWidth = canvasRef.current?.clientWidth || 1200;
    const containerHeight = Math.max(800, data.components.length * 400);
    
    setCanvasSize({ width: containerWidth, height: containerHeight });

    const newGroups: ComponentGroup[] = [];
    const newConnections: ConnectionLine[] = [];
    
    // Layout components in a more organized grid
    const componentsPerRow = Math.min(3, Math.max(2, Math.floor(containerWidth / 400)));
    const groupSpacing = { x: containerWidth / componentsPerRow, y: 350 };
    
    data.components.forEach((component, componentIndex) => {
      const row = Math.floor(componentIndex / componentsPerRow);
      const col = componentIndex % componentsPerRow;
      
      const groupCenterX = (col * groupSpacing.x) + (groupSpacing.x / 2);
      const groupCenterY = row * groupSpacing.y + 200;
      
      // Main component position
      const mainComponent: ComponentNode = {
        id: component.id,
        name: component.name,
        labels: component.labels,
        position: { x: groupCenterX, y: groupCenterY },
        type: 'component',
        app_ui_link: component.app_ui_link,
        cosmos_link: component.cosmos_link
      };

      // Sub-components arranged around the main component
      const subComponents: ComponentNode[] = [];
      const hasSubComponents = component.sub_components.length > 0;
      
      if (hasSubComponents) {
        const subComponentCount = component.sub_components.length;
        const cols = Math.ceil(Math.sqrt(subComponentCount));
        const rows = Math.ceil(subComponentCount / cols);
        
        component.sub_components.forEach((subComponent, subIndex) => {
          const subRow = Math.floor(subIndex / cols);
          const subCol = subIndex % cols;
          
          const subX = groupCenterX - (cols * 90) + (subCol * 180) + 90;
          const subY = groupCenterY + 120 + (subRow * 100);
          
          subComponents.push({
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

      // Calculate bounding box for the group
      const allComponents = [mainComponent, ...subComponents];
      const minX = Math.min(...allComponents.map(c => c.position.x)) - 120;
      const maxX = Math.max(...allComponents.map(c => c.position.x)) + 120;
      const minY = Math.min(...allComponents.map(c => c.position.y)) - 60;
      const maxY = Math.max(...allComponents.map(c => c.position.y)) + 60;

      newGroups.push({
        id: component.id,
        name: component.name,
        mainComponent,
        subComponents,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        }
      });
    });

    // Create connections with better positioning
    data.connections.forEach((connection, index) => {
      const cleanStart = connection.start.replace(/"/g, '');
      const cleanEnd = connection.end.replace(/"/g, '');
      
      let connectionLabel = connection.label;
      if (!connectionLabel) {
        if (cleanStart.toLowerCase().includes('kafka') || cleanEnd.toLowerCase().includes('kafka')) {
          connectionLabel = 'Kafka';
        } else if (cleanStart.toLowerCase().includes('api') || cleanEnd.toLowerCase().includes('api')) {
          connectionLabel = 'API';
        } else if (cleanStart.toLowerCase().includes('stream')) {
          connectionLabel = 'Stream';
        } else {
          connectionLabel = 'Data';
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

    setComponentGroups(newGroups);
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
    // Find in main components
    for (const group of componentGroups) {
      if (group.mainComponent.id === nodeId) {
        return group.mainComponent.position;
      }
      // Find in sub-components
      const subComponent = group.subComponents.find(sub => sub.id === nodeId);
      if (subComponent) {
        return subComponent.position;
      }
    }
    return null;
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
        {/* Component Group Boundaries */}
        {componentGroups.map(group => (
          <div
            key={`group-${group.id}`}
            className="absolute border-2 border-dashed border-blue-300 rounded-lg bg-white/20 backdrop-blur-sm"
            style={{
              left: group.boundingBox.x,
              top: group.boundingBox.y,
              width: group.boundingBox.width,
              height: group.boundingBox.height,
              zIndex: 1
            }}
          >
            {/* Group Title */}
            <div className="absolute -top-6 left-4 bg-blue-600 text-white px-3 py-1 rounded-t-lg text-sm font-roboto font-semibold">
              {group.name.replace(/"/g, '')}
            </div>
          </div>
        ))}

        {/* SVG for connections */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ overflow: 'visible', zIndex: 10 }}
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

        {/* Component nodes */}
        {componentGroups.map(group => (
          <div key={`nodes-${group.id}`}>
            {/* Main component */}
            <div
              className="absolute transition-all duration-300"
              style={{
                left: group.mainComponent.position.x - 80,
                top: group.mainComponent.position.y - 40,
                zIndex: 20
              }}
            >
              <MaterialComponentCard 
                node={group.mainComponent} 
                onClick={() => handleNodeClick(group.mainComponent)}
              />
            </div>
            
            {/* Sub-components */}
            {group.subComponents.map(subComponent => (
              <div
                key={subComponent.id}
                className="absolute transition-all duration-300"
                style={{
                  left: subComponent.position.x - 70,
                  top: subComponent.position.y - 35,
                  zIndex: 20
                }}
              >
                <MaterialComponentCard 
                  node={subComponent} 
                  onClick={() => handleNodeClick(subComponent)}
                />
              </div>
            ))}
          </div>
        ))}

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
