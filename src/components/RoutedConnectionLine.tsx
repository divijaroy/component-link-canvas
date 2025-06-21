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
    console.log(`RoutedConnectionLine ${id}: Calculating route from ${source.x},${source.y} to ${target.x},${target.y}`);
    
    // Calculate route using routing service
    const calculatedRoute = routingService.calculateRoute(source, target);
    
    console.log(`RoutedConnectionLine ${id}: Calculated route:`, calculatedRoute);
    setRoute(calculatedRoute);
  }, [source, target, routingService, id]);

  if (!route) {
    return null;
  }

  const strokeWidth = isHovered ? 3 : 2;
  const strokeColor = isHovered ? '#1d4ed8' : '#3b82f6';

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Main connection path with animated dashes */}
      <path
        d={route.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray="8,4"
        strokeLinecap="round"
        opacity={0.8}
        className={isAnimated ? 'animate-dash' : ''}
        style={{
          animation: isAnimated ? 'dash 2s linear infinite' : 'none'
        }}
      />
      
      {/* Animated arrow head */}
      <defs>
        <marker
          id={`arrowhead-${id}`}
          markerWidth="12"
          markerHeight="8"
          refX="11"
          refY="4"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <polygon
            points="0 0, 12 4, 0 8"
            fill={strokeColor}
            opacity="0.8"
          />
        </marker>
      </defs>
      
      {/* Arrow path that follows the route */}
      <path
        d={route.path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray="0,1000"
        markerEnd={`url(#arrowhead-${id})`}
        opacity={0.8}
        className={isAnimated ? 'animate-arrow' : ''}
        style={{
          animation: isAnimated ? 'arrow 3s linear infinite' : 'none'
        }}
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
      
      {/* CSS animations */}
      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -12;
            }
          }
          
          @keyframes arrow {
            0% {
              stroke-dasharray: 0, 1000;
            }
            50% {
              stroke-dasharray: 1000, 0;
            }
            100% {
              stroke-dasharray: 1000, 1000;
            }
          }
        `}
      </style>
    </g>
  );
}; 