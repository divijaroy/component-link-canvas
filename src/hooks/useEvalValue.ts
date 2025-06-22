import { useState, useEffect } from 'react';
import { LabelEvaluator } from '../services/LabelEvaluator';

export const useEvalValue = (evalString: string) => {
  const [value, setValue] = useState<any>('Loading...');

  useEffect(() => {
    // Get initial value from cache or trigger evaluation
    const initialValue = LabelEvaluator.getValue(evalString);
    setValue(initialValue);

    // Subscribe to updates
    const unsubscribe = LabelEvaluator.subscribe(evalString, (newValue) => {
      setValue(newValue);
    });

    return unsubscribe;
  }, [evalString]);

  return value;
};

export const useEvalLabels = (labels: { label: string; value: string }[]) => {
  const [evaluatedLabels, setEvaluatedLabels] = useState<{ label: string; value: any }[]>([]);

  useEffect(() => {
    const evaluateLabels = async () => {
      const evaluated = await LabelEvaluator.evaluateLabels(labels);
      setEvaluatedLabels(evaluated);
    };

    evaluateLabels();
  }, [labels]);

  return evaluatedLabels;
}; 