// Esse script faz a criação de 9 estações
// É criado uma capacidade de sensor de temperatura
// Essa capacidade é atribuida a cada estação de metro (seasons)

const seasons = [
  {
      description: "station-1", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-23.51589487776733", // Latitude do recurso
      lon: "-47.465608073541446", // Longitude do recurso
  },
  {
      description: "station-2", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-29.51589487776733", // Latitude do recurso
      lon: "-49.465608083541446", // Longitude do recurso
  },
  {
      description: "station-3", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-27.51589487776733", // Latitude do recurso
      lon: "-45.465608073541446", // Longitude do recurso
  },
  {
      description: "station-4", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-28.51589487776733", // Latitude do recurso
      lon: "-42.465608073541446", // Longitude do recurso
  },
  {
      description: "station-5", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-23.51589487786733", // Latitude do recurso
      lon: "-45.465608073541446", // Longitude do recurso
  },
  {
      description: "station-6", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-22.51589487776733", // Latitude do recurso
      lon: "-47.465608073541446", // Longitude do recurso
  },
  {
      description: "station-7", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-23.51589487776733", // Latitude do recurso
      lon: "-47.400608073541446", // Longitude do recurso
  },
  {
      description: "station-8", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-23.51589487776733", // Latitude do recurso
      lon: "-47.465608073581446", // Longitude do recurso
  },
  {
      description: "station-9", // Descrição do recurso
      capabilities: ["sensor-temperature"], // Capacidades do recurso
      status: "active", // Status do recurso
      lat: "-23.51589487776733", // Latitude do recurso
      lon: "-47.465638073541446", // Longitude do recurso
  },
];

// A função main faz uma requisição fetch para criar a capacidade
// Com a capacidade criada, ela é atribuida a cada recurso
// É feita uma subscrição desses recursos
async function main() {
  const capacidade = await fetch("http://10.10.10.104:8000/catalog/capabilities", { // Requisição para criar a capacidade
      method: "POST", // Método POST
      headers: { // Headers da requisição
          "Content-Type": "application/json", // Tipo do conteúdo da requisição
      },
      body: JSON.stringify({
          name: "sensor-temperature", // Nome da capacidade sendo criada
          description: `Capability to sensor of temperature`, // Define a descrição da capacidade
          capability_type: "sensor", // Tipo da capacidade (sensor)
      }),
  });

  console.log(capacidade.status); // Status da requisição de criação da capacidade
  if (capacidade.status !== 201) {
      console.log("Erro ao criar a capacidade");
      return;
  }

  for (const recurso of seasons) { // Para cada recurso de estação
      const sendData = recurso; // Dados do recurso
      const result = await fetch("http://10.10.10.104:8000/adaptor/resources", { // Requisição para criar o recurso
          method: "POST", // Método POST
          headers: { // Headers da requisição
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: sendData }), // Corpo da requisição com os dados do recurso
      });
      console.log(result.status); // Status da requisição de criação do recurso

      const data = (await result.json()).data; // Dados do recurso criado (uuid, capabilities)
      if (result.status === 500) {
          return;
      }

      const subscription = await fetch( // Requisição para criar a subscrição do recurso
          "http://10.10.10.104:8000/adaptor/subscriptions", // URL da requisição
          {
              method: "POST", // Método POST
              headers: { // Headers da requisição
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({ // Corpo da requisição
                  subscription: { // Dados da subscrição
                      uuid: data.uuid, // UUID do recurso
                      capabilities: data.capabilities, // Capacidades do recurso
                      url: `http://10.10.10.1:8000/webhook/${data.uuid}`, // URL do webhook do recurso (URL do adaptador)
                  },
              }),
          }
      );
      console.log(subscription.status); // Status da requisição de criação da subscrição
      if (subscription.status === 500) {
          return;
      }
  }
}

main(); // Início
