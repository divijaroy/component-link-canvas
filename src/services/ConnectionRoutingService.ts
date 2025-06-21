import { ComponentNode, ConnectionLine, Position } from '../types/ComponentTypes';
import { ConnectivityLayoutService } from './ConnectivityLayoutService';

export class ConnectionRoutingService {
  private static readonly PADDING = 20;
  private static readonly GRID_SIZE = 10;

  /**
   * Calculate routed path for a connection
   */
  static calculateConnectionPath(
    source: ComponentNode,
    target: ComponentNode,
    allNodes: ComponentNode[]
  ): Position[] {
    console.log(`Calculating path from ${source.id} to ${target.id}`);
    
    const sourceBox = ConnectivityLayoutService.getComponentBoundingBox(source);
    const targetBox = ConnectivityLayoutService.getComponentBoundingBox(target);
    
    // Calculate nearest border points
    const startPoint = this.getNearestBorderPoint(sourceBox, targetBox);
    const endPoint = this.getNearestBorderPoint(targetBox, sourceBox);
    
    console.log(`Start point: ${startPoint.x}, ${startPoint.y}`);
    console.log(`End point: ${endPoint.x}, ${endPoint.y}`);
    
    // Get all bounding boxes for obstacle avoidance
    const allBoundingBoxes = ConnectivityLayoutService.getAllBoundingBoxes(allNodes);
    
    // Calculate path avoiding obstacles
    const path = this.findPath(startPoint, endPoint, allBoundingBoxes, source.id, target.id);
    
    console.log(`Calculated path with ${path.length} points`);
    return path;
  }

  /**
   * Get the nearest border point of a component to another component
   */
  private static getNearestBorderPoint(
    sourceBox: { x: number; y: number; width: number; height: number },
    targetBox: { x: number; y: number; width: number; height: number }
  ): Position {
    const sourceCenter = {
      x: sourceBox.x + sourceBox.width / 2,
      y: sourceBox.y + sourceBox.height / 2
    };
    
    const targetCenter = {
      x: targetBox.x + targetBox.width / 2,
      y: targetBox.y + targetBox.height / 2
    };
    
    // Calculate direction from source to target
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    
    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // Find intersection with source box border
    const intersections = this.getBoxIntersections(sourceBox, sourceCenter, dirX, dirY);
    
    // Return the intersection point closest to the target
    return intersections.reduce((closest, point) => {
      const distToTarget = Math.sqrt(
        Math.pow(point.x - targetCenter.x, 2) + Math.pow(point.y - targetCenter.y, 2)
      );
      const distClosestToTarget = Math.sqrt(
        Math.pow(closest.x - targetCenter.x, 2) + Math.pow(closest.y - targetCenter.y, 2)
      );
      return distToTarget < distClosestToTarget ? point : closest;
    });
  }

  /**
   * Get intersection points of a ray with a box
   */
  private static getBoxIntersections(
    box: { x: number; y: number; width: number; height: number },
    center: Position,
    dirX: number,
    dirY: number
  ): Position[] {
    const intersections: Position[] = [];
    
    // Check intersection with each edge
    const edges = [
      // Top edge
      { x1: box.x, y1: box.y, x2: box.x + box.width, y2: box.y },
      // Right edge
      { x1: box.x + box.width, y1: box.y, x2: box.x + box.width, y2: box.y + box.height },
      // Bottom edge
      { x1: box.x, y1: box.y + box.height, x2: box.x + box.width, y2: box.y + box.height },
      // Left edge
      { x1: box.x, y1: box.y, x2: box.x, y2: box.y + box.height }
    ];
    
    edges.forEach(edge => {
      const intersection = this.lineIntersection(
        center.x, center.y, center.x + dirX * 1000, center.y + dirY * 1000,
        edge.x1, edge.y1, edge.x2, edge.y2
      );
      
      if (intersection) {
        intersections.push(intersection);
      }
    });
    
    return intersections;
  }

