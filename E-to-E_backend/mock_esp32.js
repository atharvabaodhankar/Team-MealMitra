const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/iot/data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
};

let score = 20;

function sendMockData() {
  score += Math.floor(Math.random() * 5); // gradual spoilage

  let status = 'FRESH';
  if (score > 65) status = 'SPOILED';
  else if (score > 35) status = 'WARNING';

  const payload = JSON.stringify({
    deviceID: 'ESP32_Food_Sensor_MOCK',
    temperature: 20 + Math.random() * 10, // 20-30 C
    humidity: 50 + Math.random() * 30, // 50-80 %
    mq135Raw: 1000 + (score * 20), // simulating gas rise
    gasLabel: status === 'FRESH' ? 'Clean' : status === 'WARNING' ? 'Elevated' : 'High Gas',
    spoilageScore: Math.min(score, 100),
    foodStatus: status,
    latitude: 12.9716, // Bangalore coordinates
    longitude: 77.5946
  });

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('Sent Mock Data. Response:', data));
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

console.log('Starting Mock ESP32 Device...');
setInterval(sendMockData, 3000); // Send data every 3 seconds
sendMockData();
