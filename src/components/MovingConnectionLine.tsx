import { Position } from '../types/ComponentTypes';

interface RoutedConnectionLineProps {
  id: string;
  path: Position[];
}

export const MovingConnectionLine = ({ id, path }: RoutedConnectionLineProps) => {
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
          `}
        </style>
      </defs>
      
      <path
        d={pathData}
        stroke="#3b82f6"
        strokeWidth="2"
        fill="none"
        className={`moving-dash-${id}`}
      />
    </g>
  );
};
