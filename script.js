// Ensure manual scroll restoration so unlocking starts cleanly at the top
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Disable zoom completely on mobile devices (Pinch-to-zoom & Double-tap zoom)
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

document.addEventListener('touchstart', (e) => {
  if (e.touches && e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

let lastTouchEndGlobal = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEndGlobal <= 300) {
    e.preventDefault();
  }
  lastTouchEndGlobal = now;
}, { passive: false });


// ==========================================
// 3. Falling 3D Rose Petals Engine (بارش سه‌بعدی و شناور گلبرگ‌های رز و قلب)
// ==========================================
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');

let petals = [];
let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);
let wind = 0;
let targetWind = 0;

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

window.addEventListener('pointermove', (e) => {
  const normX = (e.clientX / width) - 0.5;
  targetWind = normX * 1.5;
});

const petalColors = [
  '#ff4d80',
  '#e91e63',
  '#ff7597',
  '#ff5252',
  '#ad1457',
  '#ffa4b6'
];

class RosePetal3D {
  constructor(initial = false) {
    this.reset(initial);
  }

  reset(initial = false) {
    this.x = Math.random() * width;
    this.y = initial ? Math.random() * height : -40;
    this.z = Math.random() * 400; // 3D depth layer
    this.size = Math.random() * 12 + 10;
    this.speedY = Math.random() * 0.9 + 0.6;
    this.swaySpeed = Math.random() * 0.025 + 0.01;
    this.phase = Math.random() * Math.PI * 2;

    // 3D Rotational tumbling
    this.rotX = Math.random() * Math.PI * 2;
    this.rotY = Math.random() * Math.PI * 2;
    this.rotZ = Math.random() * Math.PI * 2;
    this.vRotX = (Math.random() - 0.5) * 0.025;
    this.vRotY = (Math.random() - 0.5) * 0.025;
    this.vRotZ = (Math.random() - 0.5) * 0.02;

    this.alpha = Math.random() * 0.35 + 0.45;
    this.isHeart = Math.random() > 0.72; // mix of floating glowing micro-hearts & rose petals
    this.color = petalColors[Math.floor(Math.random() * petalColors.length)];
  }

  update() {
    this.y += this.speedY;
    this.x += Math.sin(this.phase) * 1.1 + wind;
    this.phase += this.swaySpeed;

    this.rotX += this.vRotX;
    this.rotY += this.vRotY;
    this.rotZ += this.vRotZ;

    if (this.y > height + 50 || this.x < -60 || this.x > width + 60) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 3D Perspective Projection
    const perspective = 500;
    const scale = perspective / (perspective + this.z);
    ctx.scale(scale, scale);

    // 3D Tumbling simulation
    ctx.rotate(this.rotZ);
    const scale3dX = Math.cos(this.rotY);
    const scale3dY = Math.cos(this.rotX);
    ctx.scale(scale3dX, scale3dY);

    ctx.globalAlpha = this.alpha * scale;
    ctx.fillStyle = this.color;

    if (this.isHeart) {
      ctx.beginPath();
      const topH = this.size * 0.3;
      ctx.moveTo(0, topH);
      ctx.bezierCurveTo(0, 0, -this.size / 2, 0, -this.size / 2, topH);
      ctx.bezierCurveTo(-this.size / 2, (this.size + topH) / 2, 0, (this.size + topH) / 1.5, 0, this.size);
      ctx.bezierCurveTo(0, (this.size + topH) / 1.5, this.size / 2, (this.size + topH) / 2, this.size / 2, topH);
      ctx.bezierCurveTo(this.size / 2, 0, 0, 0, 0, topH);
      ctx.closePath();
      ctx.fill();
    } else {
      // Fast lightweight organic rose petal
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 0.85);
      ctx.bezierCurveTo(this.size * 0.75, -this.size * 0.6, this.size * 0.95, this.size * 0.35, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.95, this.size * 0.35, -this.size * 0.75, -this.size * 0.6, 0, -this.size * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}

// 22 particles for silk-smooth 60fps performance on all devices
for (let i = 0; i < 22; i++) {
  petals.push(new RosePetal3D(true));
}

function animateParticles() {
  ctx.clearRect(0, 0, width, height);
  wind += (targetWind - wind) * 0.05;

  for (let i = 0; i < petals.length; i++) {
    petals[i].update();
    petals[i].draw();
  }
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ==========================================
// Web Audio API Synthesizer (Lofi Music Box)
// ==========================================
let audioCtx = null;
let isPlaying = false;
let melodyInterval = null;
let customAudio = null;

const chords = [
  [349.23, 440.00, 523.25, 659.25], // Fmaj7
  [329.63, 392.00, 493.88, 587.33], // Em7
  [293.66, 349.23, 440.00, 523.25], // Dm7
  [261.63, 329.63, 392.00, 493.88], // Cmaj7
];
let chordIndex = 0;

function playTone(freq, time, duration = 1.4) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, time);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.exponentialRampToValueAtTime(0.08, time + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(time);
  osc.stop(time + duration);
}

function playChordArpeggio() {
  if (!isPlaying || !audioCtx) return;
  const now = audioCtx.currentTime;
  const chord = chords[chordIndex % chords.length];
  chordIndex++;

  chord.forEach((freq, idx) => {
    playTone(freq, now + idx * 0.28, 1.8);
  });
}

// Default Background Track: "Khooneye Man"
const bgAudio = new Audio(encodeURI('Music/Khooneye Man.mp3'));
bgAudio.loop = true;

function toggleAudio() {
  if (bgAudio.paused) {
    bgAudio.play().then(() => {
      isPlaying = true;
      setAudioPlayingState(true);
    }).catch(e => {
      // Fallback synthesizer if direct audio playback is restricted
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      isPlaying = true;
      setAudioPlayingState(true);
      playChordArpeggio();
      if (!melodyInterval) melodyInterval = setInterval(playChordArpeggio, 2200);
    });
  } else {
    bgAudio.pause();
    isPlaying = false;
    if (melodyInterval) {
      clearInterval(melodyInterval);
      melodyInterval = null;
    }
    setAudioPlayingState(false);
  }
}

function setAudioPlayingState(playing) {
  const soundWave = document.getElementById('sound-wave');
  const musicLabel = document.getElementById('music-label');
  const musicIcon = document.getElementById('music-icon');
  const miniVinyl = document.getElementById('mini-vinyl');
  const miniTonearm = document.getElementById('mini-tonearm');

  if (playing) {
    if (soundWave) soundWave.classList.add('playing');
    if (musicLabel) musicLabel.textContent = 'خونه من (در حال پخش)';
    if (musicIcon) musicIcon.textContent = '⏸️';
    if (miniVinyl) miniVinyl.classList.add('is-spinning');
    if (miniTonearm) miniTonearm.classList.add('is-playing');
  } else {
    if (soundWave) soundWave.classList.remove('playing');
    if (musicLabel) musicLabel.textContent = 'پخش آهنگ خونه من';
    if (musicIcon) musicIcon.textContent = '🎵';
    if (miniVinyl) miniVinyl.classList.remove('is-spinning');
    if (miniTonearm) miniTonearm.classList.remove('is-playing');
  }

  // Sync Retro Vinyl Turntable Player (if present)
  const vinylDisc = document.getElementById('vinyl-disc');
  const tonearm = document.getElementById('tonearm-assembly');
  const strobeDot = document.getElementById('strobe-dot');
  const vinylSoundWaves = document.getElementById('vinyl-sound-waves');
  const trackStatusPill = document.getElementById('track-status-pill');
  const vinylStatusText = document.getElementById('vinyl-status-text');
  const vinylBtnIcon = document.getElementById('vinyl-btn-icon');
  const vinylBtnText = document.getElementById('vinyl-btn-text');

  if (vinylDisc) {
    if (playing) {
      vinylDisc.classList.add('is-spinning');
      if (tonearm) tonearm.classList.add('is-playing');
      if (strobeDot) strobeDot.classList.add('is-active');
      if (vinylSoundWaves) vinylSoundWaves.classList.add('active');
      if (trackStatusPill) trackStatusPill.classList.add('playing');
      if (vinylStatusText) vinylStatusText.textContent = 'در حال نواختن با گرامافون';
      if (vinylBtnIcon) vinylBtnIcon.textContent = '⏸';
      if (vinylBtnText) vinylBtnText.textContent = 'توقف صفحه گرامافون';
    } else {
      vinylDisc.classList.remove('is-spinning');
      if (tonearm) tonearm.classList.remove('is-playing');
      if (strobeDot) strobeDot.classList.remove('is-active');
      if (vinylSoundWaves) vinylSoundWaves.classList.remove('active');
      if (trackStatusPill) trackStatusPill.classList.remove('playing');
      if (vinylStatusText) vinylStatusText.textContent = 'آماده پخش';
      if (vinylBtnIcon) vinylBtnIcon.textContent = '▶';
      if (vinylBtnText) vinylBtnText.textContent = 'شروع چرخش گرامافون';
    }
  }
}

const audioToggleBtn = document.getElementById('audio-toggle-btn');
if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleAudio);

const miniTurntable = document.getElementById('mini-turntable');
if (miniTurntable) {
  miniTurntable.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudio();
  });
}

