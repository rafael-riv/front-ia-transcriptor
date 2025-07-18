<template>
  <div>
    <h2>Transcripción en Tiempo Real</h2>
    <button @click="startTranscription" :disabled="isTranscribing">Comenzar</button>
    <button @click="stopTranscription" :disabled="!isTranscribing">Detener</button>
    <button @click="saveTranscript" :disabled="!fullTranscript || isTranscribing" v-if="fullTranscript">
      Guardar Transcripción
    </button>
    <button @click="downloadTranscript" :disabled="!fullTranscript" v-if="fullTranscript">
      Descargar Texto
    </button>
    <p><strong>Estado:</strong> {{ status }}</p>
    <div>
      <h3>Transcripción en vivo:</h3>
      <p>{{ liveTranscript }}</p>
    </div>
    <div v-if="fullTranscript">
      <h3>Transcripción completa:</h3>
      <div style="max-height: 200px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background-color: #f9f9f9;">
        <p style="white-space: pre-wrap;">{{ fullTranscript }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

const isTranscribing = ref(false);
const status = ref('Detenido');
const liveTranscript = ref('');
const fullTranscript = ref('');
const accumulatedText = ref('');
let mediaRecorder: MediaRecorder | null = null;
let socket: Socket | null = null;

const API_BASE_URL = 'http://localhost:4000';

onMounted(() => {
  socket = io(API_BASE_URL);

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('partial_transcript', (data) => {
    const partialText = data.results
      .map((r: any) => r.alternatives?.[0].content)
      .join(' ');
      liveTranscript.value = partialText;
  });

  socket.on('final_transcript', (data) => {
     const finalText = data.results
      .map((r: any) => r.alternatives?.[0].content)
      .join(' ');
    liveTranscript.value = finalText;
    
    // Acumular el texto final
    if (finalText.trim()) {
      accumulatedText.value += (accumulatedText.value ? ' ' : '') + finalText.trim();
    }
  });

  socket.on('error', (errorMessage) => {
    console.error('Socket error:', errorMessage);
    status.value = `Error: ${errorMessage}`;
    stopTranscription();
  });

  socket.on('recognition_started', () => {
    console.log('Recognition started, beginning to send audio.');
    startSendingAudio();
  });
});

onUnmounted(() => {
  stopTranscription();
  socket?.disconnect();
});


const startTranscription = async () => {
  if (isTranscribing.value) return;

  if (socket?.disconnected) {
    socket.connect();
  }

  isTranscribing.value = true;
  status.value = 'Iniciando...';
  liveTranscript.value = '';
  
  // Si hay una nueva sesión, limpiar solo el texto en vivo
  // pero mantener el texto acumulado de sesiones anteriores

  socket?.emit('start_recognition');
};

const startSendingAudio = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        socket?.emit('send_audio', event.data);
      }
    };

    mediaRecorder.start(1000); // Enviar datos cada segundo
    status.value = '¡Habla ahora!';
  } catch (error) {
    console.error('Error al iniciar transcripción:', error);
    status.value = `Error: ${error instanceof Error ? error.message : 'Desconocido'}`;
    stopTranscription();
  }
};

const stopTranscription = () => {
  if (!isTranscribing.value) return;

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  
  socket?.emit('stop_recognition');

  mediaRecorder?.stream.getTracks().forEach(track => track.stop());

  // Al finalizar la sesión, guardar todo el texto acumulado
  fullTranscript.value = accumulatedText.value;

  isTranscribing.value = false;
  status.value = 'Detenido';
  mediaRecorder = null;
  liveTranscript.value = '';
};

const saveTranscript = async () => {
  if (!fullTranscript.value.trim()) {
    alert('No hay texto para guardar');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión.');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/transcribe/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: fullTranscript.value,
        filename: `Transcripción en tiempo real - ${new Date().toLocaleString()}`
      })
    });

    if (response.ok) {
      const result = await response.json();
      alert('Transcripción guardada exitosamente');
      console.log('Transcripción guardada:', result);
      
      // Limpiar el texto después de guardarlo
      fullTranscript.value = '';
      accumulatedText.value = '';
    } else {
      const error = await response.json();
      alert(`Error al guardar: ${error.msg || 'Error desconocido'}`);
    }
  } catch (error) {
    console.error('Error al guardar transcripción:', error);
    alert('Error al conectar con el servidor');
  }
};

const downloadTranscript = () => {
  if (!fullTranscript.value.trim()) {
    alert('No hay texto para descargar');
    return;
  }

  const blob = new Blob([fullTranscript.value], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transcripcion_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
button { 
  margin: 5px; 
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  opacity: 0.8;
}

p { min-height: 1.2em; }

h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}
</style> 