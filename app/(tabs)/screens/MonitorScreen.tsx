import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import mqtt from 'mqtt';

// ✅ Use WebSocket for MQTT (React Native does not support `mqtt://`)
const MQTT_BROKER = 'wss://broker.hivemq.com:8000/mqtt';
const MQTT_TOPIC_SOIL = 'smart_irrigation/soil_data';

// Define Sensor Data
interface SensorData {
  soil_moisture: number;
  temperature: number;
  humidity: number;
  rainfall: number;
}

const MonitorScreen = () => {
  const [soilMoisture, setSoilMoisture] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0);
  const [humidity, setHumidity] = useState<number>(0);
  const [rainfall, setRainfall] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    // ✅ WebSocket Connection for MQTT
    const client = mqtt.connect(MQTT_BROKER, {
      clientId: `rn-client-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000, // Reconnect every second
      connectTimeout: 30 * 1000,
    });

    client.on('connect', () => {
      console.log('✅ Connected to MQTT Broker');
      setConnected(true);
      client.subscribe(MQTT_TOPIC_SOIL, { qos: 0 }, (err) => {
        if (!err) {
          console.log('✅ Subscribed to soil data topic');
        } else {
          console.error('❌ Subscription error:', err);
        }
      });
    });

    client.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC_SOIL) {
        try {
          const data: SensorData = JSON.parse(message.toString());
          setSoilMoisture(data.soil_moisture);
          setTemperature(data.temperature);
          setHumidity(data.humidity);
          setRainfall(data.rainfall);
        } catch (error) {
          console.error('❌ Error parsing MQTT message:', error);
        }
      }
    });

    client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
      setConnected(false);
    });

    // ✅ Cleanup: Disconnect MQTT on unmount
    return () => {
      console.log('🔌 Disconnecting MQTT...');
      client.end();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ESP32 Sensor Data</Text>
      <Text style={styles.data}>Soil Moisture: {soilMoisture}</Text>
      <Text style={styles.data}>Temperature: {temperature}°C</Text>
      <Text style={styles.data}>Humidity: {humidity}%</Text>
      <Text style={styles.data}>Rainfall: {rainfall}mm</Text>
      <Text style={styles.connectionStatus}>
        {connected ? '🟢 Connected to MQTT Broker' : '🔴 Disconnected'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  data: {
    fontSize: 18,
    marginVertical: 5,
  },
  connectionStatus: {
    fontSize: 16,
    marginTop: 20,
    color: 'gray',
  },
});

export default MonitorScreen;
