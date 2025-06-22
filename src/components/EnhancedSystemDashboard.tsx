import React, { useState, useEffect, useRef } from 'react';
import { Component, Layout, SystemData, Connection } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { generateLayout, clearLayoutCache } from '../services/ConnectivityLayoutService';
import { ComponentInfoDialog } from './ComponentInfoDialog';
import { ConnectionInfoDialog } from './ConnectionInfoDialog';
import { SystemHeader } from './SystemHeader';
import { RefreshCw } from 'lucide-react';

// Helper to flatten components and extract connections
const processSystemData = (systemData: SystemData): { components: Component[], connections: Connection[] } => {
  const allComponents: Component[] = [];
  const allConnections: Connection[] = [];
  let connId = 0;

  const traverse = (components: (Component | string)[], parentId?: string) => {
    components.forEach(comp => {
      if (typeof comp === 'string' || !comp.id) return;

      // Add parentId to the component object
      const componentWithParent = { ...comp, parentId: parentId };
      allComponents.push(componentWithParent);

      if (comp.connections) {
        comp.connections.forEach(connection => {
          // Handle both old format (string) and new format (ConnectionObject)
          let targetId: string;
          let connectionComponentId: string | null = null;

          if (typeof connection === 'string') {
            // Old format: just a string target
            targetId = connection;
            // Try to find a matching connection component based on the target
            if (systemData.connections) {
              if (targetId.toLowerCase().includes('db')) {
                const postgresConn = systemData.connections.find(c => c.type === 'database');
                connectionComponentId = postgresConn?.id;
              } else if (targetId.toLowerCase().includes('cache')) {
                const redisConn = systemData.connections.find(c => c.type === 'cache');
                connectionComponentId = redisConn?.id;
              } else if (targetId.toLowerCase().includes('queue')) {
                const kafkaConn = systemData.connections.find(c => c.type === 'message-queue');
                connectionComponentId = kafkaConn?.id;
              }
            }
          } else {
            // New format: ConnectionObject with full details
            targetId = connection.target;
            connectionComponentId = connection.id; // Use the connection's own ID
          }

          allConnections.push({
            id: `e${connId++}`,
            source: comp.id,
            target: targetId,
            label: `conn`,
            connectionComponentId: connectionComponentId
          });
        });
      }

      if (comp.components && comp.components.length > 0) {
        traverse(comp.components, comp.id);
      }
    });
  };

  traverse(systemData.components);
  return { components: allComponents, connections: allConnections };
};