// Retro Vinyl Player Controls Integration (if present)
const vinylPlayBtn = document.getElementById('vinyl-play-btn');
const vinylDisc = document.getElementById('vinyl-disc');
const tonearmAssembly = document.getElementById('tonearm-assembly');
const vinylUploadBtn = document.getElementById('vinyl-upload-btn');
const vinylTrackName = document.getElementById('vinyl-track-name');

if (vinylPlayBtn) vinylPlayBtn.addEventListener('click', toggleAudio);
if (vinylDisc) vinylDisc.addEventListener('click', toggleAudio);
if (tonearmAssembly) tonearmAssembly.addEventListener('click', toggleAudio);

// Custom audio upload support (safely guarded if elements exist)
const customMusicBtn = document.getElementById('custom-music-btn');
const customAudioInput = document.getElementById('custom-audio-input');

if (customMusicBtn && customAudioInput) {
  customMusicBtn.addEventListener('click', () => {
    customAudioInput.click();
  });
}

if (vinylUploadBtn && customAudioInput) {
  vinylUploadBtn.addEventListener('click', () => {
    customAudioInput.click();
  });
}

if (customAudioInput) {
  customAudioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (melodyInterval) clearInterval(melodyInterval);
      isPlaying = false;

      if (customAudio) {
        customAudio.pause();
      }
      const url = URL.createObjectURL(file);
      customAudio = new Audio(url);
      customAudio.loop = true;
      customAudio.play();
      setAudioPlayingState(true);
      if (customMusicBtn) customMusicBtn.textContent = '🎵 آهنگ شما تنظیم شد';
      if (vinylTrackName) vinylTrackName.textContent = file.name.replace(/\.[^/.]+$/, "");
    }
  });
}

// ==========================================
// Interactive 3D Envelope & Letter with Typewriter Pen Stroke
// ==========================================
const envelopeContainer = document.getElementById('envelope-container');
const letterEnvelope = document.getElementById('letter-envelope');
const letterPaper = document.getElementById('letter-paper');
const closeLetterBtn = document.getElementById('close-letter-btn');
const skipTypewriterBtn = document.getElementById('skip-typewriter-btn');
const replayTypewriterBtn = document.getElementById('replay-typewriter-btn');
const handwritingPen = document.getElementById('handwriting-pen-cursor');

let typewriterRunning = false;
let typewriterTimeouts = [];

const cachedLetterTexts = {
  heading: 'مبینای قشنگم، سلام...',
  p1: 'می‌دونم دلت چقدر گرفته و چقدر از این دلخوری‌ها و فاصله‌ها خسته‌ای. می‌دونم شاید با خودت بگی زمان و فرصت‌هام هدر رفت و از اینکه دوباره حالت بد بشه می‌ترسی. من بابت تمام اشتباهام از صمیم قلبم معذرت می‌خوام؛ ولی اگه بگم تورو از خودم بیشتر دوست دارم ذره‌ای دروغ نگفتم. تمام اون سختی‌ها فقط وقتی معنی هدر رفتن می‌ده که این عشق به ثمر نرسه... ولی من تمام وجودم بسیج شده که این رابطه رو به قشنگ‌ترین مقصدش برسونم.',
  p2: 'به جون عزیزترین کسم قسم می‌خورم که نگاه من به تو و این رابطه با همیشه فرق داره؛ من دیگه اصلاً به چشم یک دوستی ساده بهت نگاه نمی‌کنم، من تورو برای کل زندگی و آینده‌م می‌خوام و تا آخر عمرم می‌خوام کنارت نفس بکشم. هر مشکلی که سر راهمون باشه — از خانواده و مادرت تا فاطمه و تک‌تک دغدغه‌هات — خودم پشتتم و مثل کوه همه‌چیز رو حل می‌کنم. مبینا، من حتی نسبت به اسفند هم عوض شدم و حاضر به هر کاری هستم که فقط اعتماد دوباره‌ت رو به دست بیارم.',
  p3: 'همون‌طوری که خودم ناخواسته باعث این حس‌های تلخ شدم، فقط و فقط خودم می‌تونم مرهم این دل شکسته‌ت باشم و تمومش رو از ذهنت پاک کنم. ازت نمی‌خوام فقط رو حرف قبول کنی یا از فردا همه‌چیز مثل قبل بشه؛ فقط بهم نگو دیره... یک کلام نگو نه. فقط یک راه باریک بهم بده که دوباره منو بشناسی و سبک‌سنگین کنی تا با تک‌تک سلول‌های بدنم بهت ثابت کنم که این پارسا، تورو روی سرش می‌ذاره و هیچ‌چیز توی این دنیا دیگه نمی‌تونه ما رو از هم جدا کنه... تا همیشه عاشقتم. ❤️'
};

function clearTypewriterTimeouts() {
  typewriterTimeouts.forEach(t => clearTimeout(t));
  typewriterTimeouts = [];
  typewriterRunning = false;
}

function runTypewriterEffect() {
  const headingEl = document.getElementById('letter-heading');
  const p1El = document.getElementById('letter-body-p1');
  const p2El = document.getElementById('letter-body-p2');
  const p3El = document.getElementById('letter-body-p3');

  if (!headingEl || !p1El || !p2El || !p3El) return;

  clearTypewriterTimeouts();
  typewriterRunning = true;

  if (handwritingPen) {
    handwritingPen.style.display = 'block';
  }

  headingEl.innerHTML = '';
  p1El.innerHTML = '';
  p2El.innerHTML = '';
  p3El.innerHTML = '';

  const parts = [
    { el: headingEl, text: cachedLetterTexts.heading, delay: 35 },
    { el: p1El, text: cachedLetterTexts.p1, delay: 18 },
    { el: p2El, text: cachedLetterTexts.p2, delay: 18 },
    { el: p3El, text: cachedLetterTexts.p3, delay: 18 }
  ];

  let partIndex = 0;
  let charIndex = 0;

  function typeNext() {
    if (!typewriterRunning) return;

    if (partIndex >= parts.length) {
      if (handwritingPen) handwritingPen.style.display = 'none';
      typewriterRunning = false;
      return;
    }

    const currentPart = parts[partIndex];
    charIndex += 2;

    if (charIndex > currentPart.text.length) {
      currentPart.el.innerHTML = currentPart.text;
      partIndex++;
      charIndex = 0;
      typewriterTimeouts.push(setTimeout(typeNext, 250));
      return;
    }

    currentPart.el.innerHTML = currentPart.text.substring(0, charIndex) + '<span class="char-fade">|</span>';

    if (handwritingPen && currentPart.el) {
      handwritingPen.style.top = `${currentPart.el.offsetTop + currentPart.el.offsetHeight - 5}px`;
      handwritingPen.style.right = '10px';
    }

    if (audioCtx && Math.random() > 0.65) {
      playTone(750 + Math.random() * 200, audioCtx.currentTime, 0.02);
    }

    typewriterTimeouts.push(setTimeout(typeNext, currentPart.delay));
  }

  typewriterTimeouts.push(setTimeout(typeNext, 500));
}

