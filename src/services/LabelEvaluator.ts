
import { Label } from '../types/ComponentTypes';

export class LabelEvaluator {
  private static evaluationCache = new Map<string, any>();
  
  static async evaluateLabel(label: Label): Promise<any> {
    const cacheKey = `${label.label}-${label.evaluator}`;
    
    // Check cache first
    if (this.evaluationCache.has(cacheKey)) {
      return this.evaluationCache.get(cacheKey);
    }
    
    try {
      let result: any;
      
      // Handle different types of evaluators
      if (label.evaluator.includes('$curl(')) {
        // Simulate API call - in real implementation, this would make actual HTTP requests
        result = Math.floor(Math.random() * 1000) + 'ms';
      } else if (label.evaluator.includes('redis')) {
        // Simulate Redis call
        result = new Date().toISOString().split('T')[0];
      } else if (label.evaluator.includes('cosmos metrics')) {
        // Simulate Cosmos metrics
        result = Math.floor(Math.random() * 100) + 'KB/s';
      } else if (label.evaluator.includes('batch time')) {
        // Simulate batch time
        result = new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString();
      } else {
        // Static value
        result = label.evaluator.replace(/"/g, '');
      }
      
      // Cache the result for 5 seconds
      this.evaluationCache.set(cacheKey, result);
      setTimeout(() => {
        this.evaluationCache.delete(cacheKey);
      }, 5000);
      
      return result;
    } catch (error) {
      console.error('Error evaluating label:', error);
      return 'Error';
    }
  }
  
  static clearCache() {
    this.evaluationCache.clear();
  }
}
