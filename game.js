const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// ── Audio ────────────────────────────────────────────────
let actx      = null;
let bgPlaying = false;
let bgTimer   = null;
let bassTimer = null;
let bgBeat    = 0;
let bassIdx   = 0;

// Synth space melody: [Hz, duration_s]  —  0 = rest
const MELODY = [
    [330,0.18],[330,0.12],[392,0.15],[440,0.28],[392,0.15],[330,0.15],
    [294,0.28],[0,0.20],
    [330,0.18],[392,0.18],[440,0.18],[523,0.30],[440,0.18],[392,0.18],
    [330,0.55],[0,0.30],
    [440,0.18],[494,0.18],[523,0.18],[440,0.28],[392,0.18],[330,0.18],
    [294,0.28],[262,0.55],[0,0.25],
    [330,0.15],[392,0.15],[440,0.15],[494,0.15],[523,0.20],[494,0.15],
    [440,0.55],[330,0.18],[294,0.75],[0,0.40],
];

const BASS = [
    [110,0.90],[110,0.45],[131,0.45],
    [110,0.90],[98, 0.90],
    [110,0.90],[110,0.45],[131,0.45],
    [110,0.90],[110,0.90],
];

function getAudioCtx() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
}

function schedMelodyNote(freq, dur) {
    if (freq === 0) return;
    const ac = getAudioCtx();
    for (const detune of [-8, 8]) {
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        osc.detune.value = detune;
        gain.gain.setValueAtTime(0, ac.currentTime);
        gain.gain.linearRampToValueAtTime(0.055, ac.currentTime + 0.012);
        gain.gain.setValueAtTime(0.055, ac.currentTime + dur * 0.65);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + dur + 0.01);
    }
}

function schedBassNote(freq, dur) {
    if (freq === 0) return;
    const ac = getAudioCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur * 0.85);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + dur);
}

function startBgMusic() {
    if (bgPlaying) return;
    bgPlaying = true;
    bgBeat = 0;
    bassIdx = 0;

    function tickMelody() {
        if (!bgPlaying) return;
        const [freq, dur] = MELODY[bgBeat % MELODY.length];
        schedMelodyNote(freq, dur);
        bgBeat++;
        bgTimer = setTimeout(tickMelody, dur * 1000);
    }

    function tickBass() {
        if (!bgPlaying) return;
        const [freq, dur] = BASS[bassIdx % BASS.length];
        schedBassNote(freq, dur);
        bassIdx++;
        bassTimer = setTimeout(tickBass, dur * 1000);
    }

    tickMelody();
    tickBass();
}

function stopBgMusic() {
    bgPlaying = false;
    clearTimeout(bgTimer);
    clearTimeout(bassTimer);
    bgTimer = bassTimer = null;
}

function playGameOverJingle() {
    const ac = getAudioCtx();

    function wap(startT, freq, dur) {
        const osc  = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startT);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.78, startT + dur);
        gain.gain.setValueAtTime(0.28, startT);
        gain.gain.setValueAtTime(0.22, startT + dur * 0.55);
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(startT);
        osc.stop(startT + dur + 0.05);
    }

    const t = ac.currentTime + 0.08;
    wap(t,        262, 0.30);
    wap(t + 0.42, 233, 0.30);
    wap(t + 0.84, 208, 0.30);

    // waaaa — long descending slide
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(185, t + 1.22);
    osc.frequency.exponentialRampToValueAtTime(88,  t + 3.10);
    gain.gain.setValueAtTime(0.30, t + 1.22);
    gain.gain.setValueAtTime(0.26, t + 2.10);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.10);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t + 1.22);
    osc.stop(t + 3.20);
}

function playLaser() {
    const ac = getAudioCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.10);
    gain.gain.setValueAtTime(0.10, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.10);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.10);
}

function playEnemyShot() {
    const ac = getAudioCtx();
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ac.currentTime + 0.14);
    gain.gain.setValueAtTime(0.08, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.14);
}

