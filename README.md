# Laboratorio 3: Service workers y ciclo de vida

Este laboratorio se centra en incorporar un service worker a una aplicación web existente. La actividad permite observar su registro, alcance y control sobre una página; implementar los eventos `install`, `activate` y `fetch`; diagnosticar una instalación fallida; y comprobar cómo el navegador coordina el reemplazo de una versión activa.

La aplicación entregada corresponde a la versión completa desarrollada para el Laboratorio 2. Su manifest, interfaz, geolocalización y publicación ya se encuentran resueltos. En este laboratorio no se deben modificar esas funcionalidades: el trabajo se concentra en el service worker y en su inspección mediante DevTools.

El manejo de las solicitudes se mantendrá acotado. El service worker intentará cargar desde la red las solicitudes de navegación y mostrará una página alternativa cuando no haya conexión. Las estrategias de almacenamiento en caché, la actualización de los recursos guardados y la persistencia de datos se desarrollarán posteriormente.

Las habilidades que se espera ejercitar en esta actividad son:

1. Explicar por qué la instalación de una PWA no implica que pueda abrirse sin conexión
2. Registrar un service worker y distinguir registro, worker, alcance, cliente y controlador
3. Asociar trabajo asincrónico a los eventos `install` y `activate`
4. Diagnosticar una instalación fallida a partir del estado del worker y de DevTools
5. Implementar una página alternativa para las navegaciones que fallen por falta de conexión
6. Observar la primera toma de control y el reemplazo de un worker activo
7. Explicar el propósito del estado `waiting` y las consecuencias de omitirlo

## Entorno de trabajo

Para desarrollar el laboratorio se requiere:

1. La versión estable más reciente de Google Chrome para escritorio
2. Un editor de código
3. El portal de publicación entregado por el equipo docente

Se puede trabajar en Windows, macOS o Linux. El sistema operativo no forma parte de los objetivos del laboratorio, ya que las actividades se realizan en Chrome y en su panel DevTools. Los computadores institucionales con Windows constituyen un entorno de referencia disponible, pero no son un requisito para completar la actividad.

Las instrucciones y verificaciones se basan en Google Chrome. Otros navegadores pueden presentar herramientas o comportamientos diferentes; si se utiliza uno de ellos y aparece un problema, primero se deberá comprobar si el mismo comportamiento se reproduce en la versión estable de Chrome.

Se recomienda utilizar un perfil de Chrome dedicado a la asignatura. No se debe trabajar en modo incógnito, ya que los registros y datos del sitio forman parte de lo que se observará. Las instrucciones utilizan los nombres que aparecen en la interfaz en español de DevTools.

Durante el laboratorio se **deben mantener desactivadas** las siguientes opciones del panel `Aplicación` → `Service Workers`, salvo que una instrucción indique lo contrario:

- `Actualizar cuando se vuelva a cargar`
- `Evitar para la red`

Estas opciones modifican artificialmente el ciclo de vida o la forma en que se procesan las solicitudes y pueden ocultar el comportamiento que se busca estudiar.

## Requisitos previos

Antes de comenzar, se requiere:

1. Haber revisado los conceptos de registro, alcance, control y ciclo de vida de un service worker
2. Contar con el RUT y la clave temporal utilizados para publicar la aplicación
3. Conocer la URL HTTPS asignada por el portal

No se requiere un teléfono ni instalar la aplicación durante este laboratorio. Todas las observaciones se realizarán directamente en Chrome para escritorio.

La aplicación que pudo haberse instalado en el teléfono durante el Laboratorio 2 puede permanecer instalada. Sus registros, datos y ventanas pertenecen al navegador de ese dispositivo y no afectan el ciclo de vida que se observará en Chrome para escritorio.

## Preparación

El directorio [`app/`](app/) contiene el material base:

```text
app/
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
├── app.js
├── app.webmanifest
├── index.html
├── offline.html
├── register-sw.js
├── styles.css
└── sw.js
```

Antes de modificar los archivos, se debe revisar su contenido:

