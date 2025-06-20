const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const feedback = document.getElementById('feedback');

// Ajusta el tamaño del canvas al del video
canvas.width = 640;
canvas.height = 480;

// Inicia la cámara
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  video.srcObject = stream;
});

// Configurar MediaPipe Pose
const pose = new Pose.Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

// Función para calcular ángulo entre 3 puntos
function calcAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

// Procesamiento de resultados
pose.onResults((results) => {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks) {
    drawConnectors(ctx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
      color: '#0ff',
      lineWidth: 3,
    });
    drawLandmarks(ctx, results.poseLandmarks, {
      color: '#f0f',
      radius: 4,
    });

    // Detectar si está en postura de sentadilla
    const lm = results.poseLandmarks;

    // Tomamos los puntos de cadera, rodilla y tobillo derechos
    const hip = lm[24];
    const knee = lm[26];
    const ankle = lm[28];

    const angle = calcAngle(hip, knee, ankle);

    if (angle < 100) {
      feedback.textContent = '✅ Buena flexión de pierna (¡sentadilla bien hecha!)';
      feedback.style.backgroundColor = 'rgba(0, 255, 100, 0.2)';
    } else {
      feedback.textContent = '⚠️ Baja más en la sentadilla';
      feedback.style.backgroundColor = 'rgba(255, 100, 0, 0.2)';
    }
  } else {
    feedback.textContent = '👀 Esperando postura...';
    feedback.style.backgroundColor = 'rgba(0, 255, 200, 0.2)';
  }

  ctx.restore();
});

// Iniciar cámara y pasar frames a MediaPipe
const camera = new Camera(video, {
  onFrame: async () => {
    await pose.send({ image: video });
  },
  width: 640,
  height: 480,
});
camera.start();
