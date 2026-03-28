const fs = require('fs');
const path = require('path');

// Local storage for telemetry data when Supabase is not available
const dataFile = path.join(__dirname, 'telemetry-data.json');

let telemetryData = [];

// Load existing data
if (fs.existsSync(dataFile)) {
  try {
    telemetryData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch (err) {
    console.log('Creating new telemetry data file');
    telemetryData = [];
  }
}

function saveTelemetry(data) {
  telemetryData.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  // Keep only last 1000 records
  if (telemetryData.length > 1000) {
    telemetryData = telemetryData.slice(-1000);
  }
  
  // Save to file
  fs.writeFileSync(dataFile, JSON.stringify(telemetryData, null, 2));
  console.log(`💾 Saved telemetry to local storage (${telemetryData.length} records)`);
}

function getLatestTelemetry() {
  return telemetryData.slice(-10); // Return last 10 records
}

module.exports = { saveTelemetry, getLatestTelemetry };