function skipTypewriter() {
  clearTypewriterTimeouts();
  const headingEl = document.getElementById('letter-heading');
  const p1El = document.getElementById('letter-body-p1');
  const p2El = document.getElementById('letter-body-p2');
  const p3El = document.getElementById('letter-body-p3');

  if (headingEl) headingEl.innerHTML = cachedLetterTexts.heading;
  if (p1El) p1El.innerHTML = cachedLetterTexts.p1;
  if (p2El) p2El.innerHTML = cachedLetterTexts.p2;
  if (p3El) p3El.innerHTML = cachedLetterTexts.p3;
  if (handwritingPen) handwritingPen.style.display = 'none';
}

if (skipTypewriterBtn) skipTypewriterBtn.addEventListener('click', skipTypewriter);
if (replayTypewriterBtn) replayTypewriterBtn.addEventListener('click', runTypewriterEffect);

function openLetter() {
  if (!envelopeContainer) return;
  if (envelopeContainer.classList.contains('is-open')) return;

  envelopeContainer.classList.add('is-open');

  // Romantic acoustic chimes
  if (audioCtx) {
    const now = audioCtx.currentTime;
    playTone(523.25, now, 0.35);        // C5
    playTone(659.25, now + 0.12, 0.4);  // E5
    playTone(783.99, now + 0.24, 0.45); // G5
    playTone(1046.50, now + 0.36, 0.7); // C6
  }

  if (navigator.vibrate) {
    try { navigator.vibrate([30, 40, 30]); } catch (e) {}
  }

  setTimeout(() => {
    if (letterPaper) {
      letterPaper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      runTypewriterEffect();
    }
  }, 400);
}

function closeLetter(e) {
  if (e) e.stopPropagation();
  if (!envelopeContainer) return;

  envelopeContainer.classList.remove('is-open');
  clearTypewriterTimeouts();
  if (handwritingPen) handwritingPen.style.display = 'none';

  if (audioCtx) {
    const now = audioCtx.currentTime;
    playTone(659.25, now, 0.2);
    playTone(523.25, now + 0.1, 0.25);
  }

  if (letterEnvelope) {
    letterEnvelope.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

if (letterEnvelope) {
  letterEnvelope.addEventListener('click', openLetter);
}

if (closeLetterBtn) {
  closeLetterBtn.addEventListener('click', closeLetter);
}

// ==========================================
// Coupons Redemption
// ==========================================
const coupons = document.querySelectorAll('.coupon-card');

coupons.forEach((coupon) => {
  const btn = coupon.querySelector('.redeem-btn');
  btn.addEventListener('click', () => {
    coupon.classList.add('redeemed');
    btn.textContent = 'فعال شد! تا همیشه معتبره ✨';
    btn.disabled = true;

    // Small celebratory confetti burst around the coupon
    burstMiniConfetti(coupon);
  });
});

// ==========================================
// Super Runaway "No" Button & Growing "Yes" Button
// ==========================================
const noBtn = document.getElementById('no-btn');
const yesBtn = document.getElementById('yes-btn');
const buttonsArea = document.getElementById('buttons-area');
const questionContainer = document.querySelector('.question-container');
const hintCaption = document.getElementById('hint-caption');
const questionEmoji = document.getElementById('question-emoji');

const evasiveTexts = [
  'نه هنوز ناراحتم 😤',
  'عه! جاخالییی! 🏃‍♂️💨',
  'نمی‌تونی بگیریم! 😜',
  'مطمئنی؟ 🥺',
  'دستت لرزید انگار! 😂',
  'یه فرصت دیگه بده! 🙏',
  'دلت میاد آخه؟ 💔',
  'باشه اصلاً نوتلا با من 🍫',
  'قول می‌دم خیلی مهربون باشم 🥹',
  'راه نداره واقعا؟ 🙈',
  'این دکمه خرابه انگار! 😂',
  'پیتزا و بستنی باهم مهمون من 🍕🍦',
  'زور نزن، کلیک‌شدنی نیست! 🏃‍♀️',
  'فکراتو بکن باز... 🧐',
  'بخشیدی دیگه؟ دکمه صورتیه رو بزن! 👇💖',
  'تسلیم شو دیگه مهربونم! 🥺❤️'
];

const emojis = ['🥺', '😢', '🙈', '🧁', '💔', '🌹', '🙏', '🕊️', '🏃‍♂️', '🍫'];

let evadeCount = 0;
let yesScale = 1;
let lastMoveTime = 0;

function moveNoButton(pointerX, pointerY) {
  const now = Date.now();
  if (now - lastMoveTime < 60) return; // small debounce to prevent frame spam
  lastMoveTime = now;

  evadeCount++;
  const nextText = evasiveTexts[evadeCount % evasiveTexts.length];
  noBtn.textContent = nextText;
  questionEmoji.textContent = emojis[evadeCount % emojis.length];

  // Mobile haptic feedback
  if (navigator.vibrate) {
    try { navigator.vibrate(35); } catch(e) {}
  }

  // Play a cheeky squeak sound
  if (audioCtx && isPlaying) {
    playTone(700 + Math.random() * 350, audioCtx.currentTime, 0.08);
  }

  // Make Yes button bigger, shinier, and more tempting
  yesScale += 0.12;
  if (yesScale > 2.4) yesScale = 2.4;
  yesBtn.style.transform = `scale(${yesScale})`;
  yesBtn.style.boxShadow = `0 15px ${35 + evadeCount * 2}px rgba(255, 77, 128, 0.8)`;

  // Calculate boundary within buttonsArea
  const areaRect = buttonsArea.getBoundingClientRect();
  const btnRect = noBtn.getBoundingClientRect();

  const maxX = Math.max(20, areaRect.width - btnRect.width - 25);
  const maxY = Math.max(20, areaRect.height - btnRect.height - 20);

  // Position relative to buttonsArea
  noBtn.style.position = 'absolute';

  let randomX, randomY;
  let attempts = 0;

  do {
    randomX = Math.floor(Math.random() * maxX) + 12;
    randomY = Math.floor(Math.random() * maxY) + 10;
    attempts++;

    if (pointerX !== undefined && pointerY !== undefined) {
      // Check absolute distance from pointer to proposed new center
      const proposedAbsX = areaRect.left + randomX + btnRect.width / 2;
      const proposedAbsY = areaRect.top + randomY + btnRect.height / 2;
      const dist = Math.hypot(proposedAbsX - pointerX, proposedAbsY - pointerY);
      if (dist > 130 || attempts > 10) break;
    } else {
      break;
    }
  } while (attempts < 15);

  noBtn.style.left = `${randomX}px`;
  noBtn.style.top = `${randomY}px`;

  // Playful tilt angle
  const randomAngle = (Math.random() * 24 - 12).toFixed(1);
  noBtn.style.transform = `rotate(${randomAngle}deg)`;

  hintCaption.textContent = `(دکمه نه ${evadeCount} بار فرار کرد! فقط دکمه بخشیدن کار می‌کنه 😉)`;
}

// Proximity detection: Evade BEFORE the finger or cursor even touches the button!
function handleProximityCheck(e) {
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  if (clientX === undefined || clientY === undefined) return;

  const btnRect = noBtn.getBoundingClientRect();
  const btnCenterX = btnRect.left + btnRect.width / 2;
  const btnCenterY = btnRect.top + btnRect.height / 2;

  const dist = Math.hypot(btnCenterX - clientX, btnCenterY - clientY);

  // Trigger escape if pointer gets within 110px!
  if (dist < 110) {
    moveNoButton(clientX, clientY);
  }
}

// Global touch & mouse trackers over question section
if (questionContainer) {
  questionContainer.addEventListener('mousemove', handleProximityCheck, { passive: true });
  questionContainer.addEventListener('touchmove', handleProximityCheck, { passive: true });
}

// Direct button event protections (impossible to click!)
['pointerenter', 'pointerdown', 'mouseenter', 'touchstart', 'mousedown', 'click'].forEach((evt) => {
  noBtn.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    moveNoButton(x, y);
  });
});

