import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../../context/SocketContext';
import { Activity, Thermometer, Droplets, Wind, MapPin } from 'lucide-react';
import './IoTMonitor.css';

export default function IoTMonitor() {
    const { t } = useTranslation('dashboard');
    const socket = useSocket();
    const [devices, setDevices] = useState({});

    useEffect(() => {
        if (!socket) return;

        const handleIoTUpdate = (data) => {
            setDevices(prev => ({
                ...prev,
                [data.deviceID]: data
            }));
        };

        socket.on('iot_update', handleIoTUpdate);

        return () => {
            socket.off('iot_update', handleIoTUpdate);
        };
    }, [socket]);

    const deviceList = Object.values(devices);

    function getStatusClass(status) {
        if (status === 'SPOILED') return 'iot-status-spoiled';
        if (status === 'WARNING') return 'iot-status-warning';
        return 'iot-status-fresh';
    }

    function getScoreColor(score) {
        if (score < 35) return 'var(--fruit-salad)'; // Green
        if (score < 65) return 'var(--sun)'; // Orange
        return 'var(--monza)'; // Red
    }

    return (
        <div className="iot-monitor">
            <div className="iot-monitor-header">
                <h3>Live Sensor Feeds</h3>
                <p>Monitor real-time food spoilage sensors deployed at storage locations or during transit.</p>
            </div>

            {deviceList.length === 0 ? (
                <div className="iot-monitor-empty">
                    <Activity className="iot-pulse-icon" size={64} />
                    <h4>Waiting for Sensor Data...</h4>
                    <p>Ensure your ESP32 IoT devices are powered on and connected to the network.</p>
                </div>
            ) : (
                <div className="iot-devices-grid">
                    {deviceList.map(device => (
                        <div key={device.deviceID} className={`iot-device-card ${getStatusClass(device.foodStatus)}`}>
                            <div className="iot-card-header">
                                <h4 className="iot-device-name">{device.deviceID}</h4>
                                <span className="iot-status-badge">
                                    {device.foodStatus || 'UNKNOWN'}
                                </span>
                            </div>
                            
                            <div className="iot-card-body">
                                <div className="iot-metric">
                                    <div className="iot-metric-icon bg-temp"><Thermometer size={20} /></div>
                                    <div className="iot-metric-info">
                                        <span className="iot-metric-label">Temperature</span>
                                        <span className="iot-metric-value">{device.temperature != null ? `${device.temperature.toFixed(1)}°C` : 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div className="iot-metric">
                                    <div className="iot-metric-icon bg-hum"><Droplets size={20} /></div>
                                    <div className="iot-metric-info">
                                        <span className="iot-metric-label">Humidity</span>
                                        <span className="iot-metric-value">{device.humidity != null ? `${device.humidity.toFixed(1)}%` : 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div className="iot-metric">
                                    <div className="iot-metric-icon bg-gas"><Wind size={20} /></div>
                                    <div className="iot-metric-info">
                                        <span className="iot-metric-label">Gas Level (MQ135)</span>
                                        <span className="iot-metric-value">{device.mq135Raw != null ? `${device.mq135Raw}` : 'N/A'} <small>({device.gasLabel})</small></span>
                                    </div>
                                </div>

                                <div className="iot-metric spoilage-section">
                                    <div className="iot-metric-info w-full">
                                        <div className="flex-between">
                                            <span className="iot-metric-label">Spoilage Score</span>
                                            <span className="iot-metric-value score" style={{ color: getScoreColor(device.spoilageScore) }}>
                                                {device.spoilageScore}/100
                                            </span>
                                        </div>
                                        <div className="iot-progress-track">
                                            <div 
                                                className="iot-progress-fill" 
                                                style={{ 
                                                    width: `${Math.min(device.spoilageScore || 0, 100)}%`,
                                                    backgroundColor: getScoreColor(device.spoilageScore)
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {device.latitude && device.longitude ? (
                                    <div className="iot-metric-location">
                                        <MapPin size={14} />
                                        <span>GPS: {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}</span>
                                    </div>
                                ) : null}
                            </div>
                            
                            <div className="iot-card-footer">
                                <span>Updated: {new Date(device.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
