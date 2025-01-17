import React, { useState, useEffect, useCallback } from 'react';
// import { generateAndSendTemperatures } from './generateTemperatures'; // Importa o script de geração de dados
import './App.css';

const IP_ADDRESS = 'http://10.10.10.104:8000';

// Sensores fictícios por padrão
// São Criados 9 sensores por default
const defaultSensors = Array.from({ length: 9 }, (_, id) => ({
  uuid: `Sem Sensor-${id + 1}`,
  description: `station-${id + 1}`,
  lastTemperature: 60,
  lastDate: new Date().toISOString(),
  alertInc: false, // Indica se a temperatura está fora do limite de incêndio
  alertAscParcLimit: false, // Indica se a temperatura está parcialmente acima do limite
  alertAscLimit: false, // Indica se a temperatura está acima do limite
  alertAscAltLimit: false, // Indica se a temperatura está muito acima do limite
  alertDecParcLimit: false, // Indica se a temperatura está parcialmente abaixo do limite
  alertDecLimit: false, // Indica se a temperatura está abaixo do limite
  alertDecAltLimit: false, // Indica se a temperatura está muito abaixo do limite
}));

function App() {
  const [sensors, setSensors] = useState(defaultSensors); // Seta os sensores por padrão
  const [minTemp, setMinTemp] = useState(15); // Temperatura mínima, o estádo inicial é colocado como 15
  const [maxTemp, setMaxTemp] = useState(25); // Temperatura máxima, o estádo inicial é colocado como 25

  // // Função para buscar sensores reais
  // const buscaSensores = async () => {
  //   try {
  //     const response = await fetch(`${IP_ADDRESS}/discovery/resources?capability=sensor-temperature`);
  //     // if (!response.ok) throw new Error('Erro ao buscar sensores');
  //     const data = await response.json();

  //     if (data.resources?.length > 0) {
  //       const realSensors = data.resources.map(sensor => ({
  //         uuid: sensor.uuid,
  //         description: sensor.description,
  //         lastTemperature: '-',
  //         lastDate: '-',
  //         alert: false,
  //         alertInc: false,
  //       }));
  //       setSensors(realSensors);
  //     }
  //   } catch (error) {
  //     console.error('Erro ao buscar sensores reais:', error);
  //   }
  // };

  // Função para buscar temperaturas
  const buscaTemperaturas = async sensorsList => {
    try {
      const updatedSensors = await Promise.all(
        sensorsList.map(async sensor => {
          if (sensor.uuid.startsWith('Sem Sensor')) return sensor; // Ignora sensores fictícios

          const response = await fetch(`${IP_ADDRESS}/collector/resources/${sensor.uuid}/data`); //Faz requisição para obter historico de dados de cada sensor
          // if (!response.ok) throw new Error(`Erro ao buscar dados do sensor ${sensor.uuid}`);
          const data = await response.json();

          const lastRecord =
            data.resources?.[0]?.capabilities?.['sensor-temperature']?.slice(-1)[0] || null;

          const lastTemperature = lastRecord?.value; //Ultima temperatura
          const lastDate = lastRecord?.date; //Data de medição do dado
            
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

      let alertInc = false;
      let alertAscParcLimit = false;
      let alertAscLimit = false;
      let alertAscAltLimit = false;
      let alertDecParcLimit = false;
      let alertDecLimit = false;
      let alertDecAltLimit = false;

      if (sensor.lastTemperature > maxTemp) {
        let variaTemperaturaMax = Math.abs(sensor.lastTemperature - maxTemp)
        console.log(variaTemperaturaMax)
        //Temperatura parcialmente acima do limite
        if (sensor.lastTemperature !== '-' && (variaTemperaturaMax <= 5)) {
          alertAscParcLimit = true;
        }

        //Temperatura acima do limite
        else if (sensor.lastTemperature !== '-' && (variaTemperaturaMax <= 10 && variaTemperaturaMax > 5)) {
          alertAscLimit = true;
        }

        //Temperatura muito acima do limite
        else if (sensor.lastTemperature !== '-' && (variaTemperaturaMax > 10)) {
          alertAscAltLimit = true;
        }
      }
      else if (sensor.lastTemperature < minTemp) {
        let variaTemperaturaMin = Math.abs(sensor.lastTemperature - minTemp)
        //Temperatura parcialmente abaixo do limite
        if (sensor.lastTemperature !== '-' && (variaTemperaturaMin <= 5)) {
          alertDecParcLimit = true;
        }

        //Temperatura abaixo do limite
        else if (sensor.lastTemperature !== '-' && (variaTemperaturaMin <= 10 && variaTemperaturaMin > 5)) {
          alertDecLimit = true;
        }

        //Temperatura muito abaixo do limite
        else if (sensor.lastTemperature !== '-' && (variaTemperaturaMin > 10)) {
          alertDecAltLimit = true;
        }
      }

      // Verifica se a temperatura está fora do limite de incêndio
      if (sensor.lastTemperature !== '-' && (sensor.lastTemperature > maxTemp * 3)) {
        alertInc = true;
      }

      return {
        ...sensor,
        alertAscParcLimit,
        alertAscLimit,
        alertAscAltLimit,
        alertDecParcLimit,
        alertDecLimit,
        alertDecAltLimit,
        alertInc,
      };
    });
  }, [minTemp, maxTemp]);

  // Função principal que chama as outras
  const updateSensors = useCallback(async () => {
    try {
      // Busca sensores reais
      const response = await fetch(`${IP_ADDRESS}/discovery/resources?capability=sensor-temperature`);
      const data = await response.json();
      
      // Atualiza sensores com os reais encontrados, se houver
      const realSensors = data.resources?.map(sensor => ({
        uuid: sensor.uuid,
        description: sensor.description,
        lastTemperature: '-',
        lastDate: '-',
        alert: false,
        alertAscAltLimit: false,
        alertAscLimit: false,
        alertAscParcLimit: false,
        alertDecAltLimit: false,
        alertDecLimit: false,
        alertDecParcLimit: false,
        alertInc: false,
      })) || defaultSensors;
  
      // Busca as temperaturas para os sensores
      const updatedSensors = await buscaTemperaturas(realSensors);
  
      // Verifica alertas nos sensores
      const verificaSensors = verificaTemperaturas(updatedSensors);
  
      // Atualiza o estado com os sensores verificados
      setSensors(verificaSensors);

    } catch (error) {
      console.error('Erro ao atualizar sensores:', error);
    }
  }, [verificaTemperaturas]);

const getCardClass = (sensor) => {
  const baseClass = "card"; // Classe base
  if (sensor.alertInc) return `${baseClass} alert-incendio`; // Alerta de incêndio
  if (sensor.alertAscAltLimit) return `${baseClass} alert-muito-acima`;
  if (sensor.alertAscLimit) return `${baseClass} alert-acima`;
  if (sensor.alertAscParcLimit) return `${baseClass} alert-parcial-acima`;
  if (sensor.alertDecAltLimit) return `${baseClass} alert-muito-abaixo`;
  if (sensor.alertDecLimit) return `${baseClass} alert-abaixo`;
  if (sensor.alertDecParcLimit) return `${baseClass} alert-parcial-abaixo`;
  return baseClass; // Sem alertas
};

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
          <div key={sensor.uuid} className={getCardClass(sensor)}>
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
            {sensor.alertAscParcLimit && !sensor.alertInc && <p className="warningAlertAscParc">⚠️ Temperatura parcialmente acima do limite permitido!</p>}
            {sensor.alertAscLimit && !sensor.alertInc && <p className="warningAlertAsc">⚠️ Temperatura acima do limite permitido!</p>}
            {sensor.alertAscAltLimit && !sensor.alertInc && <p className="warningAlertAscAlt">⚠️ Temperatura muito acima do limite permitido!</p>}
            {sensor.alertDecParcLimit && !sensor.alertInc && <p className="warningAlertDecParc">⚠️ Temperatura parcialmente abaixo do limite permitido!</p>}
            {sensor.alertDecLimit && !sensor.alertInc && <p className="warningAlertDec">⚠️ Temperatura abaixo do limite permitido!</p>}
            {sensor.alertDecAltLimit && !sensor.alertInc && <p className="warningAlertDecAlt">⚠️ Temperatura muito abaixo do limite permitido!</p>}
            {sensor.alertInc && <p className="warningIncendio">⚠️ Possível principio de incêndio!</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
