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
            label: getQueueName(comp.id, targetId),
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

// Helper function to get queue names based on source and target
const getQueueName = (sourceId: string, targetId: string): string => {
  const source = sourceId.toLowerCase();
  const target = targetId.toLowerCase();
  
  // Map specific component combinations to queue names
  if (source.includes('dci') || target.includes('dci')) {
    return 'Kafka';
  } else if (source.includes('dcc') || target.includes('dcc')) {
    return 'Ciesti';
  } else if (source.includes('corrected') || target.includes('corrected')) {
    return 'Varadhi';
  } else if (source.includes('indexer') || target.includes('indexer')) {
    return 'Kafka';
  } else if (source.includes('api') || target.includes('api')) {
    return 'Kafka';
  } else if (source.includes('user') || target.includes('user')) {
    return 'Ciesti';
  } else if (source.includes('order') || target.includes('order')) {
    return 'Varadhi';
  } else if (source.includes('product') || target.includes('product')) {
    return 'Kafka';
  } else if (source.includes('queue') || target.includes('queue')) {
    return 'Ciesti';
  } else if (source.includes('analytics') || target.includes('analytics')) {
    return 'Varadhi';
  } else {
    // Default queue names based on position
    const queueNames = ['Kafka', 'Ciesti', 'Varadhi'];
    const hash = sourceId.charCodeAt(0) + targetId.charCodeAt(0);
    return queueNames[hash % queueNames.length];
  }
};

const isBoxColliding = (box: { x: number, y: number, width: number, height: number }, nodes: any[]) => {
  const padding = 10; // Add some padding to avoid labels touching components
  for (const node of nodes) {
    if (
      box.x < node.x + node.width + padding &&
      box.x + box.width > node.x - padding &&
      box.y < node.y + node.height + padding &&
      box.y + box.height > node.y - padding
    ) {
      return true;
    }
  }
  return false;
};

const findLabelPosition = (path: {x: number, y: number}[], nodes: any[], labelWidth: number, labelHeight: number) => {
  if (path.length < 2) {
    return null;
  }

  const midIdx = Math.floor(path.length / 2);
  const p1 = path[midIdx - 1];
  const p2 = path[midIdx];

  const segmentVector = { x: p2.x - p1.x, y: p2.y - p1.y };
  const segmentLength = Math.sqrt(segmentVector.x ** 2 + segmentVector.y ** 2);
  const unitVector = { x: segmentVector.x / segmentLength, y: segmentVector.y / segmentLength };

  const initialPosition = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
  };

  const maxAttempts = 10;
  const step = 10; // 10 pixels

  for (let i = 0; i < maxAttempts; i++) {
    // Check positive direction
    let testX = initialPosition.x + unitVector.x * i * step;
    let testY = initialPosition.y + unitVector.y * i * step;
    let labelBox = { x: testX - labelWidth / 2, y: testY - labelHeight / 2, width: labelWidth, height: labelHeight };
    
    if (!isBoxColliding(labelBox, nodes)) {
      return { x: testX, y: testY };
    }

    // Check negative direction
    testX = initialPosition.x - unitVector.x * i * step;
    testY = initialPosition.y - unitVector.y * i * step;
    labelBox = { x: testX - labelWidth / 2, y: testY - labelHeight / 2, width: labelWidth, height: labelHeight };

    if (!isBoxColliding(labelBox, nodes)) {
      return { x: testX, y: testY };
    }
  }

  return initialPosition; // Fallback to initial position
};

