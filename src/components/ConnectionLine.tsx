
import { Position } from '../types/ComponentTypes';

interface ConnectionLineProps {
  source: Position;
  target: Position;
  highlighted: boolean;
}

export const ConnectionLine = ({ source, target, highlighted }: ConnectionLineProps) => {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  
  // Create a smooth curve
  const controlPoint1X = source.x + (midX - source.x) * 0.5;
  const controlPoint1Y = source.y;
  const controlPoint2X = target.x - (target.x - midX) * 0.5;
  const controlPoint2Y = target.y;

  const pathData = `M ${source.x} ${source.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${target.x} ${target.y}`;

  return (
    <path
      d={pathData}
      stroke={highlighted ? "#6366f1" : "#d1d5db"}
      strokeWidth={highlighted ? "2" : "1"}
      fill="none"
      opacity={highlighted ? "0.8" : "0.4"}
      markerEnd="url(#arrowhead)"
      className="transition-all duration-300"
    />
  );
};