// ==========================================
// 1. Live Relationship Timer (از ۲۳ سپتامبر ۲۰۲۳ / ۱ مهر ۱۴۰۲)
// ==========================================
const startDate = new Date('2023-09-23T00:00:00');

function updateLoveTimer() {
  const now = new Date();
  const diff = now - startDate;

  if (diff <= 0) return;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minutesEl = document.getElementById('timer-minutes');
  const secondsEl = document.getElementById('timer-seconds');

  if (daysEl) daysEl.textContent = days.toLocaleString('fa-IR');
  if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
  if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
  if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
}

setInterval(updateLoveTimer, 1000);
updateLoveTimer();


// ==========================================
// 3. Sweet Jar of Notes (مورد ۴: شیشه اعتراف‌ها)
// ==========================================
const sweetNotes = [
  'می‌دونستی هروقت نگام می‌کنی، یادم میره چی می‌خواستم بگم؟ خنده‌هات قشنگ‌ترین معجزه زندگی منه.',
  'قول می‌دم بیشتر از قبل به حرفات گوش بدم، هواتو داشته باشم و نذارم هیچ‌وقت دلت بگیره.',
  'لبخند تو، تنها چیزیه که می‌تونه یه روز پر از خستگی رو برای من بهشت کنه.',
  'ببخشید اگه گاهی بلد نبودم چطور حسم رو نشون بدم، ولی بدون که اندازه تمام دنیا دوستت دارم مبینا.',
  'هیچ بحث، دلخوری یا سوءتفاهمی نمی‌تونه جایگاه تو رو توی قلبم حتی یه ذره کم کنه.',
  'تو امن‌ترین و قشنگ‌ترین پناهگاه دنیایی برای من... هرلحظه کنار تو بودن یه نعمته.',
  'من فقط وقتی تو پیشمی و نگاهم می‌کنی احساس کامل بودن و آرامش واقعی می‌کنم.',
  'یه اعتراف کوچیک: از ۲۳ سپتامبر ۲۰۲۳ (۱ مهر ۱۴۰۲) تا امروز، هر روز بیشتر از دیروز عاشقت شدم ❤️'
];

let currentNoteIdx = 0;
const drawNoteBtn = document.getElementById('draw-note-btn');
const openedNoteDisplay = document.getElementById('opened-note-display');
const noteTextContent = document.getElementById('note-text-content');
const noteCounter = document.getElementById('note-counter');

if (drawNoteBtn) {
  drawNoteBtn.addEventListener('click', () => {
    currentNoteIdx = (currentNoteIdx + 1) % sweetNotes.length;
    noteTextContent.textContent = sweetNotes[currentNoteIdx];
    noteCounter.textContent = `یادداشت ${currentNoteIdx + 1} از ${sweetNotes.length}`;

    // Play chime sound
    if (audioCtx) {
      const now = audioCtx.currentTime;
      playTone(523.25, now, 0.15);
      playTone(659.25, now + 0.08, 0.25);
    }

    // Mini animation
    openedNoteDisplay.style.animation = 'none';
    openedNoteDisplay.offsetHeight; // trigger reflow
    openedNoteDisplay.style.animation = 'notePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    burstMiniConfetti(drawNoteBtn);
  });
}

// ==========================================
// 4. "Yes" Button & Peace Treaty Modal (مورد ۳)
// ==========================================
const peaceTreatyModal = document.getElementById('peace-treaty-modal');
const closeTreatyBtn = document.getElementById('close-treaty-btn');

yesBtn.addEventListener('click', () => {
  launchFullConfetti();

  // Play happy victory chords
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx) {
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      playTone(freq, now + i * 0.12, 1.4);
    });
  }

  setTimeout(() => {
    peaceTreatyModal.classList.add('active');
    initSignatureCanvas();
  }, 400);
});

closeTreatyBtn.addEventListener('click', () => {
  peaceTreatyModal.classList.remove('active');
});

// ==========================================
// 5. Digital Signature Pad on Treaty Canvas
// ==========================================
const sigCanvas = document.getElementById('signature-canvas');
let sigCtx = null;
let isDrawing = false;
let hasSigned = false;

function initSignatureCanvas() {
  if (!sigCanvas) return;
  sigCtx = sigCanvas.getContext('2d');

  // Set display resolution matching CSS
  const rect = sigCanvas.getBoundingClientRect();
  sigCanvas.width = rect.width || 360;
  sigCanvas.height = rect.height || 130;

  sigCtx.strokeStyle = '#8c2a10';
  sigCtx.lineWidth = 2.8;
  sigCtx.lineCap = 'round';
  sigCtx.lineJoin = 'round';

  function getPos(e) {
    const r = sigCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - r.left,
      y: clientY - r.top
    };
  }

  function start(e) {
    e.preventDefault();
    isDrawing = true;
    hasSigned = true;
    const pos = getPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
  }

  function stop() {
    isDrawing = false;
  }

  sigCanvas.addEventListener('mousedown', start);
  sigCanvas.addEventListener('mousemove', draw);
  window.addEventListener('mouseup', stop);

  sigCanvas.addEventListener('touchstart', start, { passive: false });
  sigCanvas.addEventListener('touchmove', draw, { passive: false });
  window.addEventListener('touchend', stop);
}

const clearSigBtn = document.getElementById('clear-sig-btn');
const confirmSigBtn = document.getElementById('confirm-sig-btn');
const treatyStamp = document.getElementById('treaty-stamp');

if (clearSigBtn) {
  clearSigBtn.addEventListener('click', () => {
    if (sigCtx && sigCanvas) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      hasSigned = false;
    }
  });
}

if (confirmSigBtn) {
  confirmSigBtn.addEventListener('click', () => {
    treatyStamp.classList.add('stamped');
    confirmSigBtn.textContent = 'امضا شد و پیمان بسته شد 📜✨';
    confirmSigBtn.disabled = true;

    // Celebration burst
    launchFullConfetti();

    // Play stamp sound
    if (audioCtx) {
      const now = audioCtx.currentTime;
      playTone(400, now, 0.2);
      playTone(800, now + 0.1, 0.5);
    }
  });
}

