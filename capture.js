// Botón de captura estilo Snapchat:
//   - Toque corto  → foto
//   - Mantener presionado → video (hasta MAX_VIDEO_SECONDS)
// Después de capturar se muestra una vista previa con "Guardar" y "Repetir".
// "Guardar" usa el menú de compartir del teléfono (permite "Guardar imagen/video"
// en la galería) y, si no está disponible, descarga el archivo.

const MAX_VIDEO_SECONDS = 15;
const HOLD_MS = 350; // a partir de este tiempo presionado se considera video
const FILE_PREFIX = 'doritos';

export function setupCapture(canvas) {
  const bar = document.getElementById('captureBar');
  const shutter = document.getElementById('shutter');
  const ring = document.getElementById('shutterRing');
  const preview = document.getElementById('preview');
  const previewImg = document.getElementById('previewImg');
  const previewVideo = document.getElementById('previewVideo');
  const saveBtn = document.getElementById('saveBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  const hint = document.getElementById('captureHint');

  const RING_LENGTH = 2 * Math.PI * 46; // radio del círculo de progreso en el SVG
  ring.style.strokeDasharray = RING_LENGTH;
  ring.style.strokeDashoffset = RING_LENGTH;

  let holdTimer = null;
  let recorder = null;
  let chunks = [];
  let recordStart = 0;
  let progressFrame = null;
  let currentFile = null;
  let currentUrl = null;

  bar.hidden = false;

  // ---------- Foto ----------

  function takePhoto() {
    // Se espera al siguiente cuadro para capturar la imagen ya dibujada.
    requestAnimationFrame(() => {
      canvas.toBlob((blob) => {
        if (!blob) return;
        showPreview(new File([blob], `${FILE_PREFIX}-${stamp()}.png`, { type: 'image/png' }));
      }, 'image/png');
    });
  }

  // ---------- Video ----------

  function pickVideoType() {
    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    return types.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
  }

  function startRecording() {
    if (!window.MediaRecorder || !canvas.captureStream) {
      hint.textContent = 'Este navegador no permite grabar video. Toca para tomar foto.';
      return;
    }
    const mimeType = pickVideoType();
    const stream = canvas.captureStream(30);
    chunks = [];
    recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 5_000_000 } : undefined);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = (recorder.mimeType || mimeType || 'video/webm').split(';')[0];
      const ext = type.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type });
      recorder = null;
      if (blob.size) showPreview(new File([blob], `${FILE_PREFIX}-${stamp()}.${ext}`, { type }));
    };
    recorder.start();
    recordStart = performance.now();
    shutter.classList.add('recording');
    updateProgress();
  }

  function updateProgress() {
    if (!recorder) return;
    const elapsed = (performance.now() - recordStart) / 1000;
    const pct = Math.min(elapsed / MAX_VIDEO_SECONDS, 1);
    ring.style.strokeDashoffset = RING_LENGTH * (1 - pct);
    if (pct >= 1) {
      stopRecording();
      return;
    }
    progressFrame = requestAnimationFrame(updateProgress);
  }

  function stopRecording() {
    cancelAnimationFrame(progressFrame);
    shutter.classList.remove('recording');
    ring.style.strokeDashoffset = RING_LENGTH;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  // ---------- Gestos del botón ----------

  shutter.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    shutter.setPointerCapture?.(e.pointerId);
    holdTimer = setTimeout(() => {
      holdTimer = null;
      startRecording();
    }, HOLD_MS);
  });

  const release = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
      takePhoto();
    } else if (recorder) {
      stopRecording();
    }
  };
  shutter.addEventListener('pointerup', release);
  shutter.addEventListener('pointercancel', release);
  shutter.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- Vista previa y guardado ----------

  function showPreview(file) {
    currentFile = file;
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = URL.createObjectURL(file);

    const isVideo = file.type.startsWith('video');
    previewImg.hidden = isVideo;
    previewVideo.hidden = !isVideo;
    if (isVideo) {
      previewVideo.src = currentUrl;
      previewVideo.play().catch(() => {});
    } else {
      previewImg.src = currentUrl;
    }
    bar.hidden = true;
    preview.hidden = false;
  }

  function closePreview() {
    preview.hidden = true;
    bar.hidden = false;
    previewVideo.pause();
    previewVideo.removeAttribute('src');
    previewImg.removeAttribute('src');
  }

  saveBtn.addEventListener('click', async () => {
    if (!currentFile) return;
    // En celulares, el menú de compartir permite guardar directo en la galería.
    if (navigator.canShare && navigator.canShare({ files: [currentFile] })) {
      try {
        await navigator.share({ files: [currentFile] });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // el usuario cerró el menú
      }
    }
    // Alternativa: descarga directa del archivo.
    const a = document.createElement('a');
    a.href = currentUrl;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  retakeBtn.addEventListener('click', closePreview);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
