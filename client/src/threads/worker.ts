// worker.js
import Module from './sorting.js';
import wasmUrl from './sorting.wasm?url';


self.onmessage = async (event) => {
  const { start, end, sharedBuffer } = event.data;
  const sharedArray = new Int32Array(sharedBuffer);

  const memory = new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
  let globalBytes = null

  const log = (offset, length) => {
    const bytes = new Uint8Array(memory.buffer, offset, length)
    globalBytes = bytes

    //Can't use TextDecoder because it doesn't handle shared array buffers as of 2021-04-20.
    //const string = new TextDecoder('utf8').decode(bytes);
    const string = bytes.reduce(
      (accum, byte) => accum + String.fromCharCode(byte), '')

    console.log(string)
  };


  // Define the imports for the WebAssembly module
  const imports: WebAssembly.Imports = {
    env: {
      memory,
      log
      // Add other imports if your WASM requires more (e.g., imported functions)
    },
  };




  // Load WebAssembly
  if (!self.wasmInstance) {

    // const m = await Module;  // This will return the resolved module

    // await m.run();

    const response = await fetch("./add.wasm", { headers: { 'Content-Type': 'application/wasm' } });  // Use the URL of the WASM file
    const wasmBytes = await response.arrayBuffer();  // Get the ArrayBuffer from the response
    const wasmModule = new WebAssembly.Module(wasmBytes);
    const wasmInstance = new WebAssembly.Instance(wasmModule, imports);

    // JavaScript: Call the function from the Wasm instance
    //const out = wasmInstance.exports.sum(sharedArray.byteOffset, sharedArray.length);
    //console.log(out);

    wasmInstance.exports.hello()

  }

  // Access the sort function from WebAssembly
  // const sortChunk = self.wasmInstance._sort_chunk;

  // Perform the sorting in the given range
  // sortChunk(sharedArray, start, end);

  // const updatedArray = Array.from(sharedArray);
  // Notify the main thread that the sorting is completed
  // self.postMessage(`Sorting completed for range ${start} - ${end}`);
};
