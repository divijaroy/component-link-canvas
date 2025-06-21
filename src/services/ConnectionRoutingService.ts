import { Position, ComponentGroup } from '../types/ComponentTypes';

export interface RoutePoint {
  x: number;
  y: number;
  type: 'start' | 'end' | 'waypoint';
}

export interface ConnectionRoute {
  points: RoutePoint[];
  path: string; // SVG path string
  distance: number;
}

export interface ComponentBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ConnectionRoutingService {
  private componentBoxes: ComponentBox[] = [];
  private padding = 30; // Padding around components for routing

  setComponentGroups(groups: ComponentGroup[]) {
    // Extract individual component boxes from groups
    this.componentBoxes = [];
    
    groups.forEach(group => {
      // Add main component box
      this.componentBoxes.push({
        id: group.mainComponent.id,
        x: group.mainComponent.position.x - 80, // Card width is ~160px
        y: group.mainComponent.position.y - 40, // Card height is ~80px
        width: 160,
        height: 80
      });
    });
    
    console.log('Routing service component boxes:', this.componentBoxes);
  }

  /**
   * Calculate a route between two points that avoids component boxes
   */
  calculateRoute(start: Position, end: Position): ConnectionRoute {
    // First, try a direct curved path
    const directRoute = this.calculateDirectRoute(start, end);
    
    // Check if direct route intersects with any component
    if (!this.routeIntersectsComponent(directRoute.points)) {
      return directRoute;
    }

    // If direct route intersects, find a path around obstacles
    return this.calculateDetourRoute(start, end);
  }

  /**
   * Calculate a direct curved route
   */
  private calculateDirectRoute(start: Position, end: Position): ConnectionRoute {
    const points: RoutePoint[] = [
      { x: start.x, y: start.y, type: 'start' },
      { x: end.x, y: end.y, type: 'end' }
    ];

    // Add control points for smooth curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Create smooth curve with control points
    const curveIntensity = Math.min(distance * 0.2, 80);
    
    // Calculate perpendicular direction for curve
    const perpX = -dy / distance;
    const perpY = dx / distance;
    
    // Add control points for smooth curve
    const control1: RoutePoint = {
      x: start.x + dx * 0.25 + perpX * curveIntensity,
      y: start.y + dy * 0.25 + perpY * curveIntensity,
      type: 'waypoint'
    };
    
    const control2: RoutePoint = {
      x: start.x + dx * 0.75 - perpX * curveIntensity,
      y: start.y + dy * 0.75 - perpY * curveIntensity,
      type: 'waypoint'
    };

    points.splice(1, 0, control1, control2);

    return {
      points,
      path: this.generateSVGPath(points),
      distance: this.calculateDistance(start, end)
    };
  }

  /**
   * Calculate a detour route around obstacles
   */
  private calculateDetourRoute(start: Position, end: Position): ConnectionRoute {
    const obstacles = this.findObstaclesBetween(start, end);
    
    if (obstacles.length === 0) {
      return this.calculateDirectRoute(start, end);
    }

    // Find waypoints to navigate around obstacles
    const waypoints = this.findWaypointsAroundObstacles(start, end, obstacles);
    
    const points: RoutePoint[] = [
      { x: start.x, y: start.y, type: 'start' },
      ...waypoints.map(wp => ({ x: wp.x, y: wp.y, type: 'waypoint' as const })),
      { x: end.x, y: end.y, type: 'end' }
    ];

    return {
      points,
      path: this.generateSVGPath(points),
      distance: this.calculatePathDistance(points)
    };
  }

  /**
   * Find obstacles between two points
   */
  private findObstaclesBetween(start: Position, end: Position): ComponentBox[] {
    const obstacles: ComponentBox[] = [];
    
    for (const box of this.componentBoxes) {
      if (this.lineIntersectsBoundingBox(start, end, box)) {
        obstacles.push(box);
      }
    }

    return obstacles;
  }

  /**
   * Find waypoints to navigate around obstacles
   */
  private findWaypointsAroundObstacles(start: Position, end: Position, obstacles: ComponentBox[]): Position[] {
    const waypoints: Position[] = [];
    let currentPos = { ...start };

    // Sort obstacles by distance from start
    obstacles.sort((a, b) => {
      const distA = this.calculateDistance(start, { x: a.x + a.width / 2, y: a.y + a.height / 2 });
      const distB = this.calculateDistance(start, { x: b.x + b.width / 2, y: b.y + b.height / 2 });
      return distA - distB;
    });

    // Generate waypoints to avoid each obstacle
    for (const obstacle of obstacles) {
      const waypoint = this.findWaypointAroundObstacle(currentPos, obstacle, end);
      if (waypoint) {
        waypoints.push(waypoint);
        currentPos = waypoint;
      }
    }

    return waypoints;
  }