- `index.html`, `styles.css`, `app.js`, `app.webmanifest` e `icons/` contienen la aplicación completa del laboratorio anterior
- `offline.html` contiene la página que se mostrará cuando una navegación falle por falta de conexión
- `register-sw.js` contiene la detección de la capacidad y la estructura desde la cual se registrará el worker
- `sw.js` contiene las constantes y los bloques `TODO` de los eventos que se implementarán

La lista `APP_SHELL` de `sw.js` incluye intencionalmente una ruta que no corresponde a ninguno de los archivos entregados. La lista no se debe corregir antes de diagnosticar la primera instalación.

### Publicar una versión

Cada vez que el procedimiento solicite publicar una nueva versión, se debe crear un archivo ZIP con el contenido de `app/`. La estructura del ZIP debe ser exactamente la siguiente:

```text
index.html
app.js
app.webmanifest
offline.html
register-sw.js
styles.css
sw.js
icons/
```

El ZIP se publica mediante el portal de publicación PWA:

1. Ingresar el RUT y la clave temporal
2. Validar los datos y confirmar la URL asignada
3. Cargar el ZIP
4. Esperar la confirmación de publicación
5. Abrir la URL HTTPS

Cada carga reemplaza completamente la versión que estaba publicada. Antes de publicar se debe comprobar que el ZIP no contenga una carpeta `app/` adicional ni el propio archivo ZIP.

## Conceptos previos

### Registro, worker, cliente y controlador

Un `ServiceWorkerRegistration` representa la relación persistente entre un alcance y las distintas versiones del worker. El archivo `sw.js` descargado y evaluado produce una versión concreta de `ServiceWorker`, cuyo estado cambia durante su ciclo de vida.

Una pestaña o ventana cuya URL se encuentra dentro del alcance es un cliente. El worker que controla actualmente las solicitudes de ese cliente se encuentra disponible mediante `navigator.serviceWorker.controller`. Un cliente puede coincidir con más de un alcance registrado, pero posee como máximo un controlador: el navegador selecciona el registro con el alcance coincidente más específico.

La resolución exitosa de `navigator.serviceWorker.register(...)` confirma el registro; no obstante, esto no implica que la página que ejecutó la operación haya quedado inmediatamente controlada.

### Trabajo asincrónico asociado a eventos

El navegador puede finalizar un evento del service worker cuando termina su trabajo inmediato. `event.waitUntil(promise)` informa que la operación representada por la promesa forma parte del evento y permite que el navegador espere su resultado.

En `install`, una promesa rechazada impide que la versión termine de instalarse. En `activate`, `waitUntil` permite completar tareas como la limpieza de cachés antes de que la versión comience a responder nuevos eventos.

### Responder una solicitud

El evento `fetch` permite observar las solicitudes de las páginas controladas. Si el listener no llama a `event.respondWith(...)`, el navegador procesa la solicitud normalmente. Si lo llama, la promesa entregada debe devolver la respuesta que recibirá la página.

En este laboratorio sólo se intervendrán las solicitudes cuyo `event.request.mode` sea `navigate`. Los scripts, estilos, imágenes y solicitudes de datos continuarán utilizando el comportamiento normal del navegador.

## Procedimiento

### 1. Restablecer el entorno de trabajo

Publicar primero el material base de este repositorio sin completar sus bloques `TODO`, de acuerdo con el procedimiento descrito en `Publicar una versión`. Esta primera publicación permite reemplazar cualquier resultado que haya quedado del Laboratorio 2.

En el browser del escritorio, abrir la URL HTTPS asignada y luego DevTools. En `Aplicación` → `Almacenamiento`, seleccionar los tipos de datos disponibles y utilizar `Borrar datos del sitio` para comenzar sin cachés ni datos anteriores en Chrome para escritorio. Posteriormente, revisar `Aplicación` → `Service Workers` y utilizar la opción para cancelar cualquier registro anterior asociado al origen.

Cerrar las demás pestañas y ventanas que utilicen la misma URL. Recargar la página y comprobar:

1. La aplicación presenta `Interfaz v1` en el pie de página
2. El cálculo de distancia desde una estación continúa funcionando
3. La consola no presenta errores de JavaScript
4. `navigator.serviceWorker.controller` devuelve `null`
5. `navigator.serviceWorker.getRegistration()` entrega `undefined`

