// Página de PRUEBAS: recibe Lenses enviados desde Lens Studio con
// "Send to Camera Kit" (Push-to-Web), sin publicarlos ni esperar revisión.
// No compartir con el cliente: Snap indica que esta función es solo para desarrollo.

import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';
import { Push2Web } from '@snap/push2web';

import {
  STAGING_API_TOKEN,
  LENS_GROUP_ID,
  LENS_ID,
  LOGIN_KIT_STAGING_CLIENT_ID,
  LOGIN_KIT_REDIRECT_URI,
} from './config.js';

const canvas = document.getElementById('canvas');
const panel = document.getElementById('panel');
const statusText = document.getElementById('statusText');

function setStatus(text, kind = '') {
  statusText.innerHTML = kind ? `<span class="${kind}">${text}</span>` : text;
  console.log('[push2web]', text);
}

window.addEventListener('error', (e) => setStatus('Error: ' + e.message, 'err'));
window.addEventListener('unhandledrejection', (e) =>
  setStatus('Error: ' + (e.reason?.message || e.reason), 'err')
);

// ---------- 1. Login Kit (iniciar sesión con Snapchat) ----------

function loadLoginKit() {
  return new Promise((resolve, reject) => {
    window.snapKitInit = () => resolve(window.snap.loginkit);
    const s = document.createElement('script');
    s.id = 'loginkit-sdk';
    s.async = true;
    s.src = 'https://sdk.snapkit.com/js/v1/login.js';
    s.onerror = () => reject(new Error('No se pudo cargar Login Kit de Snap.'));
    document.head.appendChild(s);
  });
}

// El SDK web de Login Kit entrega el token de acceso tras iniciar sesión.
// Se prueban los nombres de función conocidos; si ninguno existe, se muestran
// en pantalla las funciones disponibles para poder ajustarlo.
async function getAccessToken(loginkit) {
  const candidates = ['getSharedDataAccessToken', 'getAccessToken'];
  for (const name of candidates) {
    if (typeof loginkit[name] === 'function') {
      const result = await loginkit[name]();
      const token = typeof result === 'string' ? result : result?.accessToken || result?.access_token;
      if (token) return token;
    }
  }
  const available = Object.keys(loginkit).join(', ');
  throw new Error('No se encontró el token de Login Kit. Funciones disponibles: ' + available);
}

function mountLogin(loginkit) {
  return new Promise((resolve, reject) => {
    loginkit.mountButton('login', {
      clientId: LOGIN_KIT_STAGING_CLIENT_ID,
      redirectURI: LOGIN_KIT_REDIRECT_URI,
      scopeList: ['user.display_name'],
      handleResponseCallback: async () => {
        try {
          const info = await loginkit.fetchUserInfo();
          const name = info?.data?.me?.displayName || 'tu cuenta';
          setStatus('Sesión iniciada como ' + name + '. Preparando cámara…', 'ok');
          resolve(await getAccessToken(loginkit));
        } catch (err) {
          reject(err);
        }
      },
    });
  });
}

// ---------- 2. Camera Kit + Push-to-Web ----------

async function startCamera(accessToken) {
  const push2Web = new Push2Web();

  push2Web.events.addEventListener('lensReceived', (event) => {
    const { name } = event.detail;
    const time = new Date().toLocaleTimeString();
    setStatus(`Lens recibido desde Lens Studio: "${name}" (${time})`, 'ok');
  });
  push2Web.events.addEventListener('error', (event) => {
    console.error('Push2Web error', event.detail);
    setStatus('Error al aplicar el Lens enviado: ' + (event.detail?.message || 'revisa la consola'), 'err');
  });
  push2Web.events.addEventListener('subscriptionChanged', (event) => {
    console.log('Push2Web subscription', event.detail);
    if (event.detail === 'subscribed') {
      setStatus('Conectado. Envía el Lens desde Lens Studio con "Send to Camera Kit".', 'ok');
    } else {
      setStatus('Estado de conexión: ' + JSON.stringify(event.detail), 'warn');
    }
  });

  // Push-to-Web solo funciona con el token de STAGING.
  const cameraKit = await bootstrapCameraKit(
    { apiToken: STAGING_API_TOKEN },
    (container) => container.provides(push2Web.extension)
  );
  const session = await cameraKit.createSession({ liveRenderTarget: canvas });
  session.events.addEventListener('error', (e) => {
    console.error('Error en el Lens', e.detail);
    setStatus('Error en el Lens: ' + (e.detail?.error?.message || 'revisa la consola'), 'err');
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false,
  });
  const source = createMediaStreamSource(stream, {
    transform: Transform2D.MirrorX,
    cameraType: 'user',
  });
  await session.setSource(source);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    source.setRenderSize(
      Math.round(window.innerWidth * dpr),
      Math.round(window.innerHeight * dpr)
    );
  };
  resize();
  window.addEventListener('resize', resize);

  // Mientras llega un Lens desde Lens Studio, se muestra la versión publicada.
  try {
    const lens = await cameraKit.lensRepository.loadLens(LENS_ID, LENS_GROUP_ID);
    await session.applyLens(lens);
  } catch (err) {
    console.warn('No se pudo cargar el Lens publicado', err);
  }
  await session.play();

  push2Web.subscribe(accessToken, session, cameraKit.lensRepository);
  setStatus('Conectando con Lens Studio…', 'warn');
}

// ---------- Inicio ----------

(async () => {
  try {
    if (LOGIN_KIT_STAGING_CLIENT_ID.startsWith('PEGA_AQUI')) {
      throw new Error('Falta el Staging OAuth Client ID de Login Kit en config.js');
    }
    setStatus('Inicia sesión con Snapchat para empezar.');
    const loginkit = await loadLoginKit();
    const token = await mountLogin(loginkit);
    panel.hidden = true;
    await startCamera(token);
  } catch (err) {
    console.error(err);
    setStatus(err?.message || String(err), 'err');
  }
})();
