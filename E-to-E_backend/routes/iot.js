const express = require('express');
const router = express.Router();

// This endpoint receives data from the ESP32 IoT Device
router.post('/data', async (req, res) => {
  try {
    const {
      deviceID,
      temperature,
      humidity,
      mq135Raw,
      gasLabel,
      spoilageScore,
      foodStatus,
      latitude,
      longitude
    } = req.body;

    // Validate minimum required fields
    if (temperature === undefined || humidity === undefined || spoilageScore === undefined) {
      return res.status(400).json({ error: 'Missing required sensor data fields' });
    }

    const payload = {
      deviceID: deviceID || 'ESP32_Device_1',
      temperature,
      humidity,
      mq135Raw,
      gasLabel,
      spoilageScore,
      foodStatus: foodStatus || 'UNKNOWN',
      latitude: latitude || 0,
      longitude: longitude || 0,
      timestamp: new Date().toISOString()
    };

    console.log('[IoT API] Received new sensor payload:', payload);

    // Broadcast the new data via WebSockets to connected clients (e.g. NGO Dashboard)
    const io = req.app.get('io');
    if (io) {
      io.emit('iot_update', payload);
    }

    // TODO: Optionally persist this payload to Supabase 'iot_logs' table if created.

    res.status(200).json({
      success: true,
      message: 'IoT data received and broadcasted successfully',
      data: payload
    });

  } catch (error) {
    console.error('[IoT API] Error receiving IoT data:', error);
    res.status(500).json({
      error: 'Failed to process IoT data',
      message: error.message
    });
  }
});

module.exports = router;
