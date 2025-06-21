import { Position } from '../types/ComponentTypes';
import { Info } from 'lucide-react';

interface MovingConnectionLineProps {
  source: Position;
  target: Position;
  id: string;
  label?: string;
  onClick?: () => void;
  sourceWidth?: number;
  sourceHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
  offset?: number;
  isSubComponent?: boolean;
  verticalOffset?: number;
}

// Helper function to get border intersection points
function getBorderIntersectionPoints(
  source: Position,
  target: Position,
  sourceWidth: number = 320,
  sourceHeight: number = 160,
  targetWidth: number = 320,
  targetHeight: number = 160,
  isSubComponent: boolean = false,
  verticalOffset: number = 0
): { sourceBorder: Position; targetBorder: Position } {
  // For sub-components, the connection logically starts from an offset position.
  // We create an "effective" source point to calculate the line's angle.
  const effectiveSource = { x: source.x, y: source.y + (isSubComponent ? verticalOffset : 0) };

  // Calculate direction from the effective source to the target
  const dx = target.x - effectiveSource.x;
  const dy = target.y - effectiveSource.y;
  const length = Math.hypot(dx, dy);
  
  if (length === 0) {
    return { sourceBorder: source, targetBorder: target };
  }
  
  const dirX = dx / length;
  const dirY = dy / length;
  
  // The physical bounding box of the source component
  const sourceHalfWidth = sourceWidth / 2;
  const sourceHalfHeight = sourceHeight / 2;
  
  const sourceIntersections = [];
  
  if (isSubComponent) {
    const leftEdgeX = source.x - sourceHalfWidth;
    const rightEdgeX = source.x + sourceHalfWidth;

    const distToLeft = Math.hypot(leftEdgeX - target.x, source.y - target.y);
    const distToRight = Math.hypot(rightEdgeX - target.x, source.y - target.y);

    const chosenEdgeX = distToLeft < distToRight ? leftEdgeX : rightEdgeX;

    let intersectionY;
    if (dx !== 0) {
      // Calculate where the line from `effectiveSource` hits the vertical edge
      intersectionY = effectiveSource.y + (chosenEdgeX - effectiveSource.x) * (dy / dx);
    } else {
      intersectionY = effectiveSource.y;
    }
    
    // Clamp the Y-coordinate to the physical border of the parent
    intersectionY = Math.max(source.y - sourceHalfHeight, Math.min(intersectionY, source.y + sourceHalfHeight));

    sourceIntersections.push({ x: chosenEdgeX, y: intersectionY });
  } else {
    // For main components, check all edges
    // Top edge
    if (dirY !== 0) {
      const t = (source.y - sourceHalfHeight - effectiveSource.y) / dirY;
      if (t > 0) {
        const x = effectiveSource.x + dirX * t;
        if (x >= source.x - sourceHalfWidth && x <= source.x + sourceHalfWidth) {
          sourceIntersections.push({ x, y: source.y - sourceHalfHeight });
        }
      }
    }
    
    // Bottom edge
    if (dirY !== 0) {
      const t = (source.y + sourceHalfHeight - effectiveSource.y) / dirY;
      if (t > 0) {
        const x = effectiveSource.x + dirX * t;
        if (x >= source.x - sourceHalfWidth && x <= source.x + sourceHalfWidth) {
          sourceIntersections.push({ x, y: source.y + sourceHalfHeight });
        }
      }
    }
    
    // Left edge
    if (dirX !== 0) {
      const t = (source.x - sourceHalfWidth - effectiveSource.x) / dirX;
      if (t > 0) {
        const y = effectiveSource.y + dirY * t;
        if (y >= source.y - sourceHalfHeight && y <= source.y + sourceHalfHeight) {
          sourceIntersections.push({ x: source.x - sourceHalfWidth, y });
        }
      }
    }
    
    // Right edge
    if (dirX !== 0) {
      const t = (source.x + sourceHalfWidth - effectiveSource.x) / dirX;
      if (t > 0) {
        const y = effectiveSource.y + dirY * t;
        if (y >= source.y - sourceHalfHeight && y <= source.y + sourceHalfHeight) {
          sourceIntersections.push({ x: source.x + sourceHalfWidth, y });
        }
      }
    }
  }
  
  // Target border intersection (reverse direction)
  const targetHalfWidth = targetWidth / 2;
  const targetHalfHeight = targetHeight / 2;
  
  const targetIntersections = [];
  
  // Top edge
  if (dirY !== 0) {
    const t = (target.y - targetHalfHeight - effectiveSource.y) / dirY;
    if (t > 0) {
      const x = effectiveSource.x + dirX * t;
      if (x >= target.x - targetHalfWidth && x <= target.x + targetHalfWidth) {
        targetIntersections.push({ x, y: target.y - targetHalfHeight });
      }
    }
  }
  
  // Bottom edge
  if (dirY !== 0) {
    const t = (target.y + targetHalfHeight - effectiveSource.y) / dirY;
    if (t > 0) {
      const x = effectiveSource.x + dirX * t;
      if (x >= target.x - targetHalfWidth && x <= target.x + targetHalfWidth) {
        targetIntersections.push({ x, y: target.y + targetHalfHeight });
      }
    }
  }
  
  // Left edge
  if (dirX !== 0) {
    const t = (target.x - targetHalfWidth - effectiveSource.x) / dirX;
    if (t > 0) {
      const y = effectiveSource.y + dirY * t;
      if (y >= target.y - targetHalfHeight && y <= target.y + targetHalfHeight) {
        targetIntersections.push({ x: target.x - targetHalfWidth, y });
      }
    }
  }
  
  // Right edge
  if (dirX !== 0) {
    const t = (target.x + targetHalfWidth - effectiveSource.x) / dirX;
    if (t > 0) {
      const y = effectiveSource.y + dirY * t;
      if (y >= target.y - targetHalfHeight && y <= target.y + targetHalfHeight) {
        targetIntersections.push({ x: target.x + targetHalfWidth, y });
      }
    }
  }
  
  // Return the closest intersections
  const sourceBorder = sourceIntersections.length > 0 
    ? sourceIntersections.reduce((closest, point) => {
        const distToTarget = Math.hypot(point.x - target.x, point.y - target.y);
        const distClosestToTarget = Math.hypot(closest.x - target.x, closest.y - target.y);
        return distToTarget < distClosestToTarget ? point : closest;
      })
    : source;
    
  const targetBorder = targetIntersections.length > 0
    ? targetIntersections.reduce((closest, point) => {
        const distToSource = Math.hypot(point.x - effectiveSource.x, point.y - effectiveSource.y);
        const distClosestToSource = Math.hypot(closest.x - effectiveSource.x, closest.y - effectiveSource.y);
        return distToSource < distClosestToSource ? point : closest;
      })
    : target;
  
  return { sourceBorder, targetBorder };
}

