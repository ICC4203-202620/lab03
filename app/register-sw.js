if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // TODO: Actividad 6 - Registrar ./sw.js con alcance ./ y esperar el
      // resultado de la operación.
      const registration = null;

      // TODO: Actividad 6 - Mostrar en consola el alcance del registro.
    } catch (error) {
      console.error('No fue posible registrar el service worker', error);
    }
  });
}
