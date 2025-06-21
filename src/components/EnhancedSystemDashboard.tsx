import React, { useState, useEffect, useRef } from 'react';
import { Component, Layout, SystemData, Connection } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { generateLayout, clearLayoutCache } from '../services/ConnectivityLayoutService';
import { sampleSystemData } from '../data/sampleData';
import { ComponentInfoDialog } from './ComponentInfoDialog';
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
        comp.connections.forEach(targetId => {
          allConnections.push({
            id: `e${connId++}`,
            source: comp.id,
            target: targetId,
            label: `conn`
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const performLayout = async () => {
      const { components, connections } = processSystemData(sampleSystemData);
      console.log('Extracted components:', components.map(c => ({ id: c.id, name: c.name, parentId: c.parentId })));
      console.log('Extracted connections:', connections);
      
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

  const handleRefreshLayout = async () => {
    clearLayoutCache();
    const { components, connections } = processSystemData(sampleSystemData);
    const laidOut = await generateLayout(components, connections, true);
    setLayout(laidOut);
  };

  const canvasWidth = (layout.width ?? 0) + 200;
  const canvasHeight = (layout.height ?? 0) + 200;

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-gradient-to-br from-slate-50 to-slate-200 overflow-auto">
      {/* Refresh Button */}
      <button
        onClick={handleRefreshLayout}
        className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
        title="Refresh Layout"
      >
        <RefreshCw className="w-5 h-5 text-gray-600" />
      </button>
      
      <div className="relative" style={{ width: canvasWidth, height: canvasHeight }}>
        <div className="absolute inset-0" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}>
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'none' }}>
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
              
              return path.length > 0 ? (
                <MovingConnectionLine
                  key={edge.id}
                  id={edge.id}
                  path={path}
                />
              ) : null;
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
                  <h3 className="p-3 font-semibold text-slate-700 text-base">
                    {node.name}
                  </h3>
                </div>
              ) : (
                <MaterialComponentCard
                  node={{
                    ...node,
                    position: { x: node.x ?? 0, y: node.y ?? 0 },
                    nodeType: 'leaf' // This might need adjustment based on MaterialComponentCard's needs
                  }}
                  onClick={handleNodeClick}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      {infoComponent && <ComponentInfoDialog node={infoComponent} open={!!infoComponent} onOpenChange={(isOpen) => !isOpen && setInfoComponent(null)} />}
    </div>
  );
}; 