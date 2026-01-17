/*************************************************
 * GLOBAL STATE
 *************************************************/
let keystrokes = [];
let lastTime = null;
let analyzed = false;

const textarea = document.getElementById("typingArea");
const canvas = document.getElementById("typingChart");
const ctx = canvas.getContext("2d");

/*************************************************
 * CANVAS BASELINE (IDLE STATE)
 *************************************************/
function drawBaseline() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}


// Initial baseline
drawBaseline();

/*************************************************
 * KEYSTROKE CAPTURE
 *************************************************/
textarea.addEventListener("keydown", () => {
  if (analyzed) return;

  const now = performance.now();

  if (lastTime !== null) {
    keystrokes.push(now - lastTime);
  }
  lastTime = now;

  document.getElementById("charCount").innerText =
    textarea.value.length + " characters";
});

/*************************************************
 * CLEAR / RESET EVERYTHING
 *************************************************/
function clearInput() {
  textarea.value = "";
  keystrokes = [];
  lastTime = null;
  analyzed = false;

  document.getElementById("charCount").innerText = "0 characters";
  document.getElementById("result").innerText = "Idle";
  document.getElementById("confidenceBox").innerText = "0%";
  document.getElementById("confidencePill").innerText = "0%";
  document.getElementById("methodIndicator").innerText = "Idle";

  // Reset donut (0%)
  const circle = document.getElementById("donut");
  const circumference = 2 * Math.PI * 50;
  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = circumference;

  drawBaseline();
}

/*************************************************
 * DRAW TYPING RHYTHM WAVEFORM
 *************************************************/
function drawWaveform() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (keystrokes.length < 2) {
    drawBaseline();
    return;
  }

  const min = Math.min(...keystrokes);
  const max = Math.max(...keystrokes);
  const range = max - min || 1;

  ctx.strokeStyle = "#F59E0B"; // orange
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();

  keystrokes.forEach((value, index) => {
    const x = (index / (keystrokes.length - 1)) * canvas.width;

    // Normalize latency → smooth small spikes
    const normalized = (value - min) / range;

    // Center line with subtle peaks (like screenshot)
    const centerY = canvas.height / 2;
    const amplitude = 28; // controls spike height
    const y = centerY - normalized * amplitude;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
}


/*************************************************
 * UPDATE DONUT CHART (WITH WHITESPACE)
 *************************************************/
function updateDonut(percent) {
  const circle = document.getElementById("donut");
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const offset = circumference - (percent / 100) * circumference;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset = offset;
}

/*************************************************
 * SEND DATA TO BACKEND
 *************************************************/
function sendData() {
  if (keystrokes.length < 10) {
    alert("Please type at least 10 characters before analyzing.");
    return;
  }

  analyzed = true;

  const total = keystrokes.reduce((a, b) => a + b, 0);
  const avgInterval = total / keystrokes.length;
  const typingSpeed = (keystrokes.length / total) * 1000;
  const pauseCount = keystrokes.filter(v => v > 500).length;

  fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: textarea.value,
      avg_interval: avgInterval,
      pause_count: pauseCount,
      typing_speed: typingSpeed
    })
  })
    .then(res => res.json())
    .then(result => {
      // Emotion + method
      document.getElementById("result").innerText = result.emotion;
      document.getElementById("methodIndicator").innerText = result.method;

      // Confidence
      const percent = Math.round(result.confidence);
      document.getElementById("confidenceBox").innerText = percent + "%";
      document.getElementById("confidencePill").innerText = percent + "%";

      // Donut chart
      updateDonut(percent);

      // Final waveform
      drawWaveform();
    })
    .catch(err => {
      console.error("Error:", err);
      analyzed = false;
    });
}