Los puntos 4 y 5 representan conceptos diferentes: no existe un controlador para la página y tampoco existe todavía un registro persistente para ese origen y alcance.

### 2. Comprobar que la instalación y el funcionamiento sin conexión son independientes

En `Aplicación` → `Manifiesto`, comprobar que Chrome interpreta el manifest, los iconos, la URL inicial y el modo de presentación. Chrome cuenta con la información requerida para instalar la aplicación, pero todavía no existe un service worker registrado.

En `Red`, seleccionar `Sin conexión` y recargar la página. Si los datos del sitio fueron eliminados correctamente, Chrome no podrá cargar el documento y mostrará un error de conexión. Antes de continuar, desactivar la simulación `Sin conexión` para que Chrome vuelva a utilizar la red normalmente.

El manifest describe la identidad, la presentación, el punto de entrada y el alcance de la aplicación instalada. No guarda los archivos de la aplicación ni indica qué se debe mostrar cuando no hay conexión. Por ello, una aplicación que se puede instalar no necesariamente puede abrirse sin conexión.

### 3. Implementar el evento `install`

Abrir `sw.js` y localizar el listener de `install`. Se debe construir una promesa que represente las dos operaciones siguientes:

1. Abrir el caché cuyo nombre se encuentra en `STATIC_CACHE`
2. Agregar mediante `cache.addAll(APP_SHELL)` todos los recursos declarados

La promesa completa debe entregarse a `event.waitUntil(...)`. No se debe capturar ni ocultar su rechazo: si no se pueden guardar todos los recursos requeridos, esa versión no debe terminar de instalarse.

La estructura general de la operación es:

```js
caches.open(cacheName)
  .then((cache) => cache.addAll(resources))
```

En esta etapa se debe conservar `APP_SHELL` sin modificaciones. La validez de sus rutas se diagnosticará después de publicar.

### 4. Implementar el evento `activate`

El listener de `activate` debe eliminar los cachés antiguos que pertenezcan a esta aplicación, sin borrar los cachés de la versión actual ni los datos creados por otras aplicaciones del mismo origen.

Se dispone de:

- `CACHE_PREFIX`, que identifica los nombres administrados por esta aplicación
- `CURRENT_CACHES`, que contiene los nombres que utiliza la versión actual
- `caches.keys()`, que devuelve una promesa con los nombres existentes
- `caches.delete(name)`, que devuelve una promesa con el resultado de la eliminación

La implementación debe:

1. Obtener los nombres mediante `caches.keys()`
2. Conservar sólo los nombres que comienzan con `CACHE_PREFIX`
3. Excluir los nombres presentes en `CURRENT_CACHES`
4. Eliminar los nombres restantes
5. Esperar el conjunto de eliminaciones mediante `Promise.all(...)`
6. Entregar la promesa completa a `event.waitUntil(...)`

No se deben eliminar todos los cachés indiscriminadamente. En particular, `STATIC_CACHE` fue preparado durante `install` y debe continuar disponible después de la activación.

### 5. Implementar una página alternativa para las navegaciones sin conexión

El listener de `fetch` debe comenzar comprobando `event.request.mode`. Si el valor no es `navigate`, debe finalizar sin llamar a `respondWith`.

Para una navegación, se debe entregar a `event.respondWith(...)` una operación que:

1. Intente obtener `event.request` mediante `fetch(...)`
2. Si la promesa de `fetch` es rechazada, busque `/offline.html` mediante `caches.match(...)`

La respuesta alternativa no debe buscar primero en el caché ni aplicarse a todas las solicitudes. Una respuesta HTTP `404` o `500` tampoco significa que no haya conexión: `fetch()` resuelve normalmente su promesa cuando el servidor entrega esos estados y, por lo tanto, el bloque `catch` no se ejecuta.

### 6. Registrar el service worker

Abrir `register-sw.js`. La detección de la capacidad y el evento `load` ya se encuentran implementados. Dentro del bloque `try` se debe:

1. Invocar `navigator.serviceWorker.register('./sw.js', { scope: './' })`
2. Esperar el resultado mediante `await` y asignarlo a `registration`
3. Mostrar `registration.scope` en la consola