function playExplosion(big) {
    const ac  = getAudioCtx();
    const dur = big ? 0.35 : 0.22;
    const vol = big ? 0.45 : 0.28;

    const samples = Math.floor(ac.sampleRate * dur);
    const buf  = ac.createBuffer(1, samples, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(big ? 500 : 700, ac.currentTime);
    lp.frequency.exponentialRampToValueAtTime(60, ac.currentTime + dur);

    const sub     = ac.createOscillator();
    const subGain = ac.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(big ? 120 : 200, ac.currentTime);
    sub.frequency.exponentialRampToValueAtTime(30, ac.currentTime + dur * 0.8);
    subGain.gain.setValueAtTime(vol * 0.5, ac.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur * 0.8);
    sub.connect(subGain);
    subGain.connect(ac.destination);
    sub.start(ac.currentTime);
    sub.stop(ac.currentTime + dur);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    src.connect(lp);
    lp.connect(gain);
    gain.connect(ac.destination);
    src.start(ac.currentTime);
}

// ── State ────────────────────────────────────────────────
let gameState    = 'start'; // 'start' | 'playing' | 'paused' | 'gameover'
let startTime    = 0;
let endTime      = 0;
let pausedAt     = 0;
let pausedTotal  = 0;
let kills        = 0;
let killsStation = 0;
let killsComet   = 0;
let bullets      = [];
let enemyBullets = [];
let enemies      = [];
let particles    = [];
let stars        = [];
let spawnTimer   = 0;
let spawnInterval = 120;
let frameCount   = 0;

// ── Player ───────────────────────────────────────────────
const player = {
    x: W / 2, y: H - 90,
    w: 32, h: 42,
    speed: 5,
    shootCooldown: 0,
    thrustAnim: 0
};

// ── Input ────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
    if (e.code === 'Space') e.preventDefault();
    keys[e.code] = true;
    if (e.code === 'Enter' && gameState !== 'playing') initGame();
    if (e.code === 'KeyP') togglePause();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Pause ────────────────────────────────────────────────
function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        pausedAt  = Date.now();
        stopBgMusic();
        document.getElementById('pauseBtn').textContent = '▶ WEITER';
    } else if (gameState === 'paused') {
        pausedTotal += Date.now() - pausedAt;
        gameState = 'playing';
        startBgMusic();
        document.getElementById('pauseBtn').textContent = '⏸ PAUSE';
    }
}

// ── Stars ────────────────────────────────────────────────
function initStars() {
    stars = [];
    for (let i = 0; i < 140; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 1.4 + 0.3,
            speed: Math.random() * 1.8 + 0.3,
            alpha: Math.random() * 0.6 + 0.2
        });
    }
}

// ── Init / Reset ─────────────────────────────────────────
function initGame() {
    gameState     = 'playing';
    startTime     = Date.now();
    kills         = 0;
    killsStation  = 0;
    killsComet    = 0;
    pausedAt      = 0;
    pausedTotal   = 0;
    bullets       = [];
    enemyBullets  = [];
    enemies       = [];
    particles     = [];
    spawnTimer    = 0;
    spawnInterval = 120;
    frameCount    = 0;
    player.x      = W / 2;
    player.y      = H - 90;
    player.shootCooldown = 0;
    initStars();
    stopBgMusic();
    startBgMusic();
    document.getElementById('kills').textContent        = '0';
    document.getElementById('killsStation').textContent = '0';
    document.getElementById('killsComet').textContent   = '0';
    document.getElementById('timer').textContent        = '0:00';
    document.getElementById('pauseBtn').textContent     = '⏸ PAUSE';
}

// ── Spawn ────────────────────────────────────────────────
function spawnEnemy() {
    const x    = 45 + Math.random() * (W - 90);
    const type = Math.random() < 0.60 ? 'comet' : 'enemy';
    const elapsed = (Date.now() - startTime) / 1000;
    const speedBonus = Math.min(elapsed * 0.025, 2.5);
    const speed = type === 'comet'
        ? 1.6 + Math.random() * 1.8 + speedBonus
        : 1.0 + Math.random() * 1.2 + speedBonus;
    const size = type === 'comet' ? 13 : 20;

    let nucleusPoints = null;
    if (type === 'comet') {
        nucleusPoints = [];
        const n = 7 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const r = size * (0.55 + Math.random() * 0.5);
            nucleusPoints.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
    }

    const shootInt = Math.max(60, 130 - elapsed * 0.4);

    enemies.push({
        x, y: -40, type, speed, size,
        hp:            type === 'enemy' ? 2 : 1,
        rot:           Math.random() * Math.PI * 2,
        rotSpeed:      type === 'enemy' ? (Math.random() < 0.5 ? 0.018 : -0.018) : (Math.random() - 0.5) * 0.04,
        nucleusPoints,
        shootTimer:    20 + Math.random() * shootInt,
        shootInterval: shootInt,
    });
}