// ==========================================
// Pure Canvas Confetti Explosion
// ==========================================
function launchFullConfetti() {
  const confettiCanvas = document.createElement('canvas');
  confettiCanvas.style.position = 'fixed';
  confettiCanvas.style.top = '0';
  confettiCanvas.style.left = '0';
  confettiCanvas.style.width = '100vw';
  confettiCanvas.style.height = '100vh';
  confettiCanvas.style.pointerEvents = 'none';
  confettiCanvas.style.zIndex = '9999';
  document.body.appendChild(confettiCanvas);

  const cCtx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const pieces = [];
  const colors = ['#ff4d80', '#f5af19', '#ff7597', '#ffffff', '#e01e5a', '#a855f7', '#27ae60'];

  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 24,
      vy: (Math.random() - 0.7) * 24,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      gravity: 0.35,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }

  function frame() {
    cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;

    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      p.alpha -= 0.007;

      if (p.alpha > 0) {
        alive = true;
        cCtx.save();
        cCtx.translate(p.x, p.y);
        cCtx.rotate(p.rotation);
        cCtx.globalAlpha = p.alpha;
        cCtx.fillStyle = p.color;
        cCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        cCtx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(frame);
    } else {
      confettiCanvas.remove();
    }
  }

  requestAnimationFrame(frame);
}

function burstMiniConfetti(element) {
  const rect = element.getBoundingClientRect();
  const cCanvas = document.createElement('canvas');
  cCanvas.style.position = 'fixed';
  cCanvas.style.top = `${rect.top}px`;
  cCanvas.style.left = `${rect.left}px`;
  cCanvas.style.width = `${rect.width}px`;
  cCanvas.style.height = `${rect.height}px`;
  cCanvas.style.pointerEvents = 'none';
  cCanvas.style.zIndex = '99';
  document.body.appendChild(cCanvas);

  const cCtx = cCanvas.getContext('2d');
  cCanvas.width = rect.width;
  cCanvas.height = rect.height;

  const sparks = [];
  for (let i = 0; i < 25; i++) {
    sparks.push({
      x: rect.width / 2,
      y: rect.height / 2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      alpha: 1,
      color: '#f5af19'
    });
  }

  function anim() {
    cCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);
    let alive = false;
    sparks.forEach((s) => {
      s.x += s.vx;
      s.y += s.vy;
      s.alpha -= 0.03;
      if (s.alpha > 0) {
        alive = true;
        cCtx.fillStyle = s.color;
        cCtx.globalAlpha = s.alpha;
        cCtx.beginPath();
        cCtx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        cCtx.fill();
      }
    });
    if (alive) requestAnimationFrame(anim);
    else cCanvas.remove();
  }
  anim();
}

// ==========================================
// Direct Call & Telegram Buttons Setup
// ==========================================
const callParsaBtn = document.getElementById('call-parsa-btn');
if (callParsaBtn) callParsaBtn.href = 'tel:+989373688242';
const telegramParsaBtn = document.getElementById('telegram-parsa-btn');
if (telegramParsaBtn && !telegramParsaBtn.href) {
  telegramParsaBtn.href = 'https://t.me/share/url?url=%D8%B3%D9%84%D8%A7%D9%85%20%D9%BE%D8%A7%D8%B1%D8%B3%D8%A7%20%D8%AC%D8%A7%D9%86%D8%8C%20%D8%B3%D8%A7%DB%8C%D8%AA%20%D8%B1%D9%88%20%D8%AF%DB%8C%D8%AF%D9%85%20%D9%88%20%D8%A8%D8%AE%D8%B4%DB%8C%D8%AF%D9%85%D8%AA%20%E2%9D%A4%EF%B8%8F';
}


// ==========================================
// مورد ۵: صورت فلکی تعاملی پیوند قلب‌ها (P ❤️ M Constellation)
// ==========================================
const cCanvas = document.getElementById('constellation-canvas');
const cResetBtn = document.getElementById('reset-constellation-btn');
const cRevealedBox = document.getElementById('constellation-revealed');
const cMsgTitle = document.getElementById('constellation-message-title');
const cMsgDesc = document.getElementById('constellation-message-desc');
const cHint = document.getElementById('constellation-hint');