export const EnhancedSystemDashboard: React.FC = () => {
  const [layout, setLayout] = useState<Layout>({ nodes: [], edges: [], width: 0, height: 0 });
  const [infoComponent, setInfoComponent] = useState<any | null>(null);
  const [connectionInfo, setConnectionInfo] = useState<any | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [connectionComponents, setConnectionComponents] = useState<any[]>([]);
  const [systemData, setSystemData] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPannable, setIsPannable] = useState(false);
  const lastMousePosition = useRef({ x: 0, y: 0 });

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
    };
    performLayout();
  }, []);
  
  // Center and zoom the view on load/update
  useEffect(() => {
    const container = containerRef.current;
    if (container && layout.width > 0 && container.clientWidth > 0) {
      const PADDING = 40; // Horizontal padding
      const containerWidth = container.clientWidth;
      const contentWidthWithPadding = layout.width + PADDING * 2;
      
      const scale = containerWidth / contentWidthWithPadding;
      
      const x = (containerWidth - (layout.width * scale)) / 2;
      const y = PADDING; // Top padding

      setViewTransform({ x, y, scale });
    }
  }, [layout]);

  const zoom = (direction: 'in' | 'out') => {
    setViewTransform(prev => {
      const scale = direction === 'in' ? prev.scale * 1.2 : prev.scale / 1.2;
      const newScale = Math.max(0.1, Math.min(scale, 5));
      
      // Adjust position to keep the center point stable during zoom
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        
        const scaleRatio = newScale / prev.scale;
        const newX = centerX - (centerX - prev.x) * scaleRatio;
        const newY = centerY - (centerY - prev.y) * scaleRatio;
        
        return { x: newX, y: newY, scale: newScale };
      }
      
      return { ...prev, scale: newScale };
    });
  };

  const resetZoom = () => {
    const container = containerRef.current;
    if (container && layout.width > 0 && container.clientWidth > 0) {
      const PADDING = 40; // Horizontal padding
      const containerWidth = container.clientWidth;
      const contentWidthWithPadding = layout.width + PADDING * 2;
      
      const scale = containerWidth / contentWidthWithPadding;
      
      const x = (containerWidth - (layout.width * scale)) / 2;
      const y = PADDING; // Top padding

      setViewTransform({ x, y, scale });
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPannable(true);
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (isPannable) {
      e.preventDefault();
      const dx = e.clientX - lastMousePosition.current.x;
      const dy = e.clientY - lastMousePosition.current.y;
      setViewTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onMouseUp = () => {
    setIsPannable(false);
  };

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

  const handleWheel = (e: React.WheelEvent) => {
    // Check for pinch-to-zoom gesture
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setViewTransform(prev => {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(0.1, Math.min(prev.scale * zoomFactor, 5));

        // Pan to keep the mouse position stable
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);

        return { x: newX, y: newY, scale: newScale };
      });
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-200">
      {/* System Header - Fixed and outside zoomable area */}
      {systemInfo && (
        <div className="p-4 z-50 flex-shrink-0">
          <SystemHeader systemInfo={systemInfo} onRefresh={handleRefreshLayout} />
        </div>
      )}
      
      {/* Zoomable Content Area */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto relative"
      >
        {/* Component Canvas - This is the pannable and zoomable area */}
        <div 
          className="relative w-full h-full"
          style={{ cursor: isPannable ? 'grabbing' : 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={handleWheel}
        >
          <div 
            className="absolute" 
            style={{ 
              transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`, 
              transformOrigin: 'top left',
              width: layout.width, 
              height: layout.height 
            }}
          >
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
                const labelWidth = 80;
                const labelHeight = 24;
                const labelPosition = findLabelPosition(path, layout.nodes, labelWidth, labelHeight);
                
                const label = getConnectionLabel(edge.id);
                console.log('Label for edge', edge.id, ':', label);

                if (!labelPosition) return null;

                return (
                  <g key={edge.id}>
                    <MovingConnectionLine
                      id={edge.id}
                      path={path}
                      onClick={() => handleConnectionClick(edge.id)}
                    />
                    {label && (
                      <foreignObject
                        x={labelPosition.x - labelWidth / 2}
                        y={labelPosition.y - labelHeight / 2}
                        width={labelWidth}
                        height={labelHeight}
                        style={{ overflow: 'visible', cursor: 'pointer', zIndex: 10 }}
                        onClick={() => handleConnectionClick(edge.id)}
                      >
                        <div
                          className="flex items-center justify-center h-full"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <div className="flex items-center rounded-md overflow-hidden border shadow-sm bg-white border-gray-200 px-2 py-1">
                            <span 
                              className="text-xs font-medium text-gray-700 truncate max-w-[70px] block"
                              title={label}
                            >
                              {label}
                            </span>
                          </div>
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
                  pointerEvents: 'auto',
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
                        onClick={() => handleNodeClick(node.id)}
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
                    onClick={() => handleNodeClick(node.id)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Zoom Controls - Kept outside the transformed area */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <button onClick={() => zoom('in')} className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button onClick={() => zoom('out')} className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </button>
          <button onClick={resetZoom} className="p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 20l16-16" /></svg>
          </button>
        </div>
      </div>

      {infoComponent && <ComponentInfoDialog node={infoComponent} open={!!infoComponent} onOpenChange={(isOpen) => !isOpen && setInfoComponent(null)} />}
      {connectionInfo && <ConnectionInfoDialog connection={connectionInfo} open={!!connectionInfo} onOpenChange={(isOpen) => !isOpen && setConnectionInfo(null)} />}
    </div>
  );
}; 