  /**
   * Find intersection of two line segments
   */
  private static lineIntersection(
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number
  ): Position | null {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-10) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  }

  /**
   * Find path from start to end avoiding obstacles
   */
  private static findPath(
    start: Position,
    end: Position,
    boundingBoxes: Map<string, { x: number; y: number; width: number; height: number }>,
    sourceId: string,
    targetId: string
  ): Position[] {
    // Simple direct path with obstacle avoidance
    const path: Position[] = [start];
    
    // Check if direct line intersects any obstacles
    const obstacles = Array.from(boundingBoxes.entries())
      .filter(([id]) => id !== sourceId && id !== targetId)
      .map(([, box]) => box);
    
    if (!this.lineIntersectsObstacles(start, end, obstacles)) {
      // Direct path is possible
      path.push(end);
      return path;
    }
    
    // Need to route around obstacles
    const routedPath = this.routeAroundObstacles(start, end, obstacles);
    path.push(...routedPath);
    
    return path;
  }

  /**
   * Check if a line intersects any obstacles
   */
  private static lineIntersectsObstacles(
    start: Position,
    end: Position,
    obstacles: { x: number; y: number; width: number; height: number }[]
  ): boolean {
    return obstacles.some(obstacle => {
      // Check if line intersects with obstacle box
      const edges = [
        { x1: obstacle.x, y1: obstacle.y, x2: obstacle.x + obstacle.width, y2: obstacle.y },
        { x1: obstacle.x + obstacle.width, y1: obstacle.y, x2: obstacle.x + obstacle.width, y2: obstacle.y + obstacle.height },
        { x1: obstacle.x, y1: obstacle.y + obstacle.height, x2: obstacle.x + obstacle.width, y2: obstacle.y + obstacle.height },
        { x1: obstacle.x, y1: obstacle.y, x2: obstacle.x, y2: obstacle.y + obstacle.height }
      ];
      
      return edges.some(edge => 
        this.lineIntersection(start.x, start.y, end.x, end.y, edge.x1, edge.y1, edge.x2, edge.y2) !== null
      );
    });
  }

  /**
   * Route around obstacles using a simple algorithm
   */
  private static routeAroundObstacles(
    start: Position,
    end: Position,
    obstacles: { x: number; y: number; width: number; height: number }[]
  ): Position[] {
    const path: Position[] = [];
    
    // Find the closest obstacle to the direct path
    let closestObstacle: { x: number; y: number; width: number; height: number } | null = null;
    let minDistance = Infinity;
    
    obstacles.forEach(obstacle => {
      const obstacleCenter = {
        x: obstacle.x + obstacle.width / 2,
        y: obstacle.y + obstacle.height / 2
      };
      
      const distance = this.pointToLineDistance(start, end, obstacleCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestObstacle = obstacle;
      }
    });
    
    if (!closestObstacle) {
      return [end];
    }
    
    // Route around the closest obstacle
    const obstacleCenter = {
      x: closestObstacle.x + closestObstacle.width / 2,
      y: closestObstacle.y + closestObstacle.height / 2
    };
    
    // Calculate offset direction
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const perpX = -dy;
    const perpY = dx;
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
    
    if (perpLength > 0) {
      const offsetDistance = Math.max(closestObstacle.width, closestObstacle.height) / 2 + this.PADDING;
      const offsetX = (perpX / perpLength) * offsetDistance;
      const offsetY = (perpY / perpLength) * offsetDistance;
      
      // Add waypoint around the obstacle
      const waypoint = {
        x: obstacleCenter.x + offsetX,
        y: obstacleCenter.y + offsetY
      };
      
      path.push(waypoint);
    }
    
    path.push(end);
    return path;
  }

  /**
   * Calculate distance from point to line
   */
  private static pointToLineDistance(
    lineStart: Position,
    lineEnd: Position,
    point: Position
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
} 