if (cCanvas) {
  const cSkyCtx = cCanvas.getContext('2d');
  let stars = [];
  let connectedIndices = [];
  const celestialNotes = [
    392.00, 440.00, 493.88, 523.25, 587.33, 659.25,
    698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51
  ];

  // مختصات دقیق ستاره‌های P ❤️ M
  function getPMHeartCoords(w, h) {
    return [
      // ستاره‌های P (اندیس‌های ۰ تا ۳)
      { x: w * 0.16, y: h * 0.75, label: 'P' }, // 0
      { x: w * 0.16, y: h * 0.26, label: 'P' }, // 1
      { x: w * 0.28, y: h * 0.38, label: 'P' }, // 2
      { x: w * 0.16, y: h * 0.50, label: 'P' }, // 3

      // ستاره‌های قلب (اندیس‌های ۴ تا ۷)
      { x: w * 0.40, y: h * 0.34, label: '❤️' }, // 4 (گوشه چپ)
      { x: w * 0.50, y: h * 0.46, label: '❤️' }, // 5 (فرورفتگی وسط)
      { x: w * 0.60, y: h * 0.34, label: '❤️' }, // 6 (گوشه راست)
      { x: w * 0.50, y: h * 0.82, label: '❤️' }, // 7 (نوک پایین)

      // ستاره‌های M (اندیس‌های ۸ تا ۱۲)
      { x: w * 0.72, y: h * 0.75, label: 'M' }, // 8
      { x: w * 0.72, y: h * 0.26, label: 'M' }, // 9
      { x: w * 0.80, y: h * 0.48, label: 'M' }, // 10
      { x: w * 0.88, y: h * 0.26, label: 'M' }, // 11
      { x: w * 0.88, y: h * 0.75, label: 'M' }  // 12
    ];
  }

  // ستاره‌های پس‌زمینه ثابت
  const bgStars = [];
  for (let i = 0; i < 35; i++) {
    bgStars.push({
      x: (i * 137) % 680,
      y: (i * 219) % 360,
      r: (i % 3 === 0) ? 1.5 : 1,
      baseAlpha: 0.2 + (i % 5) * 0.08
    });
  }

  function setupConstellation() {
    connectedIndices = [];
    if (cRevealedBox) cRevealedBox.classList.remove('active');
    if (cHint) {
      cHint.style.display = 'block';
      cHint.innerHTML = '<span>✨ ستاره اول (P) رو لمس کن تا خطوط نوری متصل بشن...</span>';
    }

    cCanvas.width = 680;
    cCanvas.height = 360;

    const w = cCanvas.width;
    const h = cCanvas.height;
    const rawCoords = getPMHeartCoords(w, h);

    stars = rawCoords.map((pt, idx) => ({
      ...pt,
      idx: idx
    }));

    drawConstellation();
  }

  function drawConstellation() {
    cSkyCtx.clearRect(0, 0, cCanvas.width, cCanvas.height);

    // ۱. ستاره‌های ریز پس‌زمینه
    cSkyCtx.fillStyle = '#ffffff';
    for (let i = 0; i < bgStars.length; i++) {
      const s = bgStars[i];
      cSkyCtx.globalAlpha = s.baseAlpha;
      cSkyCtx.beginPath();
      cSkyCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      cSkyCtx.fill();
    }

    // ۲. هاله نرم داخل قلب در زمان رسیدن به ستاره ۷ و بسته شدن قلب با ستاره ۴
    if (connectedIndices.includes(7) && connectedIndices.includes(4)) {
      cSkyCtx.save();
      cSkyCtx.beginPath();
      cSkyCtx.moveTo(stars[4].x, stars[4].y);
      cSkyCtx.lineTo(stars[5].x, stars[5].y);
      cSkyCtx.lineTo(stars[6].x, stars[6].y);
      cSkyCtx.lineTo(stars[7].x, stars[7].y);
      cSkyCtx.closePath();
      cSkyCtx.fillStyle = 'rgba(255, 77, 128, 0.25)';
      cSkyCtx.shadowColor = '#ff4d80';
      cSkyCtx.shadowBlur = 15;
      cSkyCtx.fill();
      cSkyCtx.restore();
    }

    // ۳. خطوط اتصال زنجیره‌ای به سبک کلاسیک و اصلی سایت
    if (connectedIndices.length > 1) {
      cSkyCtx.save();
      cSkyCtx.beginPath();
      const first = stars[connectedIndices[0]];
      cSkyCtx.moveTo(first.x, first.y);

      for (let i = 1; i < connectedIndices.length; i++) {
        const next = stars[connectedIndices[i]];
        cSkyCtx.lineTo(next.x, next.y);
      }

      // اتصال ستاره ۴ و ۷ که دقیقاً شکل قلب را کامل و بسته می‌کند
      if (connectedIndices.includes(7) && connectedIndices.includes(4)) {
        cSkyCtx.moveTo(stars[7].x, stars[7].y);
        cSkyCtx.lineTo(stars[4].x, stars[4].y);
      }

      // هاله نورانی صورتی
      cSkyCtx.strokeStyle = 'rgba(255, 77, 128, 0.55)';
      cSkyCtx.lineWidth = 8;
      cSkyCtx.lineCap = 'round';
      cSkyCtx.lineJoin = 'round';
      cSkyCtx.stroke();

      // خط شارپ طلایی
      cSkyCtx.strokeStyle = '#f5af19';
      cSkyCtx.lineWidth = 2.8;
      cSkyCtx.globalAlpha = 0.95;
      cSkyCtx.stroke();
      cSkyCtx.restore();
    }

    // ۴. رسم ستاره‌ها و حروف
    stars.forEach((s, idx) => {
      const isConnected = connectedIndices.includes(idx);
      const isNext = (connectedIndices.length === 0 && idx === 0) ||
                     (connectedIndices.length > 0 && idx === connectedIndices.length);

      cSkyCtx.save();
      cSkyCtx.translate(s.x, s.y);

      const haloRadius = isConnected ? 16 : (isNext ? 14 : 9);
      cSkyCtx.fillStyle = isConnected
        ? 'rgba(255, 215, 0, 0.4)'
        : (isNext ? 'rgba(255, 77, 128, 0.45)' : 'rgba(255, 255, 255, 0.18)');

      cSkyCtx.beginPath();
      cSkyCtx.arc(0, 0, haloRadius, 0, Math.PI * 2);
      cSkyCtx.fill();

      cSkyCtx.fillStyle = isConnected ? '#ffd700' : (isNext ? '#ffa3bc' : '#ffffff');
      cSkyCtx.globalAlpha = 1;
      cSkyCtx.beginPath();
      cSkyCtx.arc(0, 0, isConnected ? 6 : 4.5, 0, Math.PI * 2);
      cSkyCtx.fill();

      cSkyCtx.fillStyle = isConnected ? '#ffd700' : (isNext ? '#ffb3c7' : '#e6d0ed');
      cSkyCtx.font = s.label === '❤️' ? '16px sans-serif' : 'bold 13px Vazirmatn, sans-serif';
      cSkyCtx.textAlign = 'center';
      cSkyCtx.shadowColor = isConnected ? '#ffd700' : 'rgba(255, 77, 128, 0.8)';
      cSkyCtx.shadowBlur = isConnected ? 8 : (isNext ? 10 : 3);
      cSkyCtx.fillText(s.label, 0, -12);

      cSkyCtx.restore();
    });
  }

  function activateStar(index) {
    if (connectedIndices.includes(index)) return;

    // فقط و فقط اتصال به ترتیب دقیق و ترتیبی مجاز است (0 -> 1 -> 2 -> ... -> 12)
    const expectedIndex = connectedIndices.length;
    if (index !== expectedIndex) {
      // اگر کاربر ستاره اشتباهی را لمس کند، هیچ اتصالی رخ نمی‌دهد
      if (expectedIndex < stars.length && cHint) {
        const nextLabel = stars[expectedIndex].label;
        cHint.innerHTML = `<span style="color: #ff94b8;">✨ به ترتیب وصل کن! ابتدا ستاره (${nextLabel}) رو لمس کن...</span>`;
      }
      return;
    }

    connectedIndices.push(index);

    // پخش نت صدای آسمانی
    if (audioCtx) {
      const freq = celestialNotes[index % celestialNotes.length];
      playTone(freq, audioCtx.currentTime, 0.4);
    }

    // ویبره لمسی گوشی
    if (navigator.vibrate) try { navigator.vibrate(25); } catch(e) {}

    // بررسی پایان کامل اتصال تمام ستاره‌ها
    if (connectedIndices.length === stars.length) {
      onConstellationComplete();
    } else {
      if (connectedIndices.length === 4) {
        cHint.innerHTML = '<span>💖 حرف P وصل شد! حالا قلب پیوند (❤️) رو لمس کن...</span>';
      } else if (connectedIndices.length === 8) {
        cHint.innerHTML = '<span>💖 قلب پیوند کامل شد! حالا ستاره‌های M رو وصل کن...</span>';
      } else {
        const nextLabel = stars[connectedIndices.length].label;
        cHint.innerHTML = '<span>✨ ستاره بعدی (' + nextLabel + ') رو لمس کن...</span>';
      }
    }

    drawConstellation();
  }

  function onConstellationComplete() {
    if (cHint) cHint.style.display = 'none';
    if (cRevealedBox) cRevealedBox.classList.add('active');

    if (cMsgTitle) cMsgTitle.textContent = '«پیوند ابدی قلب‌های پارسا و مبینا (P ❤️ M)»';
    if (cMsgDesc) cMsgDesc.textContent = 'دست در دست هم، از زمین تا کهکشان‌ها... همیشه عاشقتم مبینای من ❤️🕊️';

    if (audioCtx) {
      const now = audioCtx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        playTone(f, now + i * 0.15, 1.2);
      });
    }

    launchFullConfetti();
  }

  function handleSkyClick(e) {
    const r = cCanvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = cCanvas.width / r.width;
    const scaleY = cCanvas.height / r.height;

    const x = (clientX - r.left) * scaleX;
    const y = (clientY - r.top) * scaleY;

    const expectedIndex = connectedIndices.length;
    if (expectedIndex < stars.length) {
      const nextStar = stars[expectedIndex];
      const distToNext = Math.hypot(nextStar.x - x, nextStar.y - y);
      // اگر روی ستاره مجاز بعدی کلیک یا لمس شده باشد
      if (distToNext < 48) {
        activateStar(expectedIndex);
        return;
      }
    }

    // اگر روی ستاره غیرمجاز دیگری کلیک شده باشد، تلاش برای فعال‌سازی آن با شکست مواجه می‌شود
    let otherStar = null;
    let minDist = 40;
    stars.forEach((s) => {
      const dist = Math.hypot(s.x - x, s.y - y);
      if (dist < minDist) {
        minDist = dist;
        otherStar = s;
      }
    });

    if (otherStar) {
      activateStar(otherStar.idx);
    }
  }

  cCanvas.addEventListener('pointerdown', handleSkyClick);
  cCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleSkyClick(e);
  }, { passive: false });
  cCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handleSkyClick(e);
  }, { passive: false });

  if (cResetBtn) {
    cResetBtn.addEventListener('click', () => {
      setupConstellation();
    });
  }

  let cResizeDebounce = null;
  window.addEventListener('resize', () => {
    clearTimeout(cResizeDebounce);
    cResizeDebounce = setTimeout(() => {
      if (cCanvas) setupConstellation();
    }, 250);
  });

  setupConstellation();
}