// ── Draw helpers ─────────────────────────────────────────
function drawSpaceStation(x, y, size, rot) {
    const s = size;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    for (const side of [-1, 1]) {
        ctx.fillStyle = '#1a2a3a';
        ctx.strokeStyle = '#3a6a9a';
        ctx.lineWidth = 1;
        ctx.fillRect(side * s * 0.48, -s * 0.32, side * s * 1.1, s * 0.64);
        ctx.strokeRect(side * s * 0.48, -s * 0.32, side * s * 1.1, s * 0.64);
        ctx.strokeStyle = '#2a5a7a';
        ctx.lineWidth = 0.6;
        for (let c = 1; c < 4; c++) {
            const gx = side * s * 0.48 + side * (s * 1.1 / 4) * c;
            ctx.beginPath(); ctx.moveTo(gx, -s * 0.32); ctx.lineTo(gx, s * 0.32); ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(side * s * 0.48, 0); ctx.lineTo(side * (s * 0.48 + s * 1.1), 0);
        ctx.stroke();
        ctx.strokeStyle = '#2af';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#2af';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(side * (s * 0.48 + s * 1.1), -s * 0.32);
        ctx.lineTo(side * (s * 0.48 + s * 1.1),  s * 0.32);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#445566';
    ctx.fillRect(-s * 0.48, -s * 0.12, s * 0.96, s * 0.24);

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
    const hubGrad = ctx.createRadialGradient(-s * 0.15, -s * 0.15, 0, 0, 0, s * 0.44);
    hubGrad.addColorStop(0, '#99aabb');
    hubGrad.addColorStop(1, '#445566');
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = '#f44';
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.strokeStyle = '#88aacc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.30, 0, Math.PI * 2);
    ctx.strokeStyle = '#f55';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#f55';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.shadowBlur = 0;
    for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.44, Math.sin(a) * s * 0.44, s * 0.09, 0, Math.PI * 2);
        ctx.fillStyle = '#334455';
        ctx.fill();
        ctx.strokeStyle = '#667788';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = '#ff3322';
    ctx.shadowColor = '#ff3322';
    ctx.shadowBlur = 16;
    ctx.fill();

    ctx.restore();
}

function drawPlayer() {
    const { x, y, w, h, thrustAnim } = player;
    ctx.save();
    ctx.translate(x, y);

    const thrustLen = 10 + thrustAnim * 8;
    const grad = ctx.createLinearGradient(0, h / 2, 0, h / 2 + thrustLen);
    grad.addColorStop(0, 'rgba(255,180,0,0.9)');
    grad.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.beginPath();
    ctx.moveTo(-w * 0.28, h / 2);
    ctx.lineTo(0, h / 2 + thrustLen);
    ctx.lineTo(w * 0.28, h / 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0,      -h / 2);
    ctx.lineTo(-w / 2,  h / 2);
    ctx.lineTo( w / 2,  h / 2);
    ctx.closePath();
    ctx.fillStyle = '#0cf';
    ctx.shadowColor = '#0cf';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fill();

    ctx.restore();
}

function drawBullet(b) {
    ctx.save();
    ctx.fillStyle = '#ff0';
    ctx.shadowColor = '#ff4';
    ctx.shadowBlur = 10;
    ctx.fillRect(b.x - 2, b.y - 10, 4, 12);
    ctx.restore();
}

function drawComet(e) {
    const s = e.size;
    ctx.save();
    ctx.translate(e.x, e.y);

    const tLen  = s * 5.5;
    const tGrad = ctx.createLinearGradient(0, 0, 0, -tLen);
    tGrad.addColorStop(0,   'rgba(160,220,255,0.55)');
    tGrad.addColorStop(0.4, 'rgba(100,170,255,0.22)');
    tGrad.addColorStop(1,   'rgba(80,120,255,0)');
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.1);
    ctx.quadraticCurveTo(-s * 0.15, -tLen * 0.55, 0, -tLen);
    ctx.quadraticCurveTo( s * 0.15, -tLen * 0.55, s * 0.45, -s * 0.1);
    ctx.closePath();
    ctx.fillStyle = tGrad;
    ctx.fill();

    const dLen  = s * 3.8;
    const dGrad = ctx.createLinearGradient(0, 0, s * 0.9, -dLen);
    dGrad.addColorStop(0,   'rgba(255,220,120,0.35)');
    dGrad.addColorStop(0.5, 'rgba(255,180, 60,0.15)');
    dGrad.addColorStop(1,   'rgba(255,140,  0,0)');
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.7, -dLen * 0.5, s * 2.0, -dLen);
    ctx.quadraticCurveTo(s * 0.5, -dLen * 0.45, s * 0.35, -s * 0.05);
    ctx.closePath();
    ctx.fillStyle = dGrad;
    ctx.fill();

    const cGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 2.0);
    cGrad.addColorStop(0,    'rgba(210,245,255,0.65)');
    cGrad.addColorStop(0.45, 'rgba(100,200,255,0.18)');
    cGrad.addColorStop(1,    'rgba(50,100,200,0)');
    ctx.beginPath();
    ctx.arc(0, 0, s * 2.0, 0, Math.PI * 2);
    ctx.fillStyle = cGrad;
    ctx.fill();

    const pts = e.nucleusPoints;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    const rGrad = ctx.createRadialGradient(-s * 0.2, -s * 0.25, 0, 0, 0, s * 1.1);
    rGrad.addColorStop(0,   '#cfc0a8');
    rGrad.addColorStop(0.5, '#8a7060');
    rGrad.addColorStop(1,   '#4a3830');
    ctx.fillStyle = rGrad;
    ctx.shadowColor = '#aadeff';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,160,140,0.5)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    ctx.restore();
}

