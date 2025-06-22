import { Label } from '../types/ComponentTypes';

export class LabelEvaluator {
  private static cache = new Map<string, { value: any; timestamp: number }>();
  private static CACHE_TTL = 4000; // Cache TTL in milliseconds
  private static subscribers = new Map<string, Set<(value: any) => void>>();
  private static evaluationQueue = new Set<string>();
  private static isEvaluating = false;

  private static simpleJsonPath(obj: any, path: string): any {
    if (!path || path === '.') return obj;
    const parts = path.match(/[^.[\]]+/g) || [];
  
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      const key = !isNaN(parseInt(part, 10)) ? parseInt(part, 10) : part;
      if (typeof current !== 'object' || !(key in current)) return undefined;
      current = current[key];
    }
    return current;
  }

  private static parseEvalConfig(value: string): { url: string; config: any } | null {
    // Try to parse as JSON first (new flexible format)
    if (value.startsWith('$eval({')) {
      try {
        const jsonStr = value.substring(6, value.length - 1); // Remove $eval( and )
        const config = JSON.parse(jsonStr);
        return { url: config.url, config };
      } catch (e) {
        console.error('Failed to parse eval config as JSON:', e);
        return null;
      }
    }

    // Fallback to old format for backward compatibility
    const evalRegex = /^\$eval\(([^,]+)(?:,\s*([^)]+))?\)$/;
    const match = value.match(evalRegex);
    if (match) {
      const url = match[1].trim();
      const jsonPath = match[2] ? match[2].trim() : '.';
      return {
        url,
        config: {
          url,
          jsonPath,
          type: 'auto' // Auto-detect response type
        }
      };
    }

    return null;
  }

  private static async processEvaluationQueue() {
    if (this.isEvaluating || this.evaluationQueue.size === 0) return;
    
    this.isEvaluating = true;
    const queue = Array.from(this.evaluationQueue);
    this.evaluationQueue.clear();

    try {
      // Process all queued evaluations in parallel
      const evaluations = queue.map(async (evalString) => {
        const parsed = this.parseEvalConfig(evalString);
        if (!parsed) return;

        const { url, config } = parsed;
        const cacheKey = `${url}|${JSON.stringify(config)}`;

        // Check if we already have a recent cached value
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
          return;
        }

        try {
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');
          const isJson = contentType && contentType.includes('application/json');

          let finalValue: any;

          // Handle different eval types
          switch (config.type) {
            case 'json':
              if (!isJson) {
                throw new Error('Expected JSON response but got non-JSON');
              }
              const data = await response.json();
              const result = this.simpleJsonPath(data, config.jsonPath || '.');
              finalValue = result === undefined ? 'not found' :
                           typeof result === 'object' ? JSON.stringify(result) : result;
              break;

            case 'text':
              // For plain text responses (like random.org)
              const textValue = await response.text();
              finalValue = textValue.trim();
              break;

            case 'status':
              // For status-only endpoints (health checks)
              finalValue = config.successValue || 'Healthy';
              break;

            case 'auto':
            default:
              // Auto-detect based on content type
              if (isJson) {
                const data = await response.json();
                const result = this.simpleJsonPath(data, config.jsonPath || '.');
                finalValue = result === undefined ? 'not found' :
                             typeof result === 'object' ? JSON.stringify(result) : result;
              } else {
                // Non-JSON response, return the actual text content
                const textValue = await response.text();
                finalValue = textValue.trim();
              }
              break;
          }

          // Cache the result
          this.cache.set(cacheKey, { value: finalValue, timestamp: Date.now() });

          // Notify all subscribers
          const subscribers = this.subscribers.get(evalString);
          if (subscribers) {
            subscribers.forEach(callback => callback(finalValue));
          }

        } catch (error) {
          console.error(`Error evaluating ${evalString}:`, error);
          const finalValue = config.errorValue || 'unhealthy';
          this.cache.set(cacheKey, { value: finalValue, timestamp: Date.now() });
          
          // Notify subscribers of error
          const subscribers = this.subscribers.get(evalString);
          if (subscribers) {
            subscribers.forEach(callback => callback(finalValue));
          }
        }
      });

      await Promise.all(evaluations);
    } finally {
      this.isEvaluating = false;
      
      // Process any new items that were added while we were evaluating
      if (this.evaluationQueue.size > 0) {
        setTimeout(() => this.processEvaluationQueue(), 100);
      }
    }
  }

  // Subscribe to eval value changes
  static subscribe(evalString: string, callback: (value: any) => void): () => void {
    if (!this.subscribers.has(evalString)) {
      this.subscribers.set(evalString, new Set());
    }
    
    this.subscribers.get(evalString)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(evalString);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(evalString);
        }
      }
    };
  }

  // Get cached value or trigger evaluation
  static getValue(evalString: string): any {
    const parsed = this.parseEvalConfig(evalString);
    if (!parsed) return evalString;

    const { url, config } = parsed;
    const cacheKey = `${url}|${JSON.stringify(config)}`;
    
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.value;
    }

    // Queue for evaluation if not cached
    this.evaluationQueue.add(evalString);
    this.processEvaluationQueue();
    
    return 'Loading...';
  }
    
  static async evaluate(value: string): Promise<any> {
    if (typeof value !== 'string' || !value.startsWith('$eval(')) {
      return value; // Direct value
    }
      
    const parsed = this.parseEvalConfig(value);
    if (!parsed) return value;

    const { url, config } = parsed;
    const cacheKey = `${url}|${JSON.stringify(config)}`;

    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      return cached.value;
    }

    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      // Handle different eval types
      switch (config.type) {
        case 'json':
          if (!isJson) {
            throw new Error('Expected JSON response but got non-JSON');
          }
          const data = await response.json();
          const result = this.simpleJsonPath(data, config.jsonPath || '.');
          const finalValue = result === undefined ? 'not found' :
                             typeof result === 'object' ? JSON.stringify(result) : result;
          this.cache.set(cacheKey, { value: finalValue, timestamp: Date.now() });
          return finalValue;

        case 'text':
          // For plain text responses (like random.org)
          const textValue = await response.text();
          const trimmedValue = textValue.trim();
          this.cache.set(cacheKey, { value: trimmedValue, timestamp: Date.now() });
          return trimmedValue;

        case 'status':
          // For status-only endpoints (health checks)
          const statusValue = config.successValue || 'Healthy';
          this.cache.set(cacheKey, { value: statusValue, timestamp: Date.now() });
          return statusValue;

        case 'auto':
        default:
          // Auto-detect based on content type
          if (isJson) {
            const data = await response.json();
            const result = this.simpleJsonPath(data, config.jsonPath || '.');
            const finalValue = result === undefined ? 'not found' :
                               typeof result === 'object' ? JSON.stringify(result) : result;
            this.cache.set(cacheKey, { value: finalValue, timestamp: Date.now() });
            return finalValue;
          } else {
            // Non-JSON response, return the actual text content
            const textValue = await response.text();
            const trimmedValue = textValue.trim();
            this.cache.set(cacheKey, { value: trimmedValue, timestamp: Date.now() });
            return trimmedValue;
          }
      }
    } catch (error) {
      console.error(`Error evaluating ${value}:`, error);
      const finalValue = config.errorValue || 'unhealthy';
      this.cache.set(cacheKey, { value: finalValue, timestamp: Date.now() });
      return finalValue;
    }
  }

  static async evaluateLabels(labels: Label[]): Promise<Label[]> {
    return Promise.all(
      labels.map(async (label) => ({
        ...label,
        value: await this.evaluate(label.value),
      }))
    );
  }

  // Start global evaluation cycle
  static startGlobalEvaluation() {
    setInterval(() => {
      // Re-evaluate all cached items
      for (const [cacheKey, cached] of this.cache.entries()) {
        if (Date.now() - cached.timestamp >= this.CACHE_TTL) {
          // Find the original eval string for this cache key
          for (const [evalString, subscribers] of this.subscribers.entries()) {
            const parsed = this.parseEvalConfig(evalString);
            if (parsed) {
              const { url, config } = parsed;
              const key = `${url}|${JSON.stringify(config)}`;
              if (key === cacheKey) {
                this.evaluationQueue.add(evalString);
                break;
              }
            }
          }
        }
      }
      this.processEvaluationQueue();
    }, this.CACHE_TTL);
  }
}
