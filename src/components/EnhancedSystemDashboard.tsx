import React, { useState, useEffect, useRef } from 'react';
import { SystemData, ComponentNode, ConnectionLine, Position } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { ConnectivityLayoutService } from '../services/ConnectivityLayoutService';
import { sampleSystemData } from '../data/sampleData';
import { ComponentInfoDialog } from './ComponentInfoDialog';

export const EnhancedSystemDashboard: React.FC<{ data?: SystemData }> = ({ data = sampleSystemData }) => {
  const [nodes, setNodes] = useState<ComponentNode[]>([]);
  const [connections, setConnections] = useState<ConnectionLine[]>([]);
  const [infoNode, setInfoNode] = useState<ComponentNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const performLayout = async () => {
      const { nodes: laidOutNodes, connections: processedConnections } = 
        await ConnectivityLayoutService.processAndLayout(data);
      
      setNodes(laidOutNodes);
      setConnections(processedConnections);

      if (laidOutNodes.length > 0) {
        const PADDING = 100;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        laidOutNodes.forEach(node => {
          const box = ConnectivityLayoutService.getComponentBoundingBox(node);
          minX = Math.min(minX, box.x);
          minY = Math.min(minY, box.y);
          maxX = Math.max(maxX, box.x + box.width);
          maxY = Math.max(maxY, box.y + box.height);
        });
        
        const diagramWidth = maxX - minX;
        const diagramHeight = maxY - minY;
        setCanvasSize({ width: diagramWidth + PADDING * 2, height: diagramHeight + PADDING * 2 });
        setViewOffset({ x: -minX + PADDING, y: -minY + PADDING });
      }
    };
    performLayout();
  }, [data]);
  
  // Center the view on load/update
  useEffect(() => {
    const container = containerRef.current;
    if (container && canvasSize.width > 0) {
      container.scrollLeft = (canvasSize.width - container.clientWidth) / 2;
      container.scrollTop = (canvasSize.height - container.clientHeight) / 2;
    }
  }, [canvasSize]);

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    setInfoNode(node || null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
        <div className="absolute inset-0" style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)` }}>
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'none' }}>
            {connections.map(connection => {
              if (!connection.path || connection.path.length === 0) {
                return null;
              }
              return (
                <MovingConnectionLine
                  key={connection.id}
                  id={connection.id}
                  path={connection.path}
                />
              );
            })}
          </svg>
          {nodes.map(node => (
            <div key={node.id} className="absolute"
              style={{
                left: node.position.x, top: node.position.y,
                width: node.width, height: node.height,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <MaterialComponentCard node={node} onClick={handleNodeClick} />
            </div>
          ))}
        </div>
      </div>
      {infoNode && <ComponentInfoDialog node={infoNode} open={!!infoNode} onOpenChange={(isOpen) => !isOpen && setInfoNode(null)} />}
    </div>
  );
}; 