export const EnhancedSystemDashboard: React.FC = () => {
  const [layout, setLayout] = useState<Layout>({ nodes: [], edges: [], width: 0, height: 0 });
  const [infoComponent, setInfoComponent] = useState<any | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [connectionComponents, setConnectionComponents] = useState<any[]>([]);
  const [systemData, setSystemData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const performLayout = async () => {
      // Clear layout cache to ensure we get fresh layout with connectionComponentId
      clearLayoutCache();
      
      // Determine which data file to load via environment variable
      const dataFile = import.meta.env.VITE_DATA_FILE || 'data.json';
      
      // Fetch data from the server
      const response = await fetch(`/${dataFile}`);
      const systemData = await response.json();

      // Store the original data for connection lookup
      setSystemData(systemData);

      // Extract system info if available
      if (systemData.system) {
        setSystemInfo(systemData.system);
      }

      // Extract connection components if available
      if (systemData.connections) {
        setConnectionComponents(systemData.connections);
        console.log('Loaded connection components:', systemData.connections);
      }

      const { components, connections } = processSystemData(systemData);
      console.log('Extracted components:', components.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })));
      console.log('Extracted connections:', connections);
      console.log('Connection details:', connections.map(c => ({ 
        id: c.id, 
        source: c.source, 
        target: c.target, 
        connectionComponentId: c.connectionComponentId 
      })));
      
      // Test: Check if we have any connections with connectionComponentId
      const connectionsWithIds = connections.filter(c => c.connectionComponentId);
      console.log('Connections with connectionComponentId:', connectionsWithIds);
      
      const laidOut = await generateLayout(components, connections, true);
      console.log('Layout result:', laidOut);
      console.log('Layout edges:', laidOut.edges);
      
      setLayout(laidOut);

      if (laidOut.width && laidOut.height) {
        const PADDING = 100;
        setViewOffset({ x: PADDING, y: PADDING });
      }
    };
    performLayout();
  }, []);
  
  // Center the view on load/update
  useEffect(() => {
    const container = containerRef.current;
    if (container && layout.width && layout.width > 0) {
      container.scrollLeft = (layout.width + 200 - container.clientWidth) / 2;
      container.scrollTop = (layout.height + 200 - container.clientHeight) / 2;
    }
  }, [layout.width, layout.height]);

  const handleNodeClick = (componentId: string) => {
    const component = layout.nodes.find(c => c.id === componentId);
    setInfoComponent(component || null);
  };

  const handleConnectionClick = (connectionId: string) => {
    // Find the edge to get its connectionComponentId
    const edge = layout.edges.find(e => e.id === connectionId);
    if (!edge || !edge.connectionComponentId) return;
    
    // Find the connection object by ID in all components
    let connectionObject = null;
    const findConnection = (components: Component[]) => {
      for (const comp of components) {
        if (comp.connections) {
          for (const conn of comp.connections) {
            if (typeof conn !== 'string' && conn.id === edge.connectionComponentId) {
              connectionObject = conn;
              return;
            }
          }
        }
        if (comp.components && comp.components.length > 0) {
          findConnection(comp.components as Component[]);
        }
      }
    };
    
    findConnection(systemData?.components || []);
    
    if (connectionObject) {
      setConnectionInfo(connectionObject);
    }
  };

  const handleRefreshLayout = async () => {
    clearLayoutCache();
    // Determine which data file to load via environment variable
    const dataFile = import.meta.env.VITE_DATA_FILE || 'data.json';

    // Fetch data from the server
    const response = await fetch(`/${dataFile}`);
    const systemData = await response.json();

    // Store the original data for connection lookup
    setSystemData(systemData);

    // Extract system info if available
    if (systemData.system) {
      setSystemInfo(systemData.system);
    }

    // Extract connection components if available
    if (systemData.connections) {
      setConnectionComponents(systemData.connections);
    }

    const { components, connections } = processSystemData(systemData);
    const laidOut = await generateLayout(components, connections, true);
    setLayout(laidOut);
  };

  const canvasWidth = (layout.width ?? 0) + 200;
  const canvasHeight = (layout.height ?? 0) + 200;

  // Helper to get connection label for a given edge
  const getConnectionLabel = (edgeId: string) => {
    // Only for data-complex.json
    const dataFile = import.meta.env.VITE_DATA_FILE || 'data.json';
    console.log('getConnectionLabel called for edgeId:', edgeId, 'dataFile:', dataFile);
    if (!dataFile.includes('complex')) {
      console.log('Not complex data file, returning null');
      return null;
    }
    
    // Find the edge to get its connectionComponentId
    const edge = layout.edges.find(e => e.id === edgeId);
    console.log('Found edge:', edge);
    if (!edge || !edge.connectionComponentId) {
      console.log('No edge or connectionComponentId found');
      return null;
    }
    
    // Find the connection object by ID in all components
    let connectionObject = null;
    const findConnection = (components: Component[]) => {
      for (const comp of components) {
        if (comp.connections) {
          for (const conn of comp.connections) {
            if (typeof conn !== 'string' && conn.id === edge.connectionComponentId) {
              connectionObject = conn;
              console.log('Found connection object:', connectionObject);
              return;
            }
          }
        }
        if (comp.components && comp.components.length > 0) {
          findConnection(comp.components as Component[]);
        }
      }
    };
    
    findConnection(systemData?.components || []);
    
    if (connectionObject) {
      console.log('Returning connection name:', connectionObject.name);
      return connectionObject.name;
    }
    
    console.log('No connection object found, returning null');
    return null;
  };

  return (
    <div ref={containerRef} className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-200 overflow-auto">
      {/* System Header */}
      {systemInfo && (
        <div className="z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <SystemHeader systemInfo={systemInfo} onRefresh={handleRefreshLayout} />
        </div>
      )}
      
      {/* Component Canvas */}
      <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
        <div className="absolute inset-0" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}>
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'auto' }}>
            {layout.edges.map(edge => {
              // Create path from edge sections or fallback to simple line
              let path = [];
              if (edge.sections && edge.sections.length > 0) {
                const section = edge.sections[0];
                path = [section.startPoint, ...(section.bendPoints || []), section.endPoint];
              } else if (edge.source && edge.target) {
                // Fallback: find source and target nodes and create simple path
                const sourceNode = layout.nodes.find(n => n.id === edge.source);
                const targetNode = layout.nodes.find(n => n.id === edge.target);
                if (sourceNode && targetNode) {
                  path = [
                    { x: sourceNode.x + (sourceNode.width || 0) / 2, y: sourceNode.y + (sourceNode.height || 0) / 2 },
                    { x: targetNode.x + (targetNode.width || 0) / 2, y: targetNode.y + (targetNode.height || 0) / 2 }
                  ];
                }
              }
              if (path.length < 2) return null;

              // Calculate midpoint for label
              const midIdx = Math.floor(path.length / 2);
              const p1 = path[midIdx - 1];
              const p2 = path[midIdx];
              const mx = (p1.x + p2.x) / 2;
              const my = (p1.y + p2.y) / 2;
              const label = getConnectionLabel(edge.id);
              console.log('Label for edge', edge.id, ':', label);

              return (
                <g key={edge.id}>
                  <MovingConnectionLine
                    id={edge.id}
                    path={path}
                    onClick={() => handleConnectionClick(edge.id)}
                  />
                  {label && (
                    <foreignObject
                      x={mx - 30}
                      y={my - 16}
                      width={60}
                      height={32}
                      style={{ overflow: 'visible', cursor: 'pointer', zIndex: 10 }}
                      onClick={() => handleConnectionClick(edge.id)}
                    >
                      <div
                        className="flex items-center justify-center text-xs font-medium text-gray-700 select-none"
                        style={{ pointerEvents: 'auto', textAlign: 'center' }}
                      >
                        {label}
                      </div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>
          {layout.nodes.map(node => (
            <div key={node.id} className="absolute"
              style={{
                left: node.x, top: node.y,
                width: node.width, height: node.height,
                zIndex: node.isParent ? 5 : 10,
              }}
            >
              {node.isParent ? (
                <div className="w-full h-full rounded-xl bg-slate-200/50 border-2 border-slate-300/80 border-dashed">
                  <div className="p-3">
                    <MaterialComponentCard
                      node={{
                        ...node,
                        position: { x: node.x ?? 0, y: node.y ?? 0 },
                        nodeType: 'parent'
                      }}
                      onClick={handleNodeClick}
                      isParent={true}
                    />
                  </div>
                </div>
              ) : (
                <MaterialComponentCard
                  node={{
                    ...node,
                    position: { x: node.x ?? 0, y: node.y ?? 0 },
                    nodeType: 'leaf'
                  }}
                  onClick={handleNodeClick}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {infoComponent && <ComponentInfoDialog node={infoComponent} open={!!infoComponent} onOpenChange={(isOpen) => !isOpen && setInfoComponent(null)} />}
      {connectionInfo && <ConnectionInfoDialog connection={connectionInfo} open={!!connectionInfo} onOpenChange={(isOpen) => !isOpen && setConnectionInfo(null)} />}
    </div>
  );
}; 