La ruta del script y el alcance se interpretan desde la carpeta raíz donde se publica la aplicación. En este despliegue, `sw.js` se encuentra en esa carpeta y el alcance solicitado incluye toda la aplicación.

No se deben agregar `skipWaiting()` ni `clients.claim()` al código. Primero se observará el ciclo de vida normal y luego se analizará el efecto de esas operaciones.

### 7. Publicar y diagnosticar la instalación fallida

Crear un nuevo ZIP y publicar la versión que contiene los eventos y el registro implementados. Se debe conservar todavía `APP_SHELL` sin modificaciones.

Abrir `Aplicación` → `Service Workers` y observar la versión que intentó instalarse. También se debe revisar la consola asociada al worker y el panel `Red`. La versión no debe alcanzar el estado `activated`; se debe determinar qué solicitud provocó el rechazo de `cache.addAll(...)`.

Registrar las siguientes observaciones:

1. Estado final de la versión que falló
2. Solicitud que produjo el error y su estado HTTP
3. Resultado de `navigator.serviceWorker.getRegistration()`
4. Resultado de `navigator.serviceWorker.controller`
5. Contenido de `Aplicación` → `Almacenamiento en caché`

La existencia de un registro no implica que exista un worker activo. Una versión cuya instalación falla pasa a `redundant` y no puede controlar clientes.

### 8. Corregir la instalación y observar el primer control

La inspección anterior debe mostrar que `/estado.html` no existe en la publicación. Eliminar esa entrada de `APP_SHELL`, volver a crear el ZIP y publicar nuevamente. Recargar la aplicación con la red habilitada. Si Chrome no busca inmediatamente la nueva versión, utilizar `Actualizar` en `Aplicación` → `Service Workers` o ejecutar en la consola de la página:

```js
const registration = await navigator.serviceWorker.getRegistration();
await registration.update();
```

Comprobar que la versión corregida completa `install` y `activate`. En `Aplicación` → `Almacenamiento en caché`, abrir `restaurants-static-v1` y verificar que contiene los recursos de `APP_SHELL`.

Sin recargar nuevamente, evaluar:

```js
navigator.serviceWorker.controller
```

La página que inició el primer registro puede continuar sin controlador aunque el worker ya se encuentre activado. Recargar una vez y repetir la consulta. La página debe quedar ahora controlada por el worker activo.

Esta diferencia permite distinguir:

- El registro persistente, obtenido mediante `getRegistration()`
- La versión activa, disponible mediante `registration.active`
- El controlador de la pestaña actual, disponible mediante `navigator.serviceWorker.controller`

### 9. Verificar la página para cuando no haya conexión

Con la página controlada, abrir `Aplicación` → `Service Workers`, activar `Sin conexión` y recargar. Debe mostrarse `offline.html` con el texto `Página sin conexión v1`.

Mientras la simulación se encuentra activa, revisar:

1. La navegación fue interceptada por el service worker
2. El intento de `fetch(event.request)` falló por falta de red
3. La respuesta final provino de `Almacenamiento en caché`
4. No se intentó obtener desde el caché cada script, estilo o imagen de la aplicación

Desactivar `Sin conexión` y navegar a una ruta inexistente del mismo origen. El servidor debe mostrar su error normal; no corresponde cargar `offline.html`, porque una respuesta HTTP de error no equivale al rechazo de la promesa de `fetch()`.

Restablecer la URL principal antes de continuar.

### 10. Publicar una segunda versión

Antes de modificar los archivos, abrir una segunda pestaña con la URL de la aplicación. Recargar ambas pestañas y comprobar en cada una que `navigator.serviceWorker.controller` no es `null`. Ambas deben estar controladas por la versión activa.

Preparar la segunda versión mediante exactamente tres modificaciones:

1. En `sw.js`, cambiar `v1` por `v2` en la construcción de `STATIC_CACHE`
2. En `index.html`, cambiar `Interfaz v1` por `Interfaz v2`
3. En `offline.html`, cambiar `Página sin conexión v1` por `Página sin conexión v2`

No se debe modificar `CACHE_PREFIX`. Como `CURRENT_CACHES` se construye utilizando `STATIC_CACHE`, después del cambio contendrá automáticamente el nombre del caché de la segunda versión.

