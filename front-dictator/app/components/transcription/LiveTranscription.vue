<template>
  <div>
    <h2>Transcripción en Tiempo Real</h2>
    
    <!-- Controles de grabación -->
    <div class="controls-section">
      <button @click="startTranscription" :disabled="isTranscribing && !isPaused" class="btn-start">
        {{ isTranscribing && !isPaused ? 'Grabando...' : 'Comenzar Grabación' }}
      </button>
      
      <button @click="pauseTranscription" :disabled="!isTranscribing || isPaused" class="btn-pause">
        Pausar
      </button>
      
      <button @click="resumeTranscription" :disabled="!isTranscribing || !isPaused" class="btn-resume">
        Reanudar
      </button>
      
      <button @click="stopTranscription" :disabled="!isTranscribing" class="btn-stop">
        Finalizar Transcripción
      </button>
    </div>

    <p><strong>Estado:</strong> 
      <span :class="getStatusClass()">{{ status }}</span>
    </p>

    <!-- Transcripción en vivo -->
    <div class="live-section" v-if="isTranscribing">
      <h3>Transcripción en vivo:</h3>
      <div class="live-transcript">
        <p>{{ liveTranscript }}</p>
      </div>
    </div>

    <!-- Transcripción actual en progreso -->
    <div v-if="currentTranscript" class="current-section">
      <h3>Transcripción actual:</h3>
      <div class="current-transcript">
        <p>{{ currentTranscript }}</p>
      </div>
      
      <div class="current-controls">
        <button @click="saveCurrentTranscript" :disabled="!currentTranscript || isTranscribing" class="btn-save">
          Guardar Transcripción Actual
        </button>
        <button @click="downloadCurrentTranscript" :disabled="!currentTranscript" class="btn-download">
          Descargar Texto Actual
        </button>
      </div>
    </div>

    <!-- Historial de transcripciones -->
    <div class="history-section">
      <div class="history-header">
        <h3>Historial de Transcripciones</h3>
        <div class="history-info">
          <span v-if="loadingHistory" class="loading-indicator">🔄 Cargando historial...</span>
          <span v-else class="history-count">{{ transcriptionHistory.length }} transcripciones</span>
          <button @click="refreshHistory" class="btn-refresh" :disabled="loadingHistory">
            {{ loadingHistory ? 'Actualizando...' : '🔄 Actualizar' }}
          </button>
        </div>
      </div>
      
      <div v-if="transcriptionHistory.length > 0" class="history-controls">
        <button @click="clearHistory" class="btn-clear-history">
          Limpiar Historial Local
        </button>
        <button @click="downloadAllTranscripts" class="btn-download-all">
          Descargar Todo el Historial
        </button>
      </div>

      <div v-if="loadingHistory" class="loading-message">
        <p>📥 Cargando historial desde el servidor...</p>
      </div>

      <div v-else-if="transcriptionHistory.length === 0" class="empty-history">
        <p>📝 No hay transcripciones en el historial. ¡Crea tu primera transcripción!</p>
      </div>

      <div v-else class="history-list">
        <div class="transcription-item" v-for="(item, index) in transcriptionHistory" :key="item.id">
          <div class="transcription-header">
            <div class="transcription-title">
              <h4>
                {{ item.filename || `Transcripción #${index + 1}` }}
                <span v-if="!item._id" class="temp-badge">📝 Temporal</span>
                <span v-else class="saved-badge">💾 Guardado</span>
              </h4>
              <span class="transcription-date">{{ item.timestamp }}</span>
            </div>
            <div class="item-controls">
              <button 
                @click="saveTranscriptItem(item)" 
                v-if="!item._id" 
                class="btn-save-small"
                title="Guardar en el servidor"
              >
                💾 Guardar
              </button>
              <button 
                @click="downloadTranscriptItem(item)" 
                class="btn-download-small"
                title="Descargar como archivo"
              >
                📁 Descargar
              </button>
              <button 
                @click="deleteTranscriptItem(item.id)" 
                class="btn-delete"
                :title="item._id ? 'Eliminar del servidor' : 'Eliminar localmente'"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
          <div class="transcription-meta">
            <span class="duration-info">⏱️ {{ item.duration }}</span>
            <span v-if="item._id" class="server-info">🌐 En servidor</span>
            <span v-else class="local-info">💻 Solo local</span>
          </div>
          <div class="transcription-content">
            <p>{{ item.text }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

interface TranscriptionItem {
  id: string;
  text: string;
  timestamp: string;
  duration?: string;
  startTime: Date;
  endTime: Date;
  _id?: string; // ID de la base de datos
  createdAt?: string; // Fecha de creación desde la DB
  filename?: string; // Nombre del archivo desde la DB
}

const isTranscribing = ref(false);
const isPaused = ref(false);
const status = ref('Detenido');
const liveTranscript = ref('');
const currentTranscript = ref('');
const transcriptionHistory = ref<TranscriptionItem[]>([]);
const loadingHistory = ref(false);

let mediaRecorder: MediaRecorder | null = null;
let socket: Socket | null = null;
let currentSessionStartTime: Date | null = null;

const API_BASE_URL = 'http://localhost:4000';

onMounted(() => {
  socket = io(API_BASE_URL);

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('partial_transcript', (data) => {
    if (!isPaused.value) {
      const partialText = data.results
        .map((r: any) => r.alternatives?.[0].content)
        .join(' ');
      liveTranscript.value = partialText;
    }
  });

  socket.on('final_transcript', (data) => {
    if (!isPaused.value) {
      const finalText = data.results
        .map((r: any) => r.alternatives?.[0].content)
        .join(' ');
      liveTranscript.value = finalText;
      
      // Acumular el texto final en la transcripción actual
      if (finalText.trim()) {
        currentTranscript.value += (currentTranscript.value ? ' ' : '') + finalText.trim();
      }
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

  // Cargar historial desde la base de datos
  loadHistoryFromDatabase();
});

onUnmounted(() => {
  stopTranscription();
  socket?.disconnect();
});

// Función para cargar el historial desde la base de datos
const loadHistoryFromDatabase = async () => {
  loadingHistory.value = true;
  
  try {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      console.log('No token found, skipping history load');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const dbTranscripts = await response.json();
      
      // Convertir las transcripciones de la DB al formato local
      transcriptionHistory.value = dbTranscripts
        .filter((item: any) => item.text && item.text.trim()) // Solo transcripciones con texto
        .map((item: any) => ({
          id: item._id,
          _id: item._id,
          text: item.text,
          filename: item.filename,
          timestamp: new Date(item.createdAt).toLocaleString(),
          duration: 'Guardado',
          startTime: new Date(item.createdAt),
          endTime: new Date(item.updatedAt || item.createdAt),
          createdAt: item.createdAt
        }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log(`Historial cargado: ${transcriptionHistory.value.length} transcripciones`);
    } else {
      console.error('Error al cargar historial:', response.status);
    }
  } catch (error) {
    console.error('Error al cargar historial desde la base de datos:', error);
  } finally {
    loadingHistory.value = false;
  }
};

// Función para refrescar el historial
const refreshHistory = async () => {
  await loadHistoryFromDatabase();
};

const getStatusClass = () => {
  if (status.value.includes('Error')) return 'status-error';
  if (isTranscribing.value && !isPaused.value) return 'status-recording';
  if (isPaused.value) return 'status-paused';
  return 'status-stopped';
};

const startTranscription = async () => {
  if (isTranscribing.value && !isPaused.value) return;

  if (socket?.disconnected) {
    socket.connect();
  }

  isTranscribing.value = true;
  isPaused.value = false;
  status.value = 'Iniciando...';
  liveTranscript.value = '';
  currentSessionStartTime = new Date();

  socket?.emit('start_recognition');
};

const startSendingAudio = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && !isPaused.value) {
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

const pauseTranscription = () => {
  if (!isTranscribing.value || isPaused.value) return;
  
  isPaused.value = true;
  status.value = 'Pausado';
  socket?.emit('pause_recognition');
};

const resumeTranscription = () => {
  if (!isTranscribing.value || !isPaused.value) return;
  
  isPaused.value = false;
  status.value = '¡Habla ahora!';
  socket?.emit('resume_recognition');
};

const stopTranscription = () => {
  if (!isTranscribing.value) return;

  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
  
  socket?.emit('stop_recognition');
  mediaRecorder?.stream.getTracks().forEach(track => track.stop());

  // Crear nueva entrada en el historial LOCAL si hay texto
  if (currentTranscript.value.trim()) {
    const endTime = new Date();
    const duration = currentSessionStartTime 
      ? `${Math.round((endTime.getTime() - currentSessionStartTime.getTime()) / 1000)}s`
      : 'N/A';

    const newTranscription: TranscriptionItem = {
      id: `temp_transcript_${Date.now()}`, // ID temporal hasta que se guarde
      text: currentTranscript.value.trim(),
      timestamp: endTime.toLocaleString(),
      duration,
      startTime: currentSessionStartTime || endTime,
      endTime
    };

    // Agregar al historial local (temporal hasta que se guarde)
    transcriptionHistory.value.unshift(newTranscription);
  }

  // Limpiar estado actual
  isTranscribing.value = false;
  isPaused.value = false;
  status.value = 'Detenido';
  mediaRecorder = null;
  liveTranscript.value = '';
  currentTranscript.value = '';
  currentSessionStartTime = null;
};

const saveCurrentTranscript = async () => {
  if (!currentTranscript.value.trim()) {
    alert('No hay texto para guardar');
    return;
  }

  const result = await saveTranscriptText(currentTranscript.value, 'Transcripción actual en progreso');
  if (result) {
    // Refrescar el historial después de guardar
    await refreshHistory();
  }
};

const saveTranscriptItem = async (item: TranscriptionItem) => {
  // Si es una transcripción temporal (no guardada), guardarla
  if (!item._id && item.id.startsWith('temp_')) {
    const result = await saveTranscriptText(item.text, `Transcripción #${transcriptionHistory.value.indexOf(item) + 1}`);
    if (result) {
      // Refrescar el historial después de guardar
      await refreshHistory();
    }
  } else {
    alert('Esta transcripción ya está guardada en el servidor');
  }
};

const saveTranscriptText = async (text: string, filename: string) => {
  try {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      alert('No estás autenticado. Por favor, inicia sesión.');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/api/transcribe/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text: text,
        filename: `${filename} - ${new Date().toLocaleString()}`
      })
    });

    if (response.ok) {
      const result = await response.json();
      alert('Transcripción guardada exitosamente');
      console.log('Transcripción guardada:', result);
      return true;
    } else {
      const error = await response.json();
      alert(`Error al guardar: ${error.msg || 'Error desconocido'}`);
      return false;
    }
  } catch (error) {
    console.error('Error al guardar transcripción:', error);
    alert('Error al conectar con el servidor');
    return false;
  }
};

const downloadCurrentTranscript = () => {
  if (!currentTranscript.value.trim()) {
    alert('No hay texto para descargar');
    return;
  }
  
  downloadText(currentTranscript.value, 'transcripcion_actual');
};

const downloadTranscriptItem = (item: TranscriptionItem) => {
  const index = transcriptionHistory.value.indexOf(item) + 1;
  downloadText(item.text, `transcripcion_${index}`);
};

const downloadAllTranscripts = () => {
  if (transcriptionHistory.value.length === 0) {
    alert('No hay transcripciones para descargar');
    return;
  }

  const allText = transcriptionHistory.value
    .map((item, index) => {
      return `=== Transcripción #${index + 1} ===\nFecha: ${item.timestamp}\nDuración: ${item.duration}\nArchivo: ${item.filename || 'Sin nombre'}\n\n${item.text}\n\n`;
    })
    .join('\n');

  downloadText(allText, 'historial_completo');
};

const downloadText = (text: string, filename: string) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const deleteTranscriptItem = async (id: string) => {
  if (confirm('¿Estás seguro de que quieres eliminar esta transcripción?')) {
    const item = transcriptionHistory.value.find(item => item.id === id);
    
    if (item && item._id) {
      // Si tiene _id, está en la base de datos - aquí podrías implementar la eliminación del servidor
      alert('Funcionalidad de eliminación del servidor no implementada aún');
    } else {
      // Es una transcripción temporal, eliminar solo del historial local
      transcriptionHistory.value = transcriptionHistory.value.filter(item => item.id !== id);
    }
  }
};

const clearHistory = async () => {
  if (confirm('¿Estás seguro de que quieres eliminar todo el historial local? (Las transcripciones guardadas en el servidor permanecerán)')) {
    transcriptionHistory.value = [];
    // Recargar desde la base de datos para mantener solo las guardadas
    await refreshHistory();
  }
};
</script>

<style scoped>
/* Estilos generales */
.controls-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

button { 
  margin: 5px; 
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* Botones específicos */
.btn-start { background-color: #4CAF50; color: white; }
.btn-pause { background-color: #ff9800; color: white; }
.btn-resume { background-color: #2196F3; color: white; }
.btn-stop { background-color: #f44336; color: white; }
.btn-save, .btn-save-small { background-color: #9C27B0; color: white; }
.btn-download, .btn-download-small { background-color: #607D8B; color: white; }
.btn-download-all { background-color: #795548; color: white; }
.btn-clear-history { background-color: #FF5722; color: white; }
.btn-delete { background-color: #f44336; color: white; padding: 4px 8px; font-size: 12px; }
.btn-refresh { background-color: #007bff; color: white; padding: 4px 8px; font-size: 12px; }

/* Estados */
.status-recording { color: #4CAF50; font-weight: bold; }
.status-paused { color: #ff9800; font-weight: bold; }
.status-error { color: #f44336; font-weight: bold; }
.status-stopped { color: #666; }

/* Secciones */
.live-section, .current-section, .history-section {
  margin: 20px 0;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.live-section { background-color: #e8f5e8; }
.current-section { background-color: #f0f8ff; }
.history-section { background-color: #fff8e1; }

/* Transcripciones */
.live-transcript, .current-transcript {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  margin: 10px 0;
}

.transcription-item {
  margin: 15px 0;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
}

.transcription-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.transcription-title {
  flex: 1;
}

.transcription-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.transcription-header h4 {
  margin: 0;
  color: #333;
}

.transcription-date {
  font-size: 12px;
  color: #666;
}

.item-controls {
  display: flex;
  gap: 5px;
}

.transcription-content {
  max-height: 100px;
  overflow-y: auto;
  background-color: #fafafa;
  padding: 10px;
  border-radius: 4px;
}

.transcription-content p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.4;
}

.current-controls, .history-controls {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

p { min-height: 1.2em; }

h3 {
  margin-top: 20px;
  margin-bottom: 10px;
  color: #333;
}

h4 {
  margin: 0 0 5px 0;
  color: #555;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.history-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-indicator, .history-count {
  font-size: 14px;
  color: #666;
}

.loading-message, .empty-history {
  text-align: center;
  padding: 20px;
  margin: 20px 0;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.loading-message p, .empty-history p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

.temp-badge {
  background-color: #ffeb3b;
  color: #333;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 10px;
  margin-left: 8px;
}

.saved-badge {
  background-color: #4CAF50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 10px;
  margin-left: 8px;
}

.server-info {
  background-color: #e0f2f7;
  color: #007bff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 11px;
}

.local-info {
  background-color: #f0f0f0;
  color: #555;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 11px;
}

.duration-info {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.history-list {
  /* No specific styles needed, items are handled by .transcription-item */
}
</style> 