// ==========================================
// 0. Password Gate & Zoom-in Pen Reveal Screen
// ==========================================
function initPasswordGate() {
  if (window.__pwdGateInitDone) return;
  window.__pwdGateInitDone = true;

  const overlay = document.getElementById('password-gate-overlay');
  const card = document.getElementById('password-card');
  const form = document.getElementById('password-form');
  const input = document.getElementById('site-password-input');
  const toggleBtn = document.getElementById('toggle-pwd-visibility');
  const errorMsg = document.getElementById('password-error-msg');
  const penZoomOverlay = document.getElementById('pen-zoom-overlay');

  if (!overlay || !input) return;

  // Specific password set to "1911"
  function normalizeDigits(str) {
    return str
      .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  }

  const validPasswords = ['1911', '۱۹۱۱'];

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (input.type === 'password') {
        input.type = 'text';
        toggleBtn.textContent = '🙈';
        toggleBtn.setAttribute('title', 'مخفی کردن رمز');
      } else {
        input.type = 'password';
        toggleBtn.textContent = '👁️';
        toggleBtn.setAttribute('title', 'نمایش رمز');
      }
      input.focus();
    });
  }

  function handleUnlock() {
    const rawVal = input.value.trim();
    const normalizedVal = normalizeDigits(rawVal);
    const isCorrect = (normalizedVal === '1911') || validPasswords.includes(rawVal);

    if (isCorrect) {
      errorMsg.textContent = '';
      overlay.classList.add('is-unlocked');

      // Scroll immediately to the top of the page
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Auto-play default track "Khooneye Man"
      try {
        bgAudio.play().then(() => {
          isPlaying = true;
          setAudioPlayingState(true);
        }).catch(() => {});
      } catch (err) {}

      // Trigger the Fountain Pen Zoom-in Screen
      if (penZoomOverlay) {
        penZoomOverlay.classList.add('active');

        // Play celestial opening sound
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, idx) => {
          playTone(f, now + idx * 0.12, 1.2);
        });

        // After 2.0 seconds of pen zooming, reveal site smoothly and ensure top scroll
        setTimeout(() => {
          penZoomOverlay.classList.remove('active');
          penZoomOverlay.style.display = 'none';
          overlay.style.display = 'none';
          document.body.style.overflow = 'auto';
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }, 2000);
      } else {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    } else {
      if (card) {
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 450);
      }
      errorMsg.textContent = 'رمز اشتباهه فدات شم، دوباره امتحان کن! 🥺';
      input.focus();
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUnlock();
    });
  }

  const submitBtn = document.getElementById('submit-password-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleUnlock();
    });
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUnlock();
    }
  });
}

// Ensure password gate is ready immediately
initPasswordGate();

