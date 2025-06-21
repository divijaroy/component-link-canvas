
import { Position } from '../types/ComponentTypes';

interface MovingConnectionLineProps {
  source: Position;
  target: Position;
  id: string;
}

export const MovingConnectionLine = ({ source, target, id }: MovingConnectionLineProps) => {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  
  // Create a smooth curve with better control points
  const controlPoint1X = source.x + (midX - source.x) * 0.6;
  const controlPoint1Y = source.y + 20;
  const controlPoint2X = target.x - (target.x - midX) * 0.6;
  const controlPoint2Y = target.y - 20;

  const pathData = `M ${source.x} ${source.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${target.x} ${target.y}`;

  return (
    <g>
      <defs>
        <style>
          {`
            .moving-dash-${id} {
              stroke-dasharray: 10 6;
              animation: dash-move-${id} 3s linear infinite;
            }
            
            @keyframes dash-move-${id} {
              from {
                stroke-dashoffset: 0;
              }
              to {
                stroke-dashoffset: 16;
              }
            }
          `}
        </style>
      </defs>
      
      {/* Background path for better visibility */}
      <path
        d={pathData}
        stroke="#e5e7eb"
        strokeWidth="4"
        fill="none"
        opacity="0.3"
      />
      
      {/* Main animated path */}
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="3"
        fill="none"
        className={`moving-dash-${id}`}
        markerEnd="url(#arrowhead)"
        opacity="0.9"
      />
    </g>
  );
};