Crear nuevamente el ZIP y publicarlo. En una de las pestañas, mantener abierta la sección `Aplicación` → `Service Workers` y solicitar la comprobación mediante `Actualizar`. Deben observarse simultáneamente:

- La primera versión continúa activa y controla las pestañas existentes
- La segunda versión del service worker completa `install`, pero queda en espera (`installed / waiting`)
- `registration.active` y `registration.waiting` apuntan a versiones diferentes
- `restaurants-static-v2` existe porque la segunda versión ya ejecutó `install`
- `restaurants-static-v1` todavía existe porque la segunda versión aún no ha ejecutado `activate`

Recargar solamente una de las dos pestañas. El documento obtenido desde el servidor puede mostrar `Interfaz v2`, pero `navigator.serviceWorker.controller` continúa identificando al worker anterior. El estado `waiting` evita cambiar el controlador mientras una página sigue abierta, pero no determina qué versión de los archivos entrega el servidor al recargar. Por esta razón, durante una actualización la interfaz, el service worker y la API deben mantener compatibilidad entre las versiones que pueden coincidir.

Una recarga normal no garantiza que termine la espera, porque la pestaña continúa siendo un cliente dentro del alcance. Normalmente, la segunda versión podrá activarse cuando todas las pestañas controladas por la primera se cierren o naveguen fuera del alcance.

### 11. Completar el reemplazo

Anotar primero el estado de `registration.active`, `registration.waiting` y ambos cachés. Luego cerrar las dos pestañas que utilizan la aplicación. Abrir nuevamente la URL y comprobar:

1. La segunda versión se encuentra activa
2. La pestaña que se abre queda controlada por la segunda versión
3. `restaurants-static-v2` permanece disponible
4. `restaurants-static-v1` fue eliminado durante `activate`
5. Al simular nuevamente `Sin conexión`, se muestra `Página sin conexión v2`

Si otra pestaña o ventana de Chrome para escritorio permanece abierta bajo el mismo alcance, la primera versión puede continuar bloqueando la activación. En ese caso se deben cerrar esas páginas y repetir la comprobación.

## Problemas frecuentes

### No aparece un registro

Comprobar que `register-sw.js` se cargue desde `index.html`, que no existan errores en la consola y que la aplicación utilice HTTPS. Revisar que `navigator.serviceWorker.register(...)` reciba la ruta correcta y que su promesa sea esperada dentro del bloque `try`.

### El worker queda en `redundant`

Revisar la consola específica del worker y las solicitudes de `APP_SHELL`. Si una URL entregada a `cache.addAll(...)` no existe o no puede obtenerse, la promesa se rechaza y la instalación asociada mediante `waitUntil(...)` falla.

### La página no queda controlada

Confirmar que el worker se encuentre activado y que la URL de la página pertenezca a `registration.scope`. En el primer registro puede ser necesaria una navegación posterior. No se debe agregar `clients.claim()` solamente para ocultar un problema de ruta o alcance.

### No aparece la página para cuando no haya conexión

Comprobar que la página esté controlada, que `/offline.html` exista en `restaurants-static-v1` o `restaurants-static-v2`, que `Evitar para la red` se encuentre desactivado y que la simulación `Sin conexión` se aplique desde DevTools. Revisar también que el listener llame a `respondWith(...)` para las navegaciones.

### La actualización no queda en `waiting`

Comprobar que `sw.js` cambió efectivamente de contenido, que existen dos pestañas controladas por la primera versión y que `Actualizar cuando se vuelva a cargar` se encuentra desactivado. Utilizar la acción `Actualizar` o `registration.update()` para solicitar explícitamente la comprobación.

### La versión anterior no deja de controlar

Cerrar todas las pestañas y ventanas de Chrome para escritorio que utilicen la aplicación. Una recarga no garantiza que desaparezcan las páginas controladas. Revisar además que no haya quedado abierta otra página dentro del alcance.

### El caché de la versión actual desaparece durante `activate`

Revisar los filtros aplicados a `caches.keys()`. Sólo se deben eliminar nombres que pertenezcan a `CACHE_PREFIX` y que no aparezcan en `CURRENT_CACHES`.
