import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import mqtt from 'mqtt';

// ✅ Use WebSocket for MQTT (React Native does not support `mqtt://`)
const MQTT_BROKER = 'wss://broker.hivemq.com:8000/mqtt';
const MQTT_TOPIC_SOIL = 'smart_irrigation/soil_data';

export default function MonitorScreen() {
  const [soilMoisture, setSoilMoisture] = useState(0);
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [rainfall, setRainfall] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect(MQTT_BROKER, {
      clientId: `rn-client-${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
    });

    client.on('connect', () => {
      setConnected(true);
      client.subscribe(MQTT_TOPIC_SOIL);
    });

    client.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC_SOIL) {
        try {
          const data = JSON.parse(message.toString());
          setSoilMoisture(data.soil_moisture);
          setTemperature(data.temperature);
          setHumidity(data.humidity);
          setRainfall(data.rainfall);
        } catch (error) {
          console.error('Error parsing MQTT data:', error);
        }
      }
    });

    return () => {
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
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </Text>
    </View>
  );
}

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