export const MovingConnectionLine = ({ 
  source, 
  target, 
  id, 
  label, 
  onClick,
  sourceWidth = 320,
  sourceHeight = 160,
  targetWidth = 320,
  targetHeight = 160,
  offset = 0,
  isSubComponent = false,
  verticalOffset = 0
}: MovingConnectionLineProps) => {
  // Calculate border intersection points with actual component dimensions
  const { sourceBorder, targetBorder } = getBorderIntersectionPoints(
    source, 
    target, 
    sourceWidth, 
    sourceHeight, 
    targetWidth, 
    targetHeight,
    isSubComponent,
    verticalOffset
  );
  
  const midX = (sourceBorder.x + targetBorder.x) / 2;
  const midY = (sourceBorder.y + targetBorder.y) / 2;
  
  // Apply offset to prevent overlapping
  const offsetX = midX + offset;
  const offsetY = midY + offset;
  
  // Create a more visible rectangular path from border to border with offset
  const pathData = `M ${sourceBorder.x} ${sourceBorder.y} L ${offsetX} ${sourceBorder.y} L ${offsetX} ${targetBorder.y} L ${targetBorder.x} ${targetBorder.y}`;

  return (
    <g>
      <defs>
        <style>
          {`
            .moving-dash-${id} {
              stroke-dasharray: 8 4;
              animation: dash-move-${id} 2s linear infinite;
            }
            
            @keyframes dash-move-${id} {
              from {
                stroke-dashoffset: 12;
              }
              to {
                stroke-dashoffset: 0;
              }
            }
          `}
        </style>
      </defs>
      
      {/* Background path for better visibility */}
      <path
        d={pathData}
        stroke="#e5e7eb"
        strokeWidth="6"
        fill="none"
        opacity="0.4"
      />
      
      {/* Main animated path */}
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="3"
        fill="none"
        className={`moving-dash-${id} ${onClick ? 'cursor-pointer hover:stroke-blue-700' : ''}`}
        markerEnd="url(#arrowhead)"
        opacity="0.9"
        onClick={onClick}
        style={{ pointerEvents: onClick ? 'stroke' : 'none' }}
      />
      
      {/* Connection label with icon */}
      {label && (
        <g 
          className={onClick ? 'cursor-pointer' : ''}
          onClick={onClick}
          style={{ pointerEvents: onClick ? 'all' : 'none' }}
        >
          {/* Label background */}
          <rect
            x={offsetX - 25}
            y={offsetY - 10}
            width="50"
            height="20"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="1"
            rx="3"
            opacity="0.95"
          />
          
          {/* Label text */}
          <text
            x={offsetX - 18}
            y={offsetY + 4}
            fontSize="10"
            fill="#1e40af"
            fontFamily="Roboto, sans-serif"
            fontWeight="500"
          >
            {label.length > 6 ? label.substring(0, 6) : label}
          </text>
          
          {/* Info icon */}
          <circle
            cx={offsetX + 15}
            cy={offsetY}
            r="6"
            fill="#3b82f6"
            opacity="0.8"
          />
          <text
            x={offsetX + 15}
            y={offsetY + 2}
            fontSize="8"
            fill="white"
            textAnchor="middle"
            fontFamily="Arial"
            fontWeight="bold"
          >
            i
          </text>
        </g>
      )}
    </g>
  );
};
