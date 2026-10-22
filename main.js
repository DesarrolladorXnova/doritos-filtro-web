import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';

import {
  USE_PRODUCTION,
  STAGING_API_TOKEN,
  PRODUCTION_API_TOKEN,
  LENS_GROUP_ID,
  LENS_ID,
} from './config.js';
import { setupCapture } from './capture.js';

// Los tokens e IDs se editan en config.js

const API_TOKEN = USE_PRODUCTION ? PRODUCTION_API_TOKEN : STAGING_API_TOKEN;

const canvas = document.getElementById('canvas');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('start');
const msg = document.getElementById('msg');

let source;

function resize() {
  if (!source) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  source.setRenderSize(
    Math.round(window.innerWidth * dpr),
    Math.round(window.innerHeight * dpr)
  );
}

async function start() {
  startBtn.disabled = true;

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Este navegador no permite usar la cámara. Abre la página con HTTPS en Chrome o Safari.');
    }

    msg.textContent = 'Iniciando Camera Kit…';
    const cameraKit = await bootstrapCameraKit({ apiToken: API_TOKEN });
    const session = await cameraKit.createSession({ liveRenderTarget: canvas });
    session.events.addEventListener('error', (e) => {
      console.error('Error en el Lens:', e.detail);
      msg.textContent = 'Error en el Lens: ' + (e.detail?.error?.message || e.detail);
    });

    msg.textContent = 'Pidiendo permiso de cámara…';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });

    source = createMediaStreamSource(stream, {
      transform: Transform2D.MirrorX,
      cameraType: 'user',
    });
    await session.setSource(source);
    resize();
    window.addEventListener('resize', resize);

    msg.textContent = 'Cargando el efecto…';
    const lens = await cameraKit.lensRepository.loadLens(LENS_ID, LENS_GROUP_ID);
    await session.applyLens(lens);
    await session.play();

    overlay.hidden = true;
    setupCapture(canvas);
  } catch (err) {
    console.error(err);
    if (err?.name === 'NotAllowedError') {
      msg.textContent = 'Necesitamos permiso para usar la cámara. Revisa los permisos del navegador e inténtalo de nuevo.';
    } else {
      msg.textContent = 'No se pudo iniciar: ' + (err?.message || err);
    }
    startBtn.disabled = false;
  }
}

startBtn.addEventListener('click', start);
