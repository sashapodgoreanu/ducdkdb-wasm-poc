import * as duckdb from '@duckdb/duckdb-wasm';

import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import mvp_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';

import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

import duckdb_wasm_coi from '@duckdb/duckdb-wasm/dist/duckdb-coi.wasm?url';
import coi_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.worker.js?url';
import pthreadWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-coi.pthread.worker.js?url'

import * as shell from '@duckdb/duckdb-wasm-shell';
import shell_wasm from '@duckdb/duckdb-wasm-shell/dist/shell_bg.wasm?url';
import FontFaceObserver from 'fontfaceobserver';

import { createOPFSFileHandle } from './opfs'


// References to track the state and resolve DB connection
const shellDBResolver: { current: [(db: duckdb.AsyncDuckDB) => void, (err: any) => void] | null } = { current: null };
const shellStatusUpdater: { current: duckdb.InstantiationProgressHandler | null } = { current: null };


const SHELL_FONT_FAMILY = 'Roboto Mono';

// Manual DuckDB bundles
const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  mvp: {
    mainModule: duckdb_wasm,
    mainWorker: mvp_worker,
  },
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker,
  },
  coi: {

    mainModule: duckdb_wasm_coi,
    mainWorker: coi_worker,
    pthreadWorker
  }
};

async function pickFilesForOPFS(db: duckdb.AsyncDuckDB): Promise<number> {
  const files: any[] = await (window as any).showOpenFilePicker({
    multiple: true,
  });
  console.log(files);
  for (let i = 0; i < files.length; ++i) {
    const file = files[i];
    const accessHandle = await file.createSyncAccessHandle();
    await db.dropFile(file.name);
    await db.registerFileHandle(file.name, accessHandle, duckdb.DuckDBDataProtocol.BROWSER_FSACCESS, true);
  }
  return files.length;
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

async function initializeDuckDBShell() {
  // Select the DuckDB bundle
  const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

  const platformFeatures = await duckdb.getPlatformFeatures()
  console.log(platformFeatures);

  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();

  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);


  const duckdbConfig: duckdb.DuckDBConfig = {
    allowUnsignedExtensions: true
  }

  await db.open(duckdbConfig);

  // Expose the `db` object globally
  (window as any).db = db; // Attach `db` to the `window` object

  // Check if the File System Access API is supported
  if ('storage' in navigator && 'getDirectory' in navigator.storage) {
    try {
      // Get a reference to the OPFS root directory
      const opfsRoot = await navigator.storage.getDirectory();

      const csvFileHandle = await getOrCreateFile(opfsRoot, "students.csv")
      const parquetFileHandle = await getOrCreateFile(opfsRoot, "students.parquet")

      const csvFile = await csvFileHandle.getFile();
      const csvFileBuf = await csvFile.arrayBuffer();
      const writable = await csvFileHandle.createWritable();

      const encoder = new TextEncoder();

      const streamResponse = await fetch(`api/data`);
      const buffer = new Uint8Array(await streamResponse.arrayBuffer());
      await db.registerFileBuffer('json_input_buffer.json', buffer);


      await db.registerFileHandle('students-opfs.csv', csvFileHandle, duckdb.DuckDBDataProtocol.BUFFER, false);
      // await db.registerFileHandle('students.parquet', parquetFileHandle, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, false);

      await db.registerFileBuffer("students.csv", new Uint8Array(csvFileBuf));
      // await db.registerFileBuffer("students.parquet", new Uint8Array(pFileeBuf));

      // await db.registerEmptyFileBuffer('students-buffer.csv');
      // await db.registerEmptyFileBuffer('students-buffer.parquet');

      db.insertArrowFromIPCStream


      const conn = await db.connect();

      //conn.insertJSONFromPath('json_input_buffer', {
      //  schema: 'main',
      //  name: 'foo',
      //})


      // await conn.query(`CREATE TABLE students (name int);`);
      // await conn.query(`insert into students values (1);`);
      // await conn.query(`COPY students TO 'students.csv' WITH (HEADER 1, DELIMITER ';', FORMAT CSV);`);
      // await conn.query(`COPY students TO 'students.parquet' (FORMAT PARQUET);`);
      // await db.flushFiles();

      // await conn.query(`DROP TABLE IF EXISTS students`);
      await conn.close();
      const csvBuffer = await db.copyFileToBuffer('students.csv');
      const jsonBuffer = await db.copyFileToBuffer('json_input_buffer');
      // const parquetBuffer = await db.copyFileToBuffer('students.parquet');
      await writeUint8ArrayToFile(csvFileHandle, csvBuffer);
      // await writeUint8ArrayToFile(parquetFileHandle, parquetBuffer);

      // await db.copyFileToPath('students-buffer.csv', "/students-buffer.csv");
      const decoder = new TextDecoder();
      const text = decoder.decode(csvBuffer!);
      console.log(text);

    } catch (error) {
      console.error("An error occurred:", error);
    }
  } else {
    console.error("File System Access API is not supported in this browser.");
  }



  // await db.open({
  //  path: 'http://localhost:5173/duck.db',
  //  accessMode: duckdb.DuckDBAccessMode.READ_WRITE,
  // });
  /// const conn = await db.connect();

  const regular = new FontFaceObserver(SHELL_FONT_FAMILY).load();
  const bold = new FontFaceObserver(SHELL_FONT_FAMILY, { weight: 'bold' }).load();
  await Promise.all([regular, bold]);

  // Embed the DuckDB shell into the #shell-container div
  const shellContainer = document.getElementById('shell-container') as HTMLDivElement;


  await shell.embed({
    shellModule: shell_wasm,
    container: shellContainer,
    fontFamily: SHELL_FONT_FAMILY,
    resolveDatabase: (progressHandler: duckdb.InstantiationProgressHandler) => {
      // Here you'd normally handle DB resolution with actual DB logic
      if (!db) {
        return Promise.reject("error");
      }
      if (db) {
        return Promise.resolve(db);
      }

      // Set progress handler
      shellStatusUpdater.current = progressHandler;

      // Return a Promise that will resolve with the DB instance
      const result = new Promise<duckdb.AsyncDuckDB>((resolve, reject) => {
        shellDBResolver.current = [resolve, reject];
      });

      return result;
    },
  });

  console.log('DuckDB Shell initialized.');
}

// Initialize the DuckDB Shell
initializeDuckDBShell().catch((error) => {
  console.error('Failed to initialize DuckDB Shell:', error);
});