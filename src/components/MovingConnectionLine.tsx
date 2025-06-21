
import { Position } from '../types/ComponentTypes';
import { Info } from 'lucide-react';

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
  
  // Create a more visible rectangular path
  const pathData = `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`;

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
            x={midX - 25}
            y={midY - 10}
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
            x={midX - 18}
            y={midY + 4}
            fontSize="10"
            fill="#1e40af"
            fontFamily="Roboto, sans-serif"
            fontWeight="500"
          >
            {label.length > 6 ? label.substring(0, 6) : label}
          </text>
          
          {/* Info icon */}
          <circle
            cx={midX + 15}
            cy={midY}
            r="6"
            fill="#3b82f6"
            opacity="0.8"
          />
          <text
            x={midX + 15}
            y={midY + 2}
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
