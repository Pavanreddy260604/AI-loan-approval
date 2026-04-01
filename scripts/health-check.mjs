

const services = [
  { name: 'Gateway', url: 'http://localhost:4000/health' },
  { name: 'Auth', url: 'http://localhost:4001/health' },
  { name: 'Billing', url: 'http://localhost:4002/health' },
  { name: 'Data', url: 'http://localhost:4003/health' },
  { name: 'Notification', url: 'http://localhost:4005/health' },
  { name: 'Analytics', url: 'http://localhost:4006/health' },
  { name: 'Training', url: 'http://localhost:5007/health' },
  { name: 'Prediction', url: 'http://localhost:5008/health' },
  { name: 'XAI', url: 'http://localhost:5006/health' },
  { name: 'Fraud', url: 'http://localhost:5004/health' },
];

async function checkHealth() {
  console.log('🚀 Starting System Health Check...\n');
  const results = await Promise.all(services.map(async (s) => {
    try {
      const res = await fetch(s.url, { timeout: 2000 });
      if (res.ok) {
        return { name: s.name, status: '✅ UP', details: await res.json() };
      }
      return { name: s.name, status: '❌ DOWN', details: `Status: ${res.status}` };
    } catch (err) {
      return { name: s.name, status: '❌ DOWN', details: err.message };
    }
  }));

  console.table(results);
  
  const allUp = results.every(r => r.status === '✅ UP');
  if (allUp) {
    console.log('\n✨ ALL SERVICES ARE GREEN! ✨');
  } else {
    console.log('\n⚠️ SOME SERVICES ARE FAILING ⚠️');
  }
}

checkHealth();
