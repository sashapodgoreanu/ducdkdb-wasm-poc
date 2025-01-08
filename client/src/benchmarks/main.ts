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

// Data can be inserted from an existing arrow.Table
// More Example https://arrow.apache.org/docs/js/
import { tableFromArrays } from 'apache-arrow';
import * as Arrow from 'apache-arrow';
import { tableFromIPC } from "apache-arrow";


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

