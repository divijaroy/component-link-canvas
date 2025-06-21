import React, { useState, useEffect, useRef } from 'react';
import { SystemData, ComponentNode, ConnectionLine, Position } from '../types/ComponentTypes';
import { MaterialComponentCard } from './MaterialComponentCard';
import { MovingConnectionLine } from './MovingConnectionLine';
import { ConnectivityLayoutService } from '../services/ConnectivityLayoutService';
import { sampleSystemData } from '../data/sampleData';
import { ComponentInfoDialog } from './ComponentInfoDialog';

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
  const [infoNode, setInfoNode] = useState<ComponentNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const { nodes: processedNodes, connections: processedConnections } = 
      ConnectivityLayoutService.processSystemData(data);
    const positionedNodes = ConnectivityLayoutService.calculatePositions(processedNodes, processedConnections);
    setNodes(positionedNodes);
    setConnections(processedConnections);
  }, [data]);

  // Calculate canvas size and view offset
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const PADDING = 150; // Padding around the diagram
    const { minX, minY, maxX, maxY } = getDiagramBoundingBox(nodes);
    
    const diagramWidth = maxX - minX;
    const diagramHeight = maxY - minY;

    setCanvasSize({
      width: diagramWidth + PADDING * 2,
      height: diagramHeight + PADDING * 2,
    });

    // This offset translates world coordinates to be positioned correctly within the canvas
    setViewOffset({
      x: -minX + PADDING,
      y: -minY + PADDING
    });
  }, [nodes]);

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

  const getSubComponents = (parentId: string): ComponentNode[] => {
    return nodes.filter(node => node.parentId === parentId);
  };

  const getMainComponents = (): ComponentNode[] => {
    return nodes.filter(node => node.type === 'component');
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto"
      style={{ minHeight: '800px' }}
    >
      <div 
        className="relative"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1, pointerEvents: 'none' }}
        >
          <g transform={`translate(${viewOffset.x},${viewOffset.y})`}>
            {connections.map(connection => {
              const sourceNode = nodes.find(node => node.id === connection.source);
              const targetNode = nodes.find(node => node.id === connection.target);
              if (!sourceNode || !targetNode) return null;
              
              const getComponentDimensions = (node: ComponentNode) => node.type === 'component'
                  ? { width: 320, height: 160 }
                  : { width: 288, height: 140 };

              const getConnectionSourceInfo = (node: ComponentNode) => {
                if (node.type === 'subcomponent' && node.parentId) {
                  const parentNode = nodes.find(n => n.id === node.parentId);
                  if (parentNode) {
                    const siblings = nodes.filter(n => n.parentId === node.parentId);
                    const subIndex = siblings.findIndex(n => n.id === node.id);
                    const verticalSpacing = 40;
                    const totalHeight = (siblings.length - 1) * verticalSpacing;
                    const offset = (subIndex * verticalSpacing) - (totalHeight / 2);
                    return { position: parentNode.position, isSubComponent: true, verticalOffset: offset };
                  }
                }
                return { position: node.position, isSubComponent: false, verticalOffset: 0 };
              };

              const sourceInfo = getConnectionSourceInfo(sourceNode);
              const sourceDimensions = getComponentDimensions(sourceNode);
              const targetDimensions = getComponentDimensions(targetNode);
              
              return (
                <MovingConnectionLine
                  key={connection.id}
                  id={connection.id}
                  source={sourceInfo.position}
                  target={targetNode.position}
                  label={connection.label}
                  sourceWidth={sourceDimensions.width}
                  sourceHeight={sourceDimensions.height}
                  targetWidth={targetDimensions.width}
                  targetHeight={targetDimensions.height}
                  offset={connections.indexOf(connection) * 15}
                  isSubComponent={sourceInfo.isSubComponent}
                  verticalOffset={sourceInfo.verticalOffset}
                />
              );
            })}
          </g>
        </svg>
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `translate(${viewOffset.x}px, ${viewOffset.y}px)`,
            pointerEvents: 'auto',
            zIndex: 2 
          }}
        >
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: node.position.x,
                top: node.position.y,
                transform: 'translate(-50%, -50%)',
                // Only render main components and standalone sub-components directly.
                // Nested sub-components are rendered inside their parents.
                display: node.type === 'subcomponent' && node.parentId ? 'none' : 'block'
              }}
            >
              <MaterialComponentCard
                node={node}
                subComponents={node.type === 'component' ? getSubComponents(node.id) : []}
                onClick={handleNodeClick}
              />
            </div>
          ))}
        </div>
      </div>

      {infoNode && (
        <ComponentInfoDialog
          node={infoNode}
          open={!!infoNode}
          onOpenChange={(isOpen) => !isOpen && setInfoNode(null)}
        />
      )}
    </div>
  );
}; 