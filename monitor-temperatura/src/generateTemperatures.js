const API_BASE = 'http://10.10.10.104:8000';
const TEMP_MIN = -10;
const TEMP_MAX = 70;

// Gera uma temperatura aleatória
const getRandomTemperature = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Função para gerar e enviar temperaturas
export const generateAndSendTemperatures = async sensors => {
  try {
    for (const sensor of sensors) {
      const newTemperature = getRandomTemperature(TEMP_MIN, TEMP_MAX);

      // Envia a nova temperatura para o servidor
      const response = await fetch(`${API_BASE}/adaptor/resources/${sensor.uuid}/data`, {
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
          }}),
        });

      if (!response.ok) {
        console.error(`Erro ao enviar temperatura para o sensor ${sensor.uuid}`);
      } else {
        console.log(`Temperatura ${newTemperature}°C enviada para o sensor ${sensor.uuid}`);
      }
    }
  } catch (error) {
    console.error('Erro ao gerar e enviar temperaturas:', error);
  }
};
