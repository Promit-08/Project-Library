export interface ProjectPrediction {
  domain: string;
  sector: string;
  field: string;
  confidence: number;
}

/**
 * Predicts project details based on its description using a keyword mapping.
 */
export async function predictProjectDetails(description: string): Promise<ProjectPrediction> {
  const descLower = description.toLowerCase();
  
  // Mapping logic
  const predictionMap = [
    {
      keywords: ['web', 'react', 'api', 'website', 'frontend', 'backend', 'fullstack'],
      results: { domain: 'Computer Science', sector: 'Information Technology', field: 'Software Engineering' }
    },
    {
      keywords: ['ai', 'data', 'predict', 'model', 'neural', 'learning', 'python', 'analytics'],
      results: { domain: 'Data Science', sector: 'Technology', field: 'Machine Learning' }
    },
    {
      keywords: ['app', 'ios', 'android', 'mobile', 'flutter', 'react native'],
      results: { domain: 'Computer Science', sector: 'Mobile Computing', field: 'App Development' }
    },
    {
      keywords: ['arduino', 'sensor', 'raspberry', 'hardware', 'embedded', 'circuits'],
      results: { domain: 'Engineering', sector: 'Electronics', field: 'IoT / Robotics' }
    },
    {
      keywords: ['market', 'business', 'finance', 'consumer', 'economy', 'startup'],
      results: { domain: 'Business', sector: 'Commerce', field: 'Market Analysis' }
    },
    {
      keywords: ['psychology', 'behavior', 'mental', 'clinical', 'therapy', 'brain'],
      results: { domain: 'Healthcare', sector: 'Medical', field: 'Behavioral Science' }
    }
  ];

  let bestMatch = { domain: 'Other', sector: 'General', field: 'Miscellaneous' };
  let maxWeight = 0;

  // Simple keyword matching
  const weights = predictionMap.map(entry => {
    return entry.keywords.filter(word => descLower.includes(word)).length;
  });

  const maxWeightVal = Math.max(...weights);
  const maxIdx = weights.indexOf(maxWeightVal);

  if (maxWeightVal > 0) {
    bestMatch = predictionMap[maxIdx].results;
    maxWeight = maxWeightVal;
  }

  // Confidence is simulated based on matches
  const confidence = maxWeight > 0 ? Math.min(0.95, 0.5 + (maxWeight * 0.1)) : 0.4;

  return {
    ...bestMatch,
    confidence
  };
}