  /**
   * Find a waypoint to navigate around a specific obstacle
   */
  private findWaypointAroundObstacle(from: Position, obstacle: ComponentBox, to: Position): Position | null {
    const centerX = obstacle.x + obstacle.width / 2;
    const centerY = obstacle.y + obstacle.height / 2;
    
    // Calculate directions to try (8 directions around the obstacle)
    const directions = [
      { x: 0, y: -1 },   // up
      { x: 1, y: -1 },   // up-right
      { x: 1, y: 0 },    // right
      { x: 1, y: 1 },    // down-right
      { x: 0, y: 1 },    // down
      { x: -1, y: 1 },   // down-left
      { x: -1, y: 0 },   // left
      { x: -1, y: -1 }   // up-left
    ];

    const obstacleRadius = Math.max(obstacle.width, obstacle.height) / 2 + this.padding;

    for (const direction of directions) {
      const waypoint = {
        x: centerX + direction.x * obstacleRadius,
        y: centerY + direction.y * obstacleRadius
      };

      // Check if this waypoint is valid (not inside another obstacle)
      if (!this.isPointInAnyObstacle(waypoint)) {
        return waypoint;
      }
    }

    return null;
  }

  /**
   * Check if a line intersects with a bounding box
   */
  private lineIntersectsBoundingBox(start: Position, end: Position, boundingBox: ComponentBox): boolean {
    const { x, y, width, height } = boundingBox;
    
    // Expand bounding box with padding
    const expandedBox = {
      x: x - this.padding,
      y: y - this.padding,
      width: width + this.padding * 2,
      height: height + this.padding * 2
    };

    // Check if line intersects with expanded bounding box
    return this.lineIntersectsRect(start, end, expandedBox);
  }

  /**
   * Check if a line intersects with a rectangle
   */
  private lineIntersectsRect(start: Position, end: Position, rect: { x: number; y: number; width: number; height: number }): boolean {
    const { x, y, width, height } = rect;
    
    // Check if either endpoint is inside the rectangle
    if (this.isPointInRect(start, rect) || this.isPointInRect(end, rect)) {
      return true;
    }
    
    // Check intersection with each edge of the rectangle
    const edges = [
      // Top edge
      { x1: x, y1: y, x2: x + width, y2: y },
      // Right edge
      { x1: x + width, y1: y, x2: x + width, y2: y + height },
      // Bottom edge
      { x1: x, y1: y + height, x2: x + width, y2: y + height },
      // Left edge
      { x1: x, y1: y, x2: x, y2: y + height }
    ];
    
    for (const edge of edges) {
      if (this.linesIntersect(start.x, start.y, end.x, end.y, edge.x1, edge.y1, edge.x2, edge.y2)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if two line segments intersect
   */
  private linesIntersect(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ): boolean {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false; // Lines are parallel
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  /**
   * Check if a point is inside a rectangle
   */
  private isPointInRect(point: Position, rect: { x: number; y: number; width: number; height: number }): boolean {
    return point.x >= rect.x && point.x <= rect.x + rect.width &&
           point.y >= rect.y && point.y <= rect.y + rect.height;
  }

  /**
   * Check if a point is inside any obstacle
   */
  private isPointInAnyObstacle(point: Position): boolean {
    for (const box of this.componentBoxes) {
      if (this.isPointInRect(point, box)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a route intersects with any component
   */
  private routeIntersectsComponent(points: RoutePoint[]): boolean {
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      
      for (const box of this.componentBoxes) {
        if (this.lineIntersectsBoundingBox(start, end, box)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Generate SVG path string from route points
   */
  private generateSVGPath(points: RoutePoint[]): string {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    if (points.length === 2) {
      // Simple line
      path += ` L ${points[1].x} ${points[1].y}`;
    } else if (points.length === 4) {
      // Smooth curve with control points
      path += ` Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`;
      path += ` T ${points[3].x} ${points[3].y}`;
    } else {
      // Multiple waypoints - use smooth curve
      for (let i = 1; i < points.length; i++) {
        if (i === 1) {
          path += ` Q ${points[i].x} ${points[i].y} ${points[i + 1].x} ${points[i + 1].y}`;
        } else if (i < points.length - 1) {
          path += ` T ${points[i + 1].x} ${points[i + 1].y}`;
        }
      }
    }
    
    return path;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(a: Position, b: Position): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate total distance of a path
   */
  private calculatePathDistance(points: RoutePoint[]): number {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDistance += this.calculateDistance(points[i], points[i + 1]);
    }
    return totalDistance;
  }
} 