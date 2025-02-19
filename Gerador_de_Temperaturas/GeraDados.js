//Script para gerar dados de temperatura para a aplicação
//Esse script gera temperaturas aleatorias entre -5 a 45 graus
//A cada 15 segundos, para cada sensor de temperatura, é gerado um novo valor

import fetch from 'node-fetch';

const TEMP_MIN = -5;
const TEMP_MAX = 45;

// Função responsavel por gerar temperaturas em um intervalo de -5 a 45 graus
const geraTemperatura = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Array para armazenar os sensores
let stations = [];

// Função para buscar sensores reais
const searchResources = async () => {
  try {
    const response = await fetch(`http://10.10.10.104:8000/discovery/resources?capability=sensor-temperature`);

    const data = await response.json();

    if (data.resources?.length > 0) {
      stations = data.resources.map(station => ({
        uuid: station.uuid,
      }));
    }
  } catch (error) {
    console.error('Erro ao buscar estações reais:', error);
  }
};

// Função para gerar e enviar temperaturas
const updateTemperature = async () => {
  try {
    for (const station of stations) {
      
      const newTemperature = geraTemperatura(TEMP_MIN, TEMP_MAX); // Gera temperatura

      // Envia a nova temperatura para o servidor
      const response = await fetch(`http://10.10.10.104:8000/adaptor/resources/${station.uuid}/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            'sensor-temperature': [
              {
                timestamp: new Date().toISOString(),
                value: newTemperature,
              },
            ],
          },
        }),
      });
    }
  } catch (error) {
    console.error('Erro ao gerar e enviar temperaturas:', error);
  }
};

//Processo principal
const main = async () => {
  await searchResources(); //Busca UUID dos resources
  setInterval(updateTemperature, 15000); //Com base nos UUIDs, gera e envia temperaturas a cada 15 segundos
};

// Executa o script
main();
