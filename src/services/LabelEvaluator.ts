import { Label } from '../types/ComponentTypes';

export class LabelEvaluator {
  private static cache = new Map<string, { value: any; timestamp: number }>();
  private static CACHE_TTL = 4000; // Cache TTL in milliseconds

  private static simpleJsonPath(obj: any, path: string): any {
    if (!path || path === '.') return obj;
  
    // This regex splits the path into parts, handling both dot and bracket notation.
    const parts = path.match(/[^.[\]]+/g) || [];
  
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      // Check if the part is a number (array index) or a string (object key)
      const key = !isNaN(parseInt(part, 10)) ? parseInt(part, 10) : part;
      
      if (typeof current !== 'object' || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  static async evaluate(value: string): Promise<any> {
    const evalRegex = /^\$eval\(([^,]+)(?:,\s*([^)]+))?\)$/;
    const match = value.match(evalRegex);

    if (!match) {
      return value;
    }

    const url = match[1].trim();
    const jsonPath = match[2] ? match[2].trim() : '.';
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const cacheKey = `${url}|${jsonPath}`;

    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.value;
    }

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      const result = this.simpleJsonPath(data, jsonPath);

      if (result === undefined) {
        return 'not found';
      }

      const finalValue = (typeof result === 'object') ? JSON.stringify(result) : result;

      this.cache.set(cacheKey, { value: finalValue, timestamp: Date.now() });
      return finalValue;
    } catch (error) {
      console.error(`Error evaluating ${value}:`, error);
      return 'Error';
    }
  }

  static async evaluateLabels(labels: { label: string; value: string }[]): Promise<{ label: string; value: any }[]> {
    return Promise.all(
      labels.map(async (label) => ({
        ...label,
        value: await this.evaluate(label.value),
      }))
    );
  }
}