// ==========================================
// 2. Polaroid Cards 3D Flip & 3D Tilt / Parallax
// ==========================================
function initPolaroidParallax() {
  const cards = document.querySelectorAll('.polaroid-card');

  cards.forEach((card) => {
    const inner = card.querySelector('.polaroid-inner');
    const front = card.querySelector('.polaroid-front');

    // Create dynamic glare overlay
    let glare = card.querySelector('.polaroid-glare');
    if (!glare && front) {
      glare = document.createElement('div');
      glare.className = 'polaroid-glare';
      front.appendChild(glare);
    }

    // Click to Flip card
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
      if (inner) inner.style.transform = '';

      if (audioCtx) {
        playTone(600, audioCtx.currentTime, 0.05);
      }

      if (navigator.vibrate) {
        try { navigator.vibrate(20); } catch (e) {}
      }
    });

    // Desktop Mouse Move 3D Perspective Tilt
    card.addEventListener('mousemove', (e) => {
      if (card.classList.contains('is-flipped')) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -15;
      const rotateY = ((x - centerX) / centerX) * 15;

      inner.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;

      if (glare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, transparent 65%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('is-flipped')) {
        inner.style.transform = '';
      }
    });
  });

  // Mobile Gyroscope 3D Parallax Tilt (DeviceOrientation)
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma === null || e.beta === null) return;
      const tiltY = Math.max(-18, Math.min(18, e.gamma * 0.6));
      const tiltX = Math.max(-18, Math.min(18, (e.beta - 45) * 0.6));

      cards.forEach((card) => {
        if (!card.classList.contains('is-flipped')) {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            const inner = card.querySelector('.polaroid-inner');
            if (inner) {
              inner.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`;
            }
          }
        }
      });
    }, { passive: true });
  }
}

// ==========================================
// 5. Love Story Timeline (Removed)
// ==========================================
function initTimeline() {}

// ==========================================
// 6. Voice Message Capsule (Removed)
// ==========================================
function initVoiceCapsule() {}

// ==========================================
// 7. Interactive Cartoon Boxing Ring Mini-Game (رینگ دلجویی مبینا)
// ==========================================
function initBoxingRing() {
  const punchBtn = document.getElementById('punch-btn');
  const resetRingBtn = document.getElementById('reset-ring-btn');
  const mobinaAvatar = document.querySelector('.mobina-avatar');
  const parsaAvatar = document.getElementById('parsa-avatar');
  const parsaFaceNormal = document.getElementById('parsa-face-normal');
  const parsaFaceDizzy = document.getElementById('parsa-face-dizzy');
  const parsaSurrenderFlag = document.getElementById('parsa-surrender-flag');
  const parsaSpeech = document.getElementById('parsa-speech');
  const hitImpactSpark = document.getElementById('hit-impact-spark');
  const rageMeterFill = document.getElementById('rage-meter-fill');
  const ragePercentText = document.getElementById('rage-percent-text');
  const punchCountEl = document.getElementById('punch-count');
  const ringVictoryBox = document.getElementById('ring-victory-box');
  const ringStage = document.getElementById('ring-stage');

  if (!punchBtn || !parsaAvatar) return;

  let punchCount = 0;
  let confettiFired = false;
  const maxPunches = 20;
  const reactions = [
    'آخ! اولیش بود، عیب نداره! 🥺',
    'غلط کردم! دیگه تکرار نمیشه 🙈',
    'مشتاتم مثل خودت قشنگه! 💖',
    'حق داری، محکم‌تر بزن خنک شی! 🥊',
    'چشمام سیاهی رفت ولی عاشقتم! 😵‍💫',
    'آخ دماغم! فدای سرت مبینا 🩸',
    'هرچی تو بگی! تسلیم تسلیم 🏳️',
    'دلت یکم خنک شد مهربونم؟ 🥰',
    'من فدای دستات بشم یواش‌تر! 🥺',
    'نصفش رفت! هنوزم دلخوری؟ 💖',
    'آخ لبم خونی شد ولی بازم عاشقتم! 🩸🙈',
    'بزن تا همه اشتباهام پاک بشه! 🥊',
    'دیگه جای سالم نموند برام! 🤕',
    'تو بزن، من نگات کنم ذوق کنم! ✨',
    'غلط کردم به جون خودت! 🥺❤️',
    'ستاره‌های آسمون رو دارم می‌بینم! 💫',
    'فقط ۳ تا ضربه مونده، دیگه آشتی؟ 🥺',
    'من تسلیم مطلق توئم پرنسس! 👑',
    'یکی مونده! رسماً منو ناک‌اوت کردی! 🏳️',
    '۱۰۰٪ آرامش! حالا دیگه باید بغلم کنی! 🎉❤️'
  ];

  const cartoonSounds = [
    [400, 200, 0.1],
    [520, 260, 0.12],
    [350, 180, 0.09],
    [600, 300, 0.11]
  ];

  function playPunchSound() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const sound = cartoonSounds[Math.floor(Math.random() * cartoonSounds.length)];
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(sound[0], now);
    osc.frequency.exponentialRampToValueAtTime(sound[1], now + sound[2]);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + sound[2]);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + sound[2]);
  }

  function createFloatingHitText(text, x, y) {
    if (!ringStage) return;
    const word = document.createElement('div');
    word.className = 'flying-hit-word';
    word.textContent = text;
    const randX = (Math.random() - 0.5) * 60;
    word.style.setProperty('--rand-x', `${randX}px`);
    word.style.left = `${x || 240}px`;
    word.style.top = `${y || 110}px`;
    ringStage.appendChild(word);
    setTimeout(() => word.remove(), 900);
  }

  function handlePunch() {
    punchCount++;
    const progress = Math.min(100, Math.round((punchCount / maxPunches) * 100));

    playPunchSound();
    if (navigator.vibrate) {
      try { navigator.vibrate(35); } catch(err) {}
    }

    if (mobinaAvatar) {
      mobinaAvatar.classList.remove('punching');
      void mobinaAvatar.offsetWidth;
      mobinaAvatar.classList.add('punching');
    }

    parsaAvatar.classList.remove('hit-wobble');
    void parsaAvatar.offsetWidth;
    parsaAvatar.classList.add('hit-wobble');

    if (hitImpactSpark) {
      hitImpactSpark.classList.remove('spark-pop');
      void hitImpactSpark.offsetWidth;
      hitImpactSpark.classList.add('spark-pop');
    }

    if (rageMeterFill) rageMeterFill.style.width = `${progress}%`;
    if (ragePercentText) ragePercentText.textContent = `${progress.toLocaleString('fa-IR')}٪`;
    if (punchCountEl) punchCountEl.textContent = punchCount.toLocaleString('fa-IR');

    const reactionText = reactions[(punchCount - 1) % reactions.length];
    if (parsaSpeech) {
      parsaSpeech.querySelector('span').textContent = reactionText;
      parsaSpeech.style.animation = 'none';
      void parsaSpeech.offsetWidth;
      parsaSpeech.style.animation = 'speechPop 0.3s ease';
    }

    const hitWords = ['بوم! 💥', 'آخ! 🥊', 'پاو! ✨', 'غلط کردم! 🙈', 'عاشقتم! 💖'];
    const hitWord = hitWords[Math.floor(Math.random() * hitWords.length)];
    createFloatingHitText(hitWord, 230 + (Math.random() - 0.5) * 40, 100 + (Math.random() - 0.5) * 30);

    // پیشرفت گام‌به‌گام و ملموس کبودی‌ها و خونریزی بر اثر مشت‌های مبینا
    const parsaHitMark = document.getElementById('parsa-hit-mark');
    const parsaHitBumpEarly = document.getElementById('parsa-hit-bump-early');
    const parsaBloodNose = document.getElementById('parsa-blood-nose');
    const parsaBloodLip = document.getElementById('parsa-blood-lip');
    const parsaBloodForehead = document.getElementById('parsa-blood-forehead');
    const parsaBloodSpatters = document.getElementById('parsa-blood-spatters');

    if (parsaHitMark && punchCount >= 1) parsaHitMark.style.opacity = '0.75';
    if (parsaHitBumpEarly && punchCount >= 2) parsaHitBumpEarly.style.opacity = '0.7';

    // از مشت ۳ به بعد صورت گیج و کبودی کامل فعال می‌شود
    if (punchCount >= 3 && parsaFaceNormal && parsaFaceDizzy) {
      parsaFaceNormal.style.display = 'none';
      parsaFaceDizzy.style.display = 'block';
    }

    // اضافه شدن خون‌دماغ کارتونی از ضربه ۵ به بعد
    if (parsaBloodNose && punchCount >= 5) {
      parsaBloodNose.style.opacity = '1';
    }

    // اضافه شدن خون گوشه لب از ضربه ۸ به بعد
    if (parsaBloodLip && punchCount >= 8) {
      parsaBloodLip.style.opacity = '1';
    }

    // اضافه شدن زخم و خون روی پیشانی از ضربه ۱۲ به بعد
    if (parsaBloodForehead && punchCount >= 12) {
      parsaBloodForehead.style.opacity = '1';
    }

    // پاشش قطرات خون روی گونه از ضربه ۱۵ به بعد
    if (parsaBloodSpatters && punchCount >= 15) {
      parsaBloodSpatters.style.opacity = '1';
    }

    if (punchCount >= maxPunches) {
      if (parsaSurrenderFlag) parsaSurrenderFlag.style.display = 'block';
      if (ringVictoryBox) ringVictoryBox.style.display = 'block';
      if (resetRingBtn) resetRingBtn.style.display = 'inline-flex';
      punchBtn.style.display = 'none';

      // پرتاب کانفتی دقیقاً یک‌بار در زمان رسیدن به ۱۰۰٪
      if (!confettiFired) {
        confettiFired = true;
        launchFullConfetti();
      }
    }
  }

  punchBtn.addEventListener('click', handlePunch);
  if (parsaAvatar) parsaAvatar.addEventListener('click', handlePunch);

  if (resetRingBtn) {
    resetRingBtn.addEventListener('click', () => {
      punchCount = 0;
      confettiFired = false;
      const parsaHitMark = document.getElementById('parsa-hit-mark');
      const parsaHitBumpEarly = document.getElementById('parsa-hit-bump-early');
      const parsaBloodNose = document.getElementById('parsa-blood-nose');
      const parsaBloodLip = document.getElementById('parsa-blood-lip');
      const parsaBloodForehead = document.getElementById('parsa-blood-forehead');
      const parsaBloodSpatters = document.getElementById('parsa-blood-spatters');

      if (parsaHitMark) parsaHitMark.style.opacity = '0';
      if (parsaHitBumpEarly) parsaHitBumpEarly.style.opacity = '0';
      if (parsaBloodNose) parsaBloodNose.style.opacity = '0';
      if (parsaBloodLip) parsaBloodLip.style.opacity = '0';
      if (parsaBloodForehead) parsaBloodForehead.style.opacity = '0';
      if (parsaBloodSpatters) parsaBloodSpatters.style.opacity = '0';

      if (rageMeterFill) rageMeterFill.style.width = '0%';
      if (ragePercentText) ragePercentText.textContent = '۰٪';
      if (punchCountEl) punchCountEl.textContent = '۰';
      if (parsaFaceNormal) parsaFaceNormal.style.display = 'block';
      if (parsaFaceDizzy) parsaFaceDizzy.style.display = 'none';
      if (parsaSurrenderFlag) parsaSurrenderFlag.style.display = 'none';
      if (ringVictoryBox) ringVictoryBox.style.display = 'none';
      if (resetRingBtn) resetRingBtn.style.display = 'none';
      punchBtn.style.display = 'inline-flex';
      if (parsaSpeech) parsaSpeech.querySelector('span').textContent = 'بزن ولی آشتی کن! 🥺';
    });
  }
}

// Single-run initialization
function initAllFeatures() {
  if (window.__allFeaturesInited) return;
  window.__allFeaturesInited = true;
  initPasswordGate();
  initPolaroidParallax();
  initVoiceCapsule();
  initBoxingRing();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllFeatures);
} else {
  initAllFeatures();
}

