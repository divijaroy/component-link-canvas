import React, { useEffect, useState } from 'react';
import { Position, ConnectionLine } from '../types/ComponentTypes';
import { ConnectionRoutingService, ConnectionRoute } from '../services/ConnectionRoutingService';

interface RoutedConnectionLineProps {
  source: Position;
  target: Position;
  id: string;
  label?: string;
  onClick?: () => void;
  routingService: ConnectionRoutingService;
  isAnimated?: boolean;
}

export const RoutedConnectionLine: React.FC<RoutedConnectionLineProps> = ({
  source,
  target,
  id,
  label,
  onClick,
  routingService,
  isAnimated = false
}) => {
  const [route, setRoute] = useState<ConnectionRoute | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Calculate route using routing service
    const calculatedRoute = routingService.calculateRoute(source, target);
    setRoute(calculatedRoute);
  }, [source, target, routingService]);

  if (!route) {
    return null;
  }

  const strokeWidth = isHovered ? 3 : 2;
  const strokeColor = isHovered ? '#1d4ed8' : '#3b82f6';
  const strokeDasharray = '5,5'; // Dashed line

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Main connection path */}
      <path
        d={route.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        opacity={0.8}
        className={isAnimated ? 'animate-pulse' : ''}
      />
      
      {/* Connection label */}
      {label && (
        <text
          x={(source.x + target.x) / 2}
          y={(source.y + target.y) / 2 - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          fontWeight="500"
          className="pointer-events-none"
        >
          {label}
        </text>
      )}
    </g>
  );
}; 