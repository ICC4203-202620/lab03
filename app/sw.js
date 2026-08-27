const CACHE_PREFIX = 'restaurants-static-';
const STATIC_CACHE = `${CACHE_PREFIX}v1`;
const CURRENT_CACHES = new Set([STATIC_CACHE]);

const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/register-sw.js',
  '/offline.html',
  '/estado.html'
];

self.addEventListener('install', (event) => {
  // TODO: Actividad 3 - Abrir STATIC_CACHE y agregar APP_SHELL. La promesa
  // completa debe extender la duración del evento.
});

self.addEventListener('activate', (event) => {
  // TODO: Actividad 4 - Obtener los nombres de los cachés y eliminar solamente
  // los que pertenezcan a esta aplicación y no estén en CURRENT_CACHES. La
  // promesa completa debe extender la duración del evento.
});

self.addEventListener('fetch', (event) => {
  // TODO: Actividad 5 - Intervenir solamente en solicitudes de navegación.
  // Intentar primero la red y utilizar /offline.html solamente cuando fetch()
  // rechace su promesa.
});
