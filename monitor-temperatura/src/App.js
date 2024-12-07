import React, { useState, useEffect, useCallback } from 'react';
import { generateAndSendTemperatures } from './generateTemperatures'; // Importa o script de geração de dados
import './App.css';

const API_BASE = 'http://10.10.10.104:8000';

// Sensores fictícios por padrão

const defaultSensors = Array.from({ length: 9 }, (_, id) => ({
  uuid: `Sem Sensor-${id + 1}`,
  description: `station-${id + 1}`,
  lastTemperature: 60,
  lastDate: new Date().toISOString(),
  alert: false, // Indica se a temperatura está fora do limite
  alertInc: false, // Indica se a temperatura está fora do limite de incêndio
}));

function App() {
  const [sensors, setSensors] = useState(defaultSensors); // Seta os sensores por padrão
  const [minTemp, setMinTemp] = useState(15); // Temperatura mínima
  const [maxTemp, setMaxTemp] = useState(25); // Temperatura máxima

  // Função para buscar sensores reais
  const fetchSensors = async () => {
    try {
      const response = await fetch(`${API_BASE}/discovery/resources?capability=sensor-temperature`);
      // if (!response.ok) throw new Error('Erro ao buscar sensores');
      const data = await response.json();

      if (data.resources?.length > 0) {
        const realSensors = data.resources.map(sensor => ({
          uuid: sensor.uuid,
          description: sensor.description,
          lastTemperature: '-',
          lastDate: '-',
          alert: false,
          alertInc: false,
        }));
        setSensors(realSensors);
      }
    } catch (error) {
      console.error('Erro ao buscar sensores reais:', error);
    }
  };

  // Função para buscar temperaturas
  const fetchTemperatures = async sensorsList => {
    try {
      const updatedSensors = await Promise.all(
        sensorsList.map(async sensor => {
          if (sensor.uuid.startsWith('Sem Sensor')) return sensor; // Ignora sensores fictícios

          const response = await fetch(`${API_BASE}/collector/resources/${sensor.uuid}/data`);
          // if (!response.ok) throw new Error(`Erro ao buscar dados do sensor ${sensor.uuid}`);
          const data = await response.json();

          const lastRecord =
            data.resources?.[0]?.capabilities?.['sensor-temperature']?.slice(-1)[0] || null;

          const lastTemperature = lastRecord?.value;
          const lastDate = lastRecord?.date;
            
          return {
            ...sensor,
            lastTemperature,
            lastDate,
          };
        })
      );
      return updatedSensors;
    } catch (error) {
      console.error('Erro ao buscar temperaturas:', error);
      return sensorsList;
    }
  };

  // Função para verificar alertas
  const verificaTemperaturas = useCallback(updatedSensors => {
    return updatedSensors.map(sensor => {
      let alert = false;
      let alertInc = false;

      // Verifica se a temperatura está fora do limite
      if (sensor.lastTemperature !== '-' && (sensor.lastTemperature < minTemp || sensor.lastTemperature > maxTemp)) {
        alert = true;
      }

      // Verifica se a temperatura está fora do limite de incêndio
      if (sensor.lastTemperature !== '-' && (sensor.lastTemperature > maxTemp * 3)) {
        alertInc = true;
      }

      return {
        ...sensor,
        alert,
        alertInc,
      };
    });
  }, [minTemp, maxTemp]);

  // Função principal que chama as outras
  const updateSensors = useCallback(async () => {
    await fetchSensors(); // Atualiza os sensores reais, se disponíveis
    const updatedSensors = await fetchTemperatures(sensors); // Atualiza as temperaturas
    const verificaSensors = verificaTemperaturas(updatedSensors); // Checa alertas
    setSensors(verificaSensors); // Atualiza o estado com os dados atualizados

    // Gera novos valores de temperatura e envia para os sensores reais
    await generateAndSendTemperatures(verificaSensors.filter(sensor => !sensor.uuid.startsWith('Mock')));
  }, [sensors, verificaTemperaturas]);

  // Ciclo principal
  useEffect(() => {
    updateSensors(); // Executa a primeira atualização
    const interval = setInterval(updateSensors, 15000); // Roda a cada 15 segundos
    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [updateSensors]);

  return (
    <div>
      <h1 className="title">Monitoramento de Sensores de Temperatura</h1>
      <div className="temperature-settings-container">
        <div className="temperature-settings">
          <label>
            Temperatura Mínima:
            <input
              type="number"
              value={minTemp}
              onChange={e => setMinTemp(Number(e.target.value))}
            />
          </label>
          <label>
            Temperatura Máxima:
            <input
              type="number"
              value={maxTemp}
              onChange={e => setMaxTemp(Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      <div className="card-container">
        {sensors.map(sensor => (
          <div key={sensor.uuid} className={`card ${sensor.alert ? 'alert' : ''}`}>
            <h3>{sensor.description}</h3>
            <p><strong>UUID:</strong> {sensor.uuid}</p>
            <p>
              <strong>Última Temperatura:</strong>{' '}
              {sensor.lastTemperature !== '-' ? `${sensor.lastTemperature}°C` : '-'}
            </p>
            <p>
              <strong>Última Atualização:</strong>{' '}
              {sensor.lastDate !== '-' ? new Date(sensor.lastDate).toLocaleString() : '-'}
            </p>
            {sensor.alert && !sensor.alertInc && <p className="warningAlert">⚠️ Temperatura fora do limite permitido!</p>}
            {sensor.alertInc && <p className="warningIncendio">⚠️ Possível principio de incêndio!</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
