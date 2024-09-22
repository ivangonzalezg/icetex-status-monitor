# ICETEX Status Monitor Bot

Este proyecto es un **scraper automatizado** que revisa el estado de las solicitudes en el sitio web de **ICETEX** y envía notificaciones a **Telegram** cuando hay cambios en el estado de una solicitud específica.

El bot se ejecuta dentro de un contenedor Docker y es compatible tanto con sistemas **AMD** como **ARM** (Raspberry Pi). Utiliza **Puppeteer** para el scraping y **Telegram Bot API** para las notificaciones.

## Características

- Revisión automatizada del estado de solicitudes en ICETEX.
- Notificaciones a través de Telegram cuando cambia el estado de una solicitud.
- Implementación mediante **Puppeteer** y **Telegram Bot API**.
- Ejecutable en sistemas **ARM** (Raspberry Pi) y **AMD** utilizando Docker.

## Prerrequisitos

Antes de ejecutar el proyecto, asegúrate de tener instalados:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Variables de Entorno

Debes definir las siguientes variables de entorno. Puedes crear un archivo `.env` basado en el archivo de ejemplo `.env.example`:

```
TELEGRAM_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
APPLICANT_ID_NUMBER=your-applicant-id-number
APPLICATION_ID=your-application-id
```

## Configuración del Proyecto

### Clonar el repositorio

Clona el proyecto desde el repositorio de Git:

```bash
git clone https://github.com/ivangonzalezg/icetex-status-monitor.git
cd icetex-status-monitor
```

### Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example`:

```bash
cp .env.example .env
```

Rellena las variables en el archivo `.env` con tus propios valores (como tu token de Telegram, ID de chat, número de identificación, etc.).

### Construcción y Ejecución con Docker

1. **Construir la imagen Docker:**

   ```bash
   docker-compose build
   ```

2. **Ejecutar el contenedor:**

   ```bash
   docker-compose up -d
   ```

   Esto levantará el servicio y el bot comenzará a verificar el estado de la solicitud en intervalos definidos en el código.

### Logs

Puedes verificar los logs para ver la salida del bot y asegurarte de que está funcionando correctamente:

```bash
docker logs -f icetex-status-monitor
```

### Detener el Bot

Si deseas detener el bot, puedes hacerlo con el siguiente comando:

```bash
docker-compose down
```

## Estructura del Proyecto

```
icetex-status-monitor/
│
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── index.js
├── package.json
├── yarn.lock
└── README.md
```

## Problemas Comunes

### Error de Puppeteer: "Could not find expected browser"

Si encuentras un error relacionado con que Puppeteer no puede encontrar un navegador, asegúrate de que has instalado todas las dependencias necesarias para Chromium o que has configurado Puppeteer para usar el navegador del sistema.

## Contribuir

Si deseas contribuir a este proyecto, siéntete libre de abrir issues o pull requests en el repositorio.

## Licencia

Este proyecto está licenciado bajo la [MIT License](https://opensource.org/licenses/MIT).
