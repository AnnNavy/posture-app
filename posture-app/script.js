// script.js
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');

navigator.mediaDevices.getUserMedia({
  video: true
}).then((stream) => {
  videoElement.srcObject = stream;
});

const pose = new Pose.Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

pose.onResults((results) => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.poseLandmarks) {
    drawConnectors(canvasCtx, results.poseLandmarks, Pose.POSE_CONNECTIONS, { color: '#0ff' });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#f0f', radius: 4 });
  }
  canvasCtx.restore();
});

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: 640,
  height: 480
});
camera.start();
