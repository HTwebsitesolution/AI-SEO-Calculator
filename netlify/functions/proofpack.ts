import { Handler } from '@netlify/functions';

// Mock proof data for demo
const handler: Handler = async (event) => {
  const { deployment_id } = event.queryStringParameters || {};
  // TODO: Replace with real DB lookup using deployment_id
  if (!deployment_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing deployment_id' })
    };
  }
  // Example mock data
  const data = {
    kpi: 'Organic Traffic',
    baseline_value: 1000,
    assess_value: 1200,
    lift_pct: 20,
    passed_threshold_bool: true,
    charts: [
      {
        label: 'Traffic Over Time',
        type: 'line',
        data: [
          { date: '2024-06-01', value: 1000 },
          { date: '2024-07-01', value: 1100 },
          { date: '2024-08-01', value: 1200 }
        ]
      }
    ]
  };
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};

export { handler };
