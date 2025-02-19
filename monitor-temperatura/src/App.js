import React, { useState, useEffect, useCallback } from 'react';
// import { generateAndSendTemperatures } from './generateTemperatures'; // Importa o script de geração de dados
import './App.css';

const IP_ADDRESS = 'http://10.10.10.104:8000';

// Dummy stations by default
// 9 stations are created by default
const defaultStations = Array.from({ length: 9 }, (_, id) => ({
  uuid: `Sem estação-${id + 1}`,
  description: `station-${id + 1}`,
  lastTemperature: 60,
  lastDate: new Date().toISOString(),
  alertInc: false, // Indicates if the temperature is outside the fire limit
  alertAscParcLimit: false, // Indica se a temperatura está parcialmente acima do limite
  alertAscLimit: false, // Indica se a temperatura está acima do limite
  alertAscAltLimit: false, // Indica se a temperatura está muito acima do limite
  alertDecParcLimit: false, // Indica se a temperatura está parcialmente abaixo do limite
  alertDecLimit: false, // Indica se a temperatura está abaixo do limite
  alertDecAltLimit: false, // Indica se a temperatura está muito abaixo do limite
}));

function App() {
  const [sensors, setStations] = useState(defaultStations); // Seta as estações por padrão
  const [minTemp, setMinTemp] = useState(15); // Temperatura mínima, o estádo inicial é colocado como 15 °C
  const [maxTemp, setMaxTemp] = useState(25); // Temperatura máxima, o estádo inicial é colocado como 25 °C

  // // Função para buscar recursos reais
  // const buscaSensores = async () => {
  //   try {
  //     const response = await fetch(`${IP_ADDRESS}/discovery/resources?capability=sensor-temperature`);
  //     // if (!response.ok) throw new Error('Erro ao buscar sensores');
  //     const data = await response.json();

  //     if (data.resources?.length > 0) {
  //       const realSensors = data.resources.map(resource => ({
  //         uuid: resource.uuid,
  //         description: resource.description,
  //         lastTemperature: '-',
  //         lastDate: '-',
  //         alert: false,
  //         alertInc: false,
  //       }));
  //       setStations(realSensors);
  //     }
  //   } catch (error) {
  //     console.error('Erro ao buscar sensores reais:', error);
  //   }
  // };

  // Function to search for temperatures
  const searchTemperatures = async (resourceList) => {
    try {
      const updatedResources = await Promise.all(
        resourceList.map(async (resource) => {
          if (resource.uuid.startsWith('Sem Estação')) return resource; // Ignore dummy resources
  
          const response = await fetch(`${IP_ADDRESS}/collector/resources/${resource.uuid}/data`);
          const data = await response.json();
  
          const temperatureRecords = data.resources?.[0]?.capabilities?.['sensor-temperature'] || [];
          let lastTemperature = null;
          let lastDate = null;
  
          if (temperatureRecords.length > 999) {
            let validTemperature = null;
            while (validTemperature === null && temperatureRecords.length > 0) {
              const randomIndex = Math.floor(Math.random() * temperatureRecords.length);
              validTemperature = temperatureRecords[randomIndex]?.value || null;
            }
            lastTemperature = validTemperature;
            lastDate = new Date().toISOString(); // Usa a data atual
          } else {
            const lastRecord = temperatureRecords.slice(-1)[0] || null;
            lastTemperature = lastRecord?.value || null;
            lastDate = lastRecord?.date || null;
          }
  
          return {
            ...resource,
            lastTemperature,
            lastDate,
          };
        })
      );
  
      return updatedResources;
    } catch (error) {
      console.error('Erro ao buscar temperaturas:', error);
      return resourceList;
    }
  };
  

  // Function to check alerts
  const checkTemperatures = useCallback(updatedResources => {
    return updatedResources.map(resource => {

      let alertInc = false;
      let alertAscParcLimit = false;
      let alertAscLimit = false;
      let alertAscAltLimit = false;
      let alertDecParcLimit = false;
      let alertDecLimit = false;
      let alertDecAltLimit = false;

      if (resource.lastTemperature !== '-' && resource.lastTemperature > maxTemp) {
        let variaTemperaturaMax = Math.abs(resource.lastTemperature - maxTemp)
        console.log(variaTemperaturaMax)
        //Temperatura parcialmente acima do limite
        if (variaTemperaturaMax <= 5) {
          alertAscParcLimit = true;
        }

        //Temperatura acima do limite
        else if (variaTemperaturaMax > 5 && variaTemperaturaMax <= 10) {
          alertAscLimit = true;
        }

        //Temperatura muito acima do limite
        else if (variaTemperaturaMax > 10 && variaTemperaturaMax <= 15) {
          alertAscAltLimit = true;
        }
        else { //15 °C acima, principio de incêndio 
          alertInc = true;
        }
      }
      else if (resource.lastTemperature !== '-' && resource.lastTemperature < minTemp) {
        let variaTemperaturaMin = Math.abs(resource.lastTemperature - minTemp)
        //Temperatura parcialmente abaixo do limite
        if (variaTemperaturaMin <= 5) {
          alertDecParcLimit = true;
        }

        //Temperatura abaixo do limite
        else if (variaTemperaturaMin > 5 && variaTemperaturaMin <= 10) {
          alertDecLimit = true;
        }

        //Temperatura muito abaixo do limite
        else {
          alertDecAltLimit = true;
        }
      }

      return {
        ...resource,
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
  const updateStations = useCallback(async () => {
    try {
      // Busca sensores reais
      const response = await fetch(`${IP_ADDRESS}/discovery/resources?capability=sensor-temperature`);
      const data = await response.json();
      
      // Atualiza sensores com os reais encontrados, se houver
      const realSensors = data.resources?.map(resource => ({
        uuid: resource.uuid,
        description: resource.description,
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
      })) || defaultStations;
  
      // Busca as temperaturas para os sensores
      const updatedResources = await searchTemperatures(realSensors);
  
      // Verifica alertas
      const checkAlerts = checkTemperatures(updatedResources);
  
      // Atualiza o estado com as estações verificados
      setStations(checkAlerts);

    } catch (error) {
      console.error('Erro ao atualizar sensores:', error);
    }
  }, [checkTemperatures]);

const getCardClass = (resource) => {
  const baseClass = "card"; // Classe base
  if (resource.alertInc) return `${baseClass} alert-incendio`; // Alerta de incêndio
  if (resource.alertAscAltLimit) return `${baseClass} alert-muito-acima`;
  if (resource.alertAscLimit) return `${baseClass} alert-acima`;
  if (resource.alertAscParcLimit) return `${baseClass} alert-parcial-acima`;
  if (resource.alertDecAltLimit) return `${baseClass} alert-muito-abaixo`;
  if (resource.alertDecLimit) return `${baseClass} alert-abaixo`;
  if (resource.alertDecParcLimit) return `${baseClass} alert-parcial-abaixo`;
  return baseClass; // Sem alertas
};

  // Ciclo principal
  useEffect(() => {
    updateStations(); // Executa a primeira atualização
    const interval = setInterval(updateStations, 15000); // Roda a cada 15 segundos
    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [updateStations]);

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
        {sensors.map(resource => (
          <div key={resource.uuid} className={getCardClass(resource)}>
            <h3>{resource.description}</h3>
            <p><strong>UUID:</strong> {resource.uuid}</p>
            <p>
              <strong>Última Temperatura:</strong>{' '}
              {resource.lastTemperature !== '-' ? `${resource.lastTemperature}°C` : '-'}
            </p>
            <p>
              <strong>Última Atualização:</strong>{' '}
              {resource.lastDate !== '-' ? new Date(resource.lastDate).toLocaleString() : '-'}
            </p>
            {resource.alertAscParcLimit && !resource.alertInc && <p><strong>⚠️ Temperatura parcialmente acima do limite permitido!</strong></p>}
            {resource.alertAscLimit && !resource.alertInc && <p><strong>⚠️ Temperatura acima do limite permitido!</strong></p>}
            {resource.alertAscAltLimit && !resource.alertInc && <p><strong>⚠️ Temperatura muito acima do limite permitido!</strong></p>}
            {resource.alertDecParcLimit && !resource.alertInc && <p><strong>⚠️ Temperatura parcialmente abaixo do limite permitido!</strong></p>}
            {resource.alertDecLimit && !resource.alertInc && <p><strong>⚠️ Temperatura abaixo do limite permitido!</strong></p>}
            {resource.alertDecAltLimit && !resource.alertInc && <p><strong>⚠️ Temperatura muito abaixo do limite permitido!</strong></p>}
            {resource.alertInc && <p><strong>⚠️ Possível principio de incêndio!</strong></p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
