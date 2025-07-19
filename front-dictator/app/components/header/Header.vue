<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserSession } from '~/composables/useUserSession'


const route = useRoute()
const router = useRouter()
// Composables
const { loggingOut } = useUserSession()

const sectionMap = {
  '/dashboard': 'Dashboard',
  '/history': 'Historial',
  '/realtime': 'Grabar',
  '/upload': 'Subir Archivo',

}

const currentSection = ref(sectionMap[route.path] || 'Dashboard')

watch(
  () => route.path,
  (newPath) => {
    currentSection.value = sectionMap[newPath] || 'Dashboard'
  }
)

function setSection(section) {
  currentSection.value = section
  const path = Object.keys(sectionMap).find(key => sectionMap[key] === section)
  if (path) router.push(path)
}

const handleLogout = async () => {
  try {
    await loggingOut()
    showNotification('Sesión cerrada correctamente', 'success')
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
    // Redirigir de todas formas
    await navigateTo('/')
  }
}
</script>

<template>
    <header class="w-full mb-6 ">
        <div class="bg-white flex p-4 justify-between">
            <h1>🎤 Scripter.ai</h1>
            <div class="flex gap-2 items-center">
                <span class="">¡Bienvenido!</span>
                <button @click="handleLogout"
                    class="bg-red-500 p-2 rounded text-white font-semibold hover:bg-red-600 transition">
                    Logout
                </button>
            </div>
        </div>
        <div class="bg-white rounded-b-lg p-2 md:p-4 flex gap-2 md:gap-4 justify-start md:ml-32 max-w-fit">
            <button v-for="section in ['Dashboard','Historial', 'Grabar', 'Subir Archivo']" :key="section"
                :class="['header-section  p-1 md:p-2', { active: currentSection === section }]" @click="setSection(section)"
                style="cursor:pointer">
                {{ section }}
        </button>
        </div>
    </header>

</template>
<style scoped>

.header-section {
color:#3b82f6;
  border-radius: 6px;
  transition: background 0.2s, color 0.2s;
}
.header-section.active {
  color:#2d75e8;
  font-weight: bold;
  pointer-events: none;
}
</style>