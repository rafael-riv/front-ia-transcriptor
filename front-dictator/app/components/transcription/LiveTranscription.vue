<template>
  <div>
    <h2>Transcripción en Tiempo Real</h2>
    <button @click="startTranscription" :disabled="isTranscribing">Comenzar</button>
    <button @click="stopTranscription" :disabled="!isTranscribing">Detener</button>
    <p><strong>Estado:</strong> {{ status }}</p>
    <div>
      <h3>Transcripción:</h3>
      <p>{{ liveTranscript }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

const isTranscribing = ref(false);
const status = ref('Detenido');
const liveTranscript = ref('');
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

  isTranscribing.value = false;
  status.value = 'Detenido';
  mediaRecorder = null;
};
</script>

<style scoped>
button { margin: 5px; }
p { min-height: 1.2em; }
</style> 