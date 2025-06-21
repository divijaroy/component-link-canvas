import React, { useState, useEffect, useRef } from 'react';
import { SystemData, ComponentNode, ConnectionLine } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { ConnectivityLayoutService } from '../services/ConnectivityLayoutService';
import { ConnectionRoutingService } from '../services/ConnectionRoutingService';
import { sampleSystemData } from '../data/sampleData';

interface EnhancedSystemDashboardProps {
  data?: SystemData;
}

function getDiagramBoundingBox(nodes: ComponentNode[]) {
  if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    const box = ConnectivityLayoutService.getComponentBoundingBox(node);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  });
  return { minX, minY, maxX, maxY };
}

export const EnhancedSystemDashboard: React.FC<EnhancedSystemDashboardProps> = ({ 
  data = sampleSystemData 
}) => {
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [diagramOffset, setDiagramOffset] = useState<{x: number, y: number}>({x: 0, y: 0});

  useEffect(() => {
    console.log('Processing system data:', data);
    
    // Process the system data to extract nodes and connections
    const { nodes: processedNodes, connections: processedConnections } = 
      ConnectivityLayoutService.processSystemData(data);
    
    console.log('Processed nodes:', processedNodes);
    console.log('Processed connections:', processedConnections);
    
    // Calculate positions for all nodes
    const positionedNodes = ConnectivityLayoutService.calculatePositions(processedNodes, processedConnections);
    
    setNodes(positionedNodes);
    setConnections(processedConnections);
    
    console.log('Final nodes with positions:', positionedNodes);
  }, [data]);

  // Center the diagram after nodes are positioned
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;
    const { minX, minY, maxX, maxY } = getDiagramBoundingBox(nodes);
    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const offsetX = containerWidth / 2 - (minX + diagramWidth / 2);
    const offsetY = containerHeight / 2 - (minY + diagramHeight / 2);
    setDiagramOffset({ x: offsetX, y: offsetY });
  }, [nodes]);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(selectedNode === nodeId ? null : nodeId);
  };

  const getSubComponents = (parentId: string): ComponentNode[] => {
    return nodes.filter(node => node.parentId === parentId);
  };

  const getMainComponents = (): ComponentNode[] => {
    return nodes.filter(node => node.type === 'component');
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden"
      style={{ minHeight: '800px' }}
    >
      {/* Connection Lines and Component Cards in a centered group */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1, pointerEvents: 'none' }}
        >
          <g transform={`translate(${diagramOffset.x},${diagramOffset.y})`}>
            {connections.map(connection => {
              const sourceNode = nodes.find(node => node.id === connection.source);
              const targetNode = nodes.find(node => node.id === connection.target);
              if (!sourceNode || !targetNode) return null;
              return (
                <MovingConnectionLine
                  key={connection.id}
                  id={connection.id}
                  source={{
                    x: sourceNode.position.x,
                    y: sourceNode.position.y
                  }}
                  target={{
                    x: targetNode.position.x,
                    y: targetNode.position.y
                  }}
                  label={connection.label}
                />
              );
            })}
          </g>
        </svg>
        <div
          className="absolute left-0 top-0 w-full h-full"
          style={{ zIndex: 2, pointerEvents: 'none' }}
        >
          <div
            style={{
              position: 'absolute',
              left: diagramOffset.x,
              top: diagramOffset.y,
              pointerEvents: 'auto',
            }}
          >
            {getMainComponents().map(mainComponent => {
              const subComponents = getSubComponents(mainComponent.id);
              return (
                <div
                  key={mainComponent.id}
                  className="absolute"
                  style={{
                    left: mainComponent.position.x,
                    top: mainComponent.position.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <MaterialComponentCard
                    node={mainComponent}
                    subComponents={subComponents}
                    onClick={() => handleNodeClick(mainComponent.id)}
                  />
                </div>
              );
            })}
            {nodes
              .filter(node => node.type === 'subcomponent' && !node.parentId)
              .map(subComponent => (
                <div
                  key={subComponent.id}
                  className="absolute"
                  style={{
                    left: subComponent.position.x,
                    top: subComponent.position.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <MaterialComponentCard
                    node={subComponent}
                    onClick={() => handleNodeClick(subComponent.id)}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
      {/* Debug Info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold text-gray-800 mb-2">System Overview</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Main Components: {getMainComponents().length}</div>
          <div>Sub Components: {nodes.filter(n => n.type === 'subcomponent').length}</div>
          <div>Connections: {connections.length}</div>
          {selectedNode && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="font-medium">Selected: {selectedNode}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 