const TOTAL_REQUESTS = 20;

const sendRequest = async () => {
  const response = await fetch("http://localhost:5000/api/test");

  return {
    status: response.status,
    body: await response.json(),
  };
};

const runTest = async () => {
  const requests = Array.from({ length: TOTAL_REQUESTS }, () => sendRequest());

  const results = await Promise.all(requests);

  const successful = results.filter((result) => result.status === 200);

  const rateLimited = results.filter((result) => result.status === 429);

  console.log("Total requests: ", results.length);
  console.log("Successful: ", successful.length);
  console.log("Rate limited: ", rateLimited.length);

  console.log("\nResults:");

  results.forEach((result, index) => {
    console.log(`Request ${index + 1}: ${result.status}`);
  });
};

runTest();
