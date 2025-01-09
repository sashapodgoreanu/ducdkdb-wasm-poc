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

async function dropFiles(fileName: string, tableName: string) {
  const db = (window as any).db as duckdb.AsyncDuckDB;

  const s = performance.now(); // Start timing
  await db.dropFiles();
  const e = performance.now(); // End timing
  console.log(`dropFiles time: ${(e - s).toFixed(3)} ms`);
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

  const streamReader = streamResponse.body.getReader();
  const streamInserts = [];

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


async function writeUint8ArrayToFile(fileHandle: FileSystemFileHandle, data: Uint8Array): Promise<void> {
  // Create a writable stream for the file
  const writableStream = await fileHandle.createWritable();

  // Write the Uint8Array data to the file
  await writableStream.write(data);

  // Close the writable stream
  await writableStream.close();
  console.log("Uint8Array written to OPFS file successfully.");
}

async function fileExists(opfsRoot: FileSystemDirectoryHandle, fileName: string): Promise<boolean> {
  for await (const name of opfsRoot.keys()) {
    if (name === fileName) {
      return true; // File found
    }
  }
  return false; // File not found
}

async function getOrCreateFile(opfsRoot: FileSystemDirectoryHandle, fileName: string): Promise<FileSystemFileHandle> {
  const exists = await fileExists(opfsRoot, fileName);
  if (exists) {
    return await opfsRoot.getFileHandle(fileName);
  }
  return await opfsRoot.getFileHandle(fileName, { create: true });
}

async function exportParquetFile(tableName: string, fileName: string) {

  const db = (window as any).db as duckdb.AsyncDuckDB;

  // Check if the File System Access API is supported
  if ('storage' in navigator && 'getDirectory' in navigator.storage) {
    try {
      // Get a reference to the OPFS root directory
      const opfsRoot = await navigator.storage.getDirectory();
      const parquetFileHandle = await getOrCreateFile(opfsRoot, fileName)

      await db.registerEmptyFileBuffer(fileName);
      const conn = await db.connect();
      await conn.query(`COPY ${tableName} TO '${fileName}' (FORMAT PARQUET);`);
      await conn.close();

      const parquetBuffer = await db.copyFileToBuffer(`${fileName}`);
      await writeUint8ArrayToFile(parquetFileHandle, parquetBuffer);
      await db.dropFile(`${fileName}`)

    } catch (error) {
      console.error("An error occurred:", error);
    }
  } else {
    console.error("File System Access API is not supported in this browser.");
  }
}

async function registerParquetFileBuffer(opfsFilePath: string, duckdbFileName: string) {
  // From API
  const db = (window as any).db as duckdb.AsyncDuckDB;

  const opfsRoot = await navigator.storage.getDirectory();
  const parquetFileHandle = await getOrCreateFile(opfsRoot, opfsFilePath);
  const parquetFile = await parquetFileHandle.getFile();

  const startTime = performance.now(); // Start timing
  await db.registerFileBuffer(duckdbFileName, new Uint8Array(await parquetFile.arrayBuffer()))
  const endTime = performance.now(); // End timing
  console.log(`register OPFS File Buffer: ${(endTime - startTime).toFixed(3)} ms`);
}

// Attach the function to the global window object
(window as any).duckdb = {};
(window as any).duckdb.registerFileBuffer = registerFileBuffer;
(window as any).duckdb.insertJSONFromPath = insertJSONFromPath;
(window as any).duckdb.insertArrowFromIPCStream = insertArrowFromIPCStream;
(window as any).duckdb.dropFiles = dropFiles;
(window as any).duckdb.exportParquetFile = exportParquetFile;
(window as any).duckdb.registerParquetFileBuffer = registerParquetFileBuffer;

export { registerFileBuffer, insertJSONFromPath, insertArrowFromIPCStream, registerParquetFileBuffer };