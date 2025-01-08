import * as duckdb from '@duckdb/duckdb-wasm';

async function registerFileBuffer(url: string, fileName: string) {
  // From API
  const db = (window as any).db as duckdb.AsyncDuckDB;

  const fetchStartTime = performance.now(); // Start timing
  const streamResponse = await fetch(url);
  const fetchEndTime = performance.now(); // End timing
  console.log(`fetch time : ${(fetchEndTime - fetchStartTime).toFixed(3)} ms`);


  const startTime = performance.now(); // Start timing
  await db.registerFileBuffer(fileName, new Uint8Array(await streamResponse.arrayBuffer()))
  const endTime = performance.now(); // End timing
  console.log(`register File Buffer: ${(endTime - startTime).toFixed(3)} ms`);

}

async function insertJSONFromPath(fileName: string, tableName: string) {
  const db = (window as any).db as duckdb.AsyncDuckDB;
  const connection = await db.connect();
  await connection.insertJSONFromPath(fileName, { name: tableName });
  await connection.close();
}

async function insertArrowFromIPCStream(url: string, tableName: string) {

  const db = (window as any).db as duckdb.AsyncDuckDB;
  const conn = await db.connect();

  // EOS signal according to Arrow IPC streaming format
  // See https://arrow.apache.org/docs/format/Columnar.html#ipc-streaming-format
  const EOS = new Uint8Array([255, 255, 255, 255, 0, 0, 0, 0]);


  const fetchStartTime = performance.now(); // Start timing
  const streamResponse = await fetch(url);
  const fetchEndTime = performance.now(); // End timing
  console.log(`fetch time : ${(fetchEndTime - fetchStartTime).toFixed(3)} ms`);

  const startTime = performance.now(); // Start timing

  let streamReader = streamResponse.body.getReader();
  let streamInserts = [];

  while (true) {
    const { value, done } = await streamReader.read();
    if (done) break;
    streamInserts.push(conn.insertArrowFromIPCStream(value, { name: tableName }));
  }

  // Write EOS
  streamInserts.push(conn.insertArrowTable(EOS, { name: tableName }));

  await Promise.all(streamInserts);

  const endTime = performance.now(); // End timing
  const elapsedTime = endTime - startTime; // Calculate elapsed time in milliseconds
  console.log(`insert ArrowFromIPCStream into ${tableName} : ${elapsedTime.toFixed(3)} ms`);

  await conn.close();
}

// Attach the function to the global window object
(window as any).registerFileBuffer = registerFileBuffer;
(window as any).insertJSONFromPath = insertJSONFromPath;
(window as any).insertArrowFromIPCStream = insertArrowFromIPCStream;


export { registerFileBuffer, insertJSONFromPath, insertArrowFromIPCStream };