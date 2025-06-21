
import { Position } from '../types/ComponentTypes';

interface MovingConnectionLineProps {
  source: Position;
  target: Position;
  id: string;
}

export const MovingConnectionLine = ({ source, target, id }: MovingConnectionLineProps) => {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  
  // Create a smooth curve
  const controlPoint1X = source.x + (midX - source.x) * 0.5;
  const controlPoint1Y = source.y;
  const controlPoint2X = target.x - (target.x - midX) * 0.5;
  const controlPoint2Y = target.y;

  const pathData = `M ${source.x} ${source.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${target.x} ${target.y}`;

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
                stroke-dashoffset: 0;
              }
              to {
                stroke-dashoffset: 12;
              }
            }
          `}
        </style>
      </defs>
      
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        className={`moving-dash-${id}`}
        markerEnd="url(#arrowhead)"
        opacity="0.8"
      />
    </g>
  );
};
