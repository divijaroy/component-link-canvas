import { Position } from '../types/ComponentTypes';

interface RoutedConnectionLineProps {
  id: string;
  path: Position[];
  onClick?: () => void;
}

export const MovingConnectionLine = ({ id, path, onClick }: RoutedConnectionLineProps) => {
  if (!path || path.length < 2) {
    return null;
  }

  // Create the SVG path data from the points provided by ELK.
  const pathData = "M " + path.map(p => `${p.x} ${p.y}`).join(" L ");

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
              from { stroke-dashoffset: 12; }
              to { stroke-dashoffset: 0; }
            }
            .connection-line-${id}:hover {
              stroke-width: 3;
              cursor: pointer;
            }
          `}
        </style>
      </defs>
      
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        className={`moving-dash-${id} connection-line-${id}`}
        onClick={onClick}
        style={{ pointerEvents: 'auto' }}
      />
    </g>
  );
};
