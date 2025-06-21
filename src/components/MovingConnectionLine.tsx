
import { Position } from '../types/ComponentTypes';
import { Badge } from '@/components/ui/badge';

interface MovingConnectionLineProps {
  source: Position;
  target: Position;
  id: string;
  label?: string;
  onClick?: () => void;
}

export const MovingConnectionLine = ({ source, target, id, label, onClick }: MovingConnectionLineProps) => {
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
        className={`moving-dash-${id} ${onClick ? 'cursor-pointer hover:stroke-blue-600' : ''}`}
        markerEnd="url(#arrowhead)"
        opacity="0.9"
        onClick={onClick}
        style={{ pointerEvents: onClick ? 'stroke' : 'none' }}
      />
      
      {/* Connection label */}
      {label && (
        <foreignObject
          x={midX - 40}
          y={midY - 12}
          width="80"
          height="24"
          className={onClick ? 'cursor-pointer' : ''}
          onClick={onClick}
        >
          <Badge 
            variant="secondary" 
            className="text-xs bg-white border border-blue-200 text-blue-700 shadow-sm hover:bg-blue-50 transition-colors"
          >
            {label}
          </Badge>
        </foreignObject>
      )}
    </g>
  );
};