// ── Particles ────────────────────────────────────────────
function spawnExplosion(x, y, color) {
    for (let i = 0; i < 16; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3.5;
        particles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            color,
            size: 2 + Math.random() * 3
        });
    }
}

function triggerGameOver() {
    spawnExplosion(player.x, player.y, '#0cf');
    spawnExplosion(player.x, player.y, '#fff');
    playExplosion(true);
    stopBgMusic();
    playGameOverJingle();
    gameState = 'gameover';
    endTime   = Date.now();
}

// ── Update ────────────────────────────────────────────────
function update() {
    if (gameState !== 'playing' && gameState !== 'paused') return;
    if (gameState === 'paused') return;
    frameCount++;

    if (keys['ArrowLeft'] || keys['KeyA'])
        player.x = Math.max(player.w / 2 + 2, player.x - player.speed);
    if (keys['ArrowRight'] || keys['KeyD'])
        player.x = Math.min(W - player.w / 2 - 2, player.x + player.speed);

    player.thrustAnim = Math.sin(frameCount * 0.4) * 0.5 + 0.5;

    if (player.shootCooldown > 0) player.shootCooldown--;
    if (keys['Space'] && player.shootCooldown === 0) {
        bullets.push({ x: player.x, y: player.y - player.h / 2 });
        player.shootCooldown = 10;
        playLaser();
    }

    for (const s of stars) {
        s.y += s.speed;
        if (s.y > H) { s.y = -2; s.x = Math.random() * W; }
    }

    bullets = bullets.filter(b => { b.y -= 10; return b.y > -15; });

    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnEnemy();
        const elapsed = (Date.now() - startTime) / 1000;
        if (Math.random() < 0.25 + elapsed * 0.003) spawnEnemy();
        spawnInterval = Math.max(35, 120 - elapsed * 0.6);
    }

    enemies = enemies.filter(e => {
        e.y += e.speed;
        e.rot += e.rotSpeed;
        if (e.type === 'enemy') {
            e.shootTimer--;
            if (e.shootTimer <= 0) {
                e.shootTimer = e.shootInterval;
                const dx  = player.x - e.x;
                const dy  = player.y - e.y;
                const d   = Math.hypot(dx, dy);
                const spd = 2.6 + Math.random() * 0.8;
                enemyBullets.push({ x: e.x, y: e.y, vx: dx / d * spd, vy: dy / d * spd });
                playEnemyShot();
            }
        }
        return e.y < H + 50;
    });

    enemyBullets = enemyBullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        return b.x > -10 && b.x < W + 10 && b.y > -10 && b.y < H + 10;
    });

    for (const b of enemyBullets) {
        if (Math.hypot(player.x - b.x, player.y - b.y) < 13) {
            triggerGameOver();
            return;
        }
    }

    outer:
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (Math.hypot(b.x - e.x, b.y - e.y) < e.size * 1.1) {
                e.hp--;
                bullets.splice(i, 1);
                if (e.hp <= 0) {
                    spawnExplosion(e.x, e.y, e.type === 'enemy' ? '#f88' : '#ffa040');
                    playExplosion(false);
                    kills++;
                    if (e.type === 'enemy') {
                        killsStation++;
                        document.getElementById('killsStation').textContent = killsStation;
                    } else {
                        killsComet++;
                        document.getElementById('killsComet').textContent = killsComet;
                    }
                    document.getElementById('kills').textContent = kills;
                    enemies.splice(j, 1);
                }
                continue outer;
            }
        }
    }

    for (const e of enemies) {
        if (Math.hypot(player.x - e.x, player.y - e.y) < e.size + 13) {
            triggerGameOver();
            return;
        }
    }

    particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.05;
        p.life -= 0.035;
        return p.life > 0;
    });

    const elapsed = Math.floor((Date.now() - startTime - pausedTotal) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById('timer').textContent = `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Draw ──────────────────────────────────────────────────
function draw() {
    ctx.fillStyle = '#03040f';
    ctx.fillRect(0, 0, W, H);

    for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 255, ${s.alpha})`;
        ctx.fill();
    }

    if (gameState === 'start') { drawStartScreen(); return; }

    for (const b of bullets) drawBullet(b);

    for (const b of enemyBullets) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ff4422';
        ctx.shadowColor = '#ff4422';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(b.x - b.vx * 1.5, b.y - b.vy * 1.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,100,50,0.4)';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();
    }

    for (const e of enemies) {
        if (e.type === 'comet') drawComet(e);
        else drawSpaceStation(e.x, e.y, e.size, e.rot);
    }

    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (gameState === 'playing') drawPlayer();

    if (gameState === 'paused')   drawPauseScreen();
    if (gameState === 'gameover') drawGameOverScreen();
}

