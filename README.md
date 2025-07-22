# Frontend IA Transcriptor

Este es el frontend para el proyecto de transcripción de audio en tiempo real, desarrollado con Nuxt.js.

## Requisitos Previos

- Node.js (v16 o superior)
- Backend del proyecto corriendo (back-ia-dictator)

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd front-ia-dictator/front-dictator
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```bash
NUXT_PUBLIC_API_URL=http://localhost:3000
```

## Desarrollo

Para iniciar el servidor de desarrollo:
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`



## Estructura del Proyecto

- `app/`
  - `components/` - Componentes Vue reutilizables
    - `auth/` - Componentes de autenticación
    - `header/` - Componentes de navegación
    - `live-transcription/` - Componentes para transcripción en vivo
    - `transcription/` - Componentes relacionados con transcripciones
    - `transcripts-history/` - Componentes de historial
    - `ui/` - Componentes de interfaz de usuario
  - `composables/` - Composables de Vue
  - `layouts/` - Layouts de la aplicación
  - `pages/` - Páginas de la aplicación
  - `plugins/` - Plugins de Nuxt
  - `utils/` - Utilidades y helpers

## Características Principales

- Autenticación de usuarios
- Transcripción de audio en tiempo real
- Historial de transcripciones
- Interfaz responsive con Tailwind CSS

## Tecnologías Principales

- Nuxt.js 4
- Vue.js 3
- Tailwind CSS
- Socket.IO Client
- Heroicons
