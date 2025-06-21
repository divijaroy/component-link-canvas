import React, { useState, useEffect, useRef } from 'react';
import { SystemData, Position, ComponentNode, ConnectionLine, ComponentGroup } from '../types/ComponentTypes';
import { ConnectivityLayoutService } from '../services/ConnectivityLayoutService';
import { ConnectionRoutingService } from '../services/ConnectionRoutingService';
import { MaterialComponentCard } from './MaterialComponentCard';
import { RoutedConnectionLine } from './RoutedConnectionLine';
import { ComponentInfoDialog } from './ComponentInfoDialog';
import { ConnectionInfoDialog } from './ConnectionInfoDialog';

interface EnhancedSystemDashboardProps {
  data: SystemData;
}

export const EnhancedSystemDashboard = ({ data }: EnhancedSystemDashboardProps) => {
  const [componentGroups, setComponentGroups] = useState<ComponentGroup[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
  const [selectedNode, setSelectedNode] = useState<ComponentNode | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionLine | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const connectivityService = new ConnectivityLayoutService(data);
  const routingService = new ConnectionRoutingService();

  const calculateLayout = () => {
    const containerWidth = canvasRef.current?.clientWidth || 1200;
    const containerHeight = Math.max(800, data.components.length * 400);
    
    setCanvasSize({ width: containerWidth, height: containerHeight });

    console.log('Calculating layout with data:', data);

    // STAGE 1: Position components based on connectivity
    const connectivityLayout = connectivityService.calculateLayout(containerWidth, containerHeight);
    
    console.log('Connectivity layout:', connectivityLayout);
    
    const newGroups: ComponentGroup[] = [];
    const newConnections: ConnectionLine[] = [];
    
    // Create component groups with sub-components inside
    data.components.forEach(originalComponent => {
      // Get position from connectivity service
      const connectivityNode = connectivityLayout.nodes.find(node => node.id === originalComponent.id);
      let mainPosition: Position;
      
      if (connectivityNode) {
        mainPosition = connectivityNode.position;
        console.log(`Main component ${originalComponent.id} positioned at:`, mainPosition);
      } else {
        // Fallback: position at center
        mainPosition = { x: containerWidth / 2, y: containerHeight / 2 };
        console.log(`Main component ${originalComponent.id} using fallback position:`, mainPosition);
      }
      
      // Create main component node
      const mainComponent: ComponentNode = {
        id: originalComponent.id,
        name: originalComponent.name,
        labels: originalComponent.labels,
        position: mainPosition,
        type: 'component',
        app_ui_link: originalComponent.app_ui_link,
        cosmos_link: originalComponent.cosmos_link
      };

      // Create sub-component nodes (for internal rendering)
      const subComponents: ComponentNode[] = originalComponent.sub_components.map(subComponent => {
        return {
          id: subComponent.id,
          name: subComponent.name,
          labels: subComponent.labels,
          position: mainPosition, // Sub-components don't need individual positions
          type: 'subcomponent',
          parentId: originalComponent.id,
          app_ui_link: subComponent.app_ui_link,
          cosmos_link: subComponent.cosmos_link
        };
      });

      // Calculate bounding box for the group (just the main component)
      const minX = mainPosition.x - 80;
      const maxX = mainPosition.x + 80;
      const minY = mainPosition.y - 40;
      const maxY = mainPosition.y + 40;

      newGroups.push({
        id: originalComponent.id,
        name: originalComponent.name,
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

    // STAGE 2: Create connections
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

    console.log('Created connections:', newConnections);
    console.log('Created component groups:', newGroups);

    setComponentGroups(newGroups);
    setConnections(newConnections);
    
    // Update routing service with positioned component groups
    routingService.setComponentGroups(newGroups);
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
    console.log(`Looking for position of node: ${nodeId}`);
    console.log('Available component groups:', componentGroups);
    
    // Find in main components
    for (const group of componentGroups) {
      console.log(`Checking group ${group.id}:`, group.mainComponent.id);
      if (group.mainComponent.id === nodeId) {
        console.log(`Found main component ${nodeId} at:`, group.mainComponent.position);
        return group.mainComponent.position;
      }
      // Find in sub-components - they use the same position as their parent
      for (const subComponent of group.subComponents) {
        console.log(`Checking sub-component ${subComponent.id}`);
        if (subComponent.id === nodeId) {
          console.log(`Found sub-component ${nodeId} at parent position:`, group.mainComponent.position);
          return group.mainComponent.position;
        }
      }
    }
    
    console.log(`Node ${nodeId} not found in any component group`);
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
        {/* SVG for connections - rendered AFTER components to ensure proper layering */}
        <svg
          className="absolute inset-0"
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ overflow: 'visible', zIndex: 15 }}
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
            
            if (!sourcePos || !targetPos) {
              console.log(`Missing position for connection ${connection.id}:`, { source: connection.source, target: connection.target });
              return null;
            }
            
            console.log(`Rendering connection ${connection.id}:`, { source: sourcePos, target: targetPos });
            
            return (
              <RoutedConnectionLine
                key={connection.id}
                source={sourcePos}
                target={targetPos}
                id={connection.id}
                label={connection.label}
                onClick={() => handleConnectionClick(connection)}
                routingService={routingService}
                isAnimated={true}
              />
            );
          })}
        </svg>

        {/* Component nodes - rendered AFTER SVG to ensure proper layering */}
        {componentGroups.map(group => (
          <div
            key={group.id}
            className="absolute transition-all duration-300"
            style={{
              left: group.mainComponent.position.x - 160, // Half of card width
              top: group.mainComponent.position.y - 80, // Half of card height
              zIndex: 20
            }}
          >
            <MaterialComponentCard 
              node={group.mainComponent} 
              subComponents={group.subComponents}
              onClick={() => handleNodeClick(group.mainComponent)}
            />
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