// ── Screens ───────────────────────────────────────────────
function drawStartScreen() {
    ctx.fillStyle = 'rgba(0,0,20,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.font = 'bold 52px Courier New';
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 30;
    ctx.fillText('SPACE',   W / 2, H / 2 - 90);
    ctx.fillText('RAIDERS', W / 2, H / 2 - 35);

    ctx.shadowBlur = 0;
    ctx.font = '13px Courier New';
    ctx.fillStyle = '#055';
    ctx.fillText('─────────────────────────', W / 2, H / 2 + 5);

    ctx.fillStyle = '#0aa';
    ctx.font = '15px Courier New';
    ctx.fillText('← →  Bewegen',              W / 2, H / 2 + 38);
    ctx.fillText('LEERTASTE  Schießen',        W / 2, H / 2 + 62);
    ctx.fillText('Überlebe so lange wie möglich!', W / 2, H / 2 + 90);

    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.font = 'bold 18px Courier New';
        ctx.fillStyle = '#0ff';
        ctx.shadowColor = '#0ff';
        ctx.shadowBlur = 15;
        ctx.fillText('[ ENTER zum Starten ]', W / 2, H / 2 + 140);
    }
}

function drawPauseScreen() {
    ctx.fillStyle = 'rgba(0,0,15,0.70)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.font = 'bold 52px Courier New';
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 24;
    ctx.fillText('PAUSE', W / 2, H / 2 - 20);

    ctx.shadowBlur = 0;
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#0aa';
    ctx.fillText('P  oder  Button  zum Fortsetzen', W / 2, H / 2 + 26);
}

function drawGameOverScreen() {
    ctx.fillStyle = 'rgba(0,0,10,0.75)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';

    ctx.font = 'bold 58px Courier New';
    ctx.fillStyle = '#f33';
    ctx.shadowColor = '#f33';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', W / 2, H / 2 - 90);

    const elapsed = Math.floor((endTime - startTime - pausedTotal) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;

    ctx.shadowBlur = 0;
    ctx.font = '14px Courier New';
    ctx.fillStyle = '#055';
    ctx.fillText('─────────────────────────', W / 2, H / 2 - 40);

    ctx.font = '22px Courier New';
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillText(`Zeit: ${m}:${s.toString().padStart(2, '0')}`, W / 2, H / 2);
    ctx.fillText(`Abschüsse gesamt: ${kills}`,                  W / 2, H / 2 + 38);

    ctx.shadowBlur = 0;
    ctx.font = '12px Courier New';
    ctx.fillStyle = '#055';
    ctx.fillText('─────────────────────────', W / 2, H / 2 + 62);

    const col1 = W / 2 - 70;
    const col2 = W / 2 + 70;
    ctx.fillStyle = '#077';
    ctx.fillText('STATIONEN', col1, H / 2 + 80);
    ctx.fillText('KOMETEN',   col2, H / 2 + 80);

    ctx.font = 'bold 26px Courier New';
    ctx.fillStyle = '#f88';
    ctx.shadowColor = '#f88';
    ctx.shadowBlur = 10;
    ctx.fillText(killsStation, col1, H / 2 + 108);
    ctx.fillStyle = '#ffa040';
    ctx.shadowColor = '#ffa040';
    ctx.fillText(killsComet,   col2, H / 2 + 108);

    if (Math.floor(Date.now() / 600) % 2 === 0) {
        ctx.font = 'bold 16px Courier New';
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 12;
        ctx.fillText('[ ENTER zum Neustart ]', W / 2, H / 2 + 152);
    }
}

// ── Game Loop ─────────────────────────────────────────────
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

initStars();
gameState = 'start';
loop();
