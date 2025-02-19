// This script creates 9 stations
// A temperature sensor capability is created
// This capability is assigned to each subway station (stations)

const stations = [
    {
        description: "station-1-teste", // Resource description
        capabilities: ["sensor-temperature"], // Resource capabilities
        status: "active", // Resource status
        lat: "-23.51589487776733", // Resource latitude
        lon: "-47.465608073541446", // Resource longitude
    },
    {
        description: "station-2-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-29.51589487776733",
        lon: "-49.465608083541446",
    },
    {
        description: "station-3-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-27.51589487776733",
        lon: "-45.465608073541446",
    },
    {
        description: "station-4-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-28.51589487776733",
        lon: "-42.465608073541446",
    },
    {
        description: "station-5-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-23.51589487786733",
        lon: "-45.465608073541446",
    },
    {
        description: "station-6-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-22.51589487776733",
        lon: "-47.465608073541446",
    },
    {
        description: "station-7-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-23.51589487776733",
        lon: "-47.400608073541446",
    },
    {
        description: "station-8-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-23.51589487776733",
        lon: "-47.465608073581446",
    },
    {
        description: "station-9-teste",
        capabilities: ["sensor-temperature"],
        status: "active",
        lat: "-23.51589487776733",
        lon: "-47.465638073541446",
    },
  ];
  
  // The main function sends a fetch request to create the capability
  // Once the capability is created, it is assigned to each resource
  // A subscription is made for these resources
  async function main() {
    const capability = await fetch("http://10.10.10.104:8000/catalog/capabilities", { // Request to create capability
        method: "POST", // POST method
        headers: { // Request headers
            "Content-Type": "application/json", // Request content type
        },
        body: JSON.stringify({
            name: "sensor-temperature", // Name of the capability being created
            description: `Capability for temperature sensor`, // Defines capability description
            capability_type: "sensor", // Capability type (sensor)
        }),
    });
  
    console.log(capability.status); // Request status for capability creation
    if (capability.status !== 201) {
        console.log("Error creating capability");
        return;
    }
  
    for (const resource of stations) { // For each station resource
        const sendData = resource; // Resource data
        const result = await fetch("http://10.10.10.104:8000/adaptor/resources", { // Request to create resource
            method: "POST", // POST method
            headers: { // Request headers
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: sendData }), // Request body with resource data
        });
        console.log(result.status); // Request status for resource creation
  
        const data = (await result.json()).data; // Created resource data (uuid, capabilities)
        if (result.status === 500) {
            return;
        }
  
        const subscription = await fetch( // Request to create resource subscription
            "http://10.10.10.104:8000/adaptor/subscriptions", // Request URL
            {
                method: "POST", // POST method
                headers: { // Request headers
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ // Request body
                    subscription: { // Subscription data
                        uuid: data.uuid, // Resource UUID
                        capabilities: data.capabilities, // Resource capabilities
                        url: `http://10.10.10.1:8000/webhook/${data.uuid}`, // Resource webhook URL (adapter URL)
                    },
                }),
            }
        );
        console.log(subscription.status); // Request status for subscription creation
        if (subscription.status === 500) {
            return;
        }
    }
  }
  
  main(); // Start
  