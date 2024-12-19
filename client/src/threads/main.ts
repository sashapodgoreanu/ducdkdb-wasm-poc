import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Creazione di un array di numeri casuali
const generateData = (length: number): number[] => {
  return Array.from({ length }, () => Math.floor(Math.random() * 100)); // Numeri tra 0 e 100
};

let array: number[] = generateData(10); // Array di 1000 numeri casuali


const sharedBuffer = new SharedArrayBuffer(array.length * Int32Array.BYTES_PER_ELEMENT);
const sharedArray = new Int32Array(sharedBuffer);

// Copia l'array di dati iniziali nel SharedArrayBuffer
sharedArray.set([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

const ctx = document.getElementById('myChart') as HTMLCanvasElement;
const myChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: array.map((_, index) => index), // Indici come etichette
    datasets: [{
      label: 'Valori dell\'Array',
      data: array,
      backgroundColor: 'steelblue',
      borderColor: 'blue',
      borderWidth: 1,
      barThickness: 1,
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        }
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        ticks: {
          stepSize: 10,
        }
      }
    }
  }
});

// Funzione per aggiornare i dati e il grafico
const updateData = () => {
  const updatedArray = Array.from(sharedArray); // Copia dell'array condiviso
  myChart.data.datasets[0].data = updatedArray;
  myChart.update();
};

// Avvia il web worker per ogni thread
const numWorkers = 5;
const workers: Worker[] = [];

for (let i = 0; i < numWorkers; i++) {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'module',
  });
  workers.push(worker);
}

// Passa le informazioni di partenza ai worker
const chunkSize = Math.floor(array.length / numWorkers);
for (let i = 0; i < numWorkers; i++) {
  const start = i * chunkSize;
  const end = (i + 1) * chunkSize - 1;
  workers[i].postMessage({ start, end, sharedBuffer });
}

// Funzione per controllare il progresso e aggiornare il grafico ogni 100ms
setInterval(() => {
  updateData(); // Aggiorna il grafico
}, 100);

// Funzione per gestire la terminazione dei workers
workers.forEach(worker => {
  worker.onmessage = (event) => {
    console.log(`Worker completato: ${event.data}`);
  };
});
