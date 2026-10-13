import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';

// ===== Configuración =====
// Cambia a true cuando Snap apruebe la app y pega el token de Production abajo.
const USE_PRODUCTION = false;

const STAGING_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzkxOTA3ODM3LCJzdWIiOiI4ZDgwYjMxNS1iNjk1LTRkMGEtYjM3NC0xYjc5NjlmYTUwYTl-U1RBR0lOR34zMzY2ZDE2NC02NjgzLTRmMDktYmZhOS0yOTBhMWVmMmJmYzEifQ.NcHagxB6aa_vf3LnIS1nNMbH2zi5HsATd32se8oqKDg';
const PRODUCTION_API_TOKEN = 'PEGA_AQUI_EL_TOKEN_DE_PRODUCTION';

const LENS_GROUP_ID = 'b22f656b-6703-4d84-bffb-de04b99f8f6e';
const LENS_ID = '4724530d-4b41-4868-a856-7b5c3f4f5deb';
// =========================

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
