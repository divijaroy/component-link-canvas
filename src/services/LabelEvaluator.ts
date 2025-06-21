import { Label } from '../types/ComponentTypes';

export class LabelEvaluator {
  /**
   * Evaluate a label value
   */
  static async evaluateLabel(label: Label): Promise<string> {
    const { value } = label;
    
    // If the value starts with $eval, it's a dynamic evaluation
    if (value.startsWith('$eval(') && value.endsWith(')')) {
      const url = value.slice(6, -1); // Remove $eval( and )
      return await this.fetchMetricValue(url);
    }
    
    // Otherwise, return the static value
    return value;
  }

  /**
   * Fetch metric value from URL
   */
  private static async fetchMetricValue(url: string): Promise<string> {
    try {
      // Simulate API call - in real implementation, this would make an actual HTTP request
      console.log(`Fetching metric from: ${url}`);
      
      // Simulate different response times and values
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
      
      // Return mock values based on the URL
      if (url.includes('lag')) {
        return `${Math.floor(Math.random() * 100)}ms`;
      } else if (url.includes('last-run')) {
        return new Date(Date.now() - Math.random() * 86400000).toISOString();
      } else {
        return `${Math.floor(Math.random() * 1000)}`;
      }
    } catch (error) {
      console.error('Error fetching metric:', error);
      return 'Error';
    }
  }

  /**
   * Evaluate multiple labels
   */
  static async evaluateLabels(labels: Label[]): Promise<Label[]> {
    const evaluatedLabels = await Promise.all(
      labels.map(async (label) => ({
        ...label,
        value: await this.evaluateLabel(label)
      }))
    );
    
    return evaluatedLabels;
  }
}
