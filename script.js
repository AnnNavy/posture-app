const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const feedback = document.getElementById('feedback');
const exerciseName = document.getElementById('exercise-name');
const menu = document.getElementById('menu');
const app = document.getElementById('app');

canvas.width = 640;
canvas.height = 480;

let currentExercise = '';
let repCount = 0;
let isDown = false;
let lastMessage = '';
let lastSpeakTime = 0;

// 👉 Iniciar ejercicio desde el menú
function startExercise(type) {
  currentExercise = type;
  repCount = 0;
  isDown = false;

  menu.classList.add('hidden');
  app.classList.remove('hidden');
  exerciseName.textContent = {
    sentadilla: '🦵 Sentadilla',
    pushup: '💪 Push-up (próximamente)',
    plancha: '🧍 Plancha (próximamente)'
  }[type];

  if (!camera.running) camera.start();
}

// 🧠 Calcular ángulo entre 3 puntos
function calcAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);
  if (angle > 180.0) angle = 360 - angle;
  return angle;
}

// 🗣️ Voz de entrenador
function speak(text) {
  const now = Date.now();
  if (text !== lastMessage || now - lastSpeakTime > 3000) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-MX';
    speechSynthesis.speak(utterance);
    lastMessage = text;
    lastSpeakTime = now;
  }
}

// 🧾 Mostrar feedback + voz
function setFeedback(msg, color, voiceMsg = null) {
  feedback.textContent = msg;
  feedback.style.backgroundColor = color;
  if (voiceMsg) speak(voiceMsg);
}

// 👉 Inicializar MediaPipe Pose
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

pose.onResults((results) => {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

  if (results.poseLandmarks && currentExercise === 'sentadilla') {
    drawConnectors(ctx, results.poseLandmarks, Pose.POSE_CONNECTIONS, {
      color: '#0ff',
      lineWidth: 3,
    });
    drawLandmarks(ctx, results.poseLandmarks, { color: '#f0f', radius: 4 });

    const lm = results.poseLandmarks;
    const hip = lm[24];
    const knee = lm[26];
    const ankle = lm[28];
    const shoulder = lm[12];

    const legAngle = calcAngle(hip, knee, ankle);
    const backAngle = calcAngle(shoulder, hip, knee);

    if (backAngle < 165) {
      setFeedback('🚨 Espalda encorvada. ¡Corrige la postura!', 'rgba(255, 0, 0, 0.3)', 'Corrige tu espalda');
    } else {
      if (legAngle < 100) {
        if (!isDown) {
          isDown = true;
          setFeedback('⬇️ Bajando...', 'rgba(255, 255, 0, 0.3)', 'Bajando');
        }
      } else if (legAngle > 140 && isDown) {
        repCount += 1;
        isDown = false;
        setFeedback(`✅ Sentadilla #${repCount}`, 'rgba(0, 255, 100, 0.3)', `Sentadilla número ${repCount}`);
      } else {
        setFeedback('⬆️ Sube completamente para contar', 'rgba(0, 255, 200, 0.2)', null);
      }
    }
  } else if (currentExercise !== 'sentadilla') {
    setFeedback('⚠️ Este ejercicio estará disponible pronto.', 'rgba(0,0,0,0.2)', null);
  } else {
    setFeedback('👀 Esperando postura...', 'rgba(0, 255, 200, 0.2)', null);
  }

  ctx.restore();
});

// 🎥 Cámara
const camera = new Camera(video, {
  onFrame: async () => {
    await pose.send({ image: video });
  },
  width: 640,
  height: 480,
});
