/* ========================================
   神秘之湖幸運物 - JavaScript
   ======================================== */

'use strict';

/* ── 元素顏色對照表 ── */
const ELEMENT_COLORS = {
  water: { r: 79,  g: 195, b: 247 },
  fire:  { r: 206, g: 147, b: 216 },
  earth: { r: 129, g: 199, b: 132 },
  wind:  { r: 255, g: 241, b: 118 },
  moon:  { r: 176, g: 190, b: 197 },
  sun:   { r: 255, g: 183, b: 77  },
};

const WISH_MESSAGES = [
  '湖面微微顫動，願望正在傳遞…',
  '水中倒影閃爍，幸運已感受到你的心意',
  '波紋擴散到遠方，祝福與你同行',
  '幸運幣沉入深處，帶走了你的心願',
  '湖底傳來回應，美好即將到來',
  '神秘之湖靜靜聆聽，願望已被收藏',
  '每一圈漣漪都是一個祝福',
];

/* ════════════════════════════════════════
   1. 全螢幕背景湖面 Canvas
   ════════════════════════════════════════ */
class LakeBackground {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx    = canvasEl.getContext('2d');
    this.waves  = [];
    this.time   = 0;
    this.resize();
    this.initWaves();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  initWaves() {
    /* 建立 5 層流動的正弦波帶 */
    this.waves = Array.from({ length: 5 }, (_, i) => ({
      amplitude: 18 + i * 8,
      period:    0.006 - i * 0.0008,
      speed:     0.012 + i * 0.004,
      yOffset:   this.H * (0.55 + i * 0.09),
      alpha:     0.04 + i * 0.018,
      phase:     (Math.PI * 2 / 5) * i,
    }));
  }

  drawWaves() {
    const { ctx, W, H, time } = this;

    /* 深邃水底漸層背景 */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#050d1a');
    bg.addColorStop(0.4, '#071628');
    bg.addColorStop(0.7, '#06233a');
    bg.addColorStop(1,   '#041520');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 微光反射層（斜向掃描） */
    const glintX = (Math.sin(time * 0.3) * 0.5 + 0.5) * W;
    const glint  = ctx.createRadialGradient(glintX, H * 0.4, 0, glintX, H * 0.4, W * 0.6);
    glint.addColorStop(0,   'rgba(79,195,247,0.04)');
    glint.addColorStop(0.5, 'rgba(79,195,247,0.02)');
    glint.addColorStop(1,   'transparent');
    ctx.fillStyle = glint;
    ctx.fillRect(0, 0, W, H);

    /* 波浪 */
    this.waves.forEach((w) => {
      ctx.beginPath();
      ctx.moveTo(0, w.yOffset);

      for (let x = 0; x <= W; x += 4) {
        const y = w.yOffset
          + Math.sin(x * w.period + w.phase + time * w.speed) * w.amplitude
          + Math.sin(x * w.period * 1.7 + time * w.speed * 0.6) * (w.amplitude * 0.4);
        ctx.lineTo(x, y);
      }

      ctx.lineTo(W, H);
      ctx.lineTo(0, H);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, w.yOffset - w.amplitude, 0, H);
      grad.addColorStop(0,   `rgba(79,195,247,${w.alpha})`);
      grad.addColorStop(0.3, `rgba(10,100,180,${w.alpha * 0.8})`);
      grad.addColorStop(1,   `rgba(4,21,32,${w.alpha * 0.3})`);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  }

  /* 水面浮動的微小光點 */
  drawSparkles() {
    if (!this._sparkles) {
      this._sparkles = Array.from({ length: 60 }, () => ({
        x: Math.random() * this.W,
        y: Math.random() * this.H * 0.7,
        r: Math.random() * 1.5 + 0.3,
        speed: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
      }));
    }
    const { ctx, time } = this;
    this._sparkles.forEach((s) => {
      const alpha = (Math.sin(time * s.speed + s.phase) * 0.5 + 0.5) * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y + Math.sin(time * 0.4 + s.phase) * 6, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,240,255,${alpha})`;
      ctx.fill();
    });
  }

  animate() {
    this.time += 0.016;
    this.drawWaves();
    this.drawSparkles();
    requestAnimationFrame(() => this.animate());
  }
}

/* ════════════════════════════════════════
   2. 許願池 Canvas（互動式漣漪）
   ════════════════════════════════════════ */
class WishPool {
  constructor(canvasEl) {
    this.canvas  = canvasEl;
    this.ctx     = canvasEl.getContext('2d');
    this.ripples = [];   /* 點擊漣漪 */
    this.bubbles = [];   /* 浮動水泡 */
    this.time    = 0;
    this.resize();
    this.initBubbles();
    this.canvas.parentElement.addEventListener('click', (e) => this.onClick(e));
    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width  = rect.width  || 500;
    this.canvas.height = rect.height || 275;
    this.W = this.canvas.width;
    this.H = this.canvas.height;
  }

  initBubbles() {
    this.bubbles = Array.from({ length: 12 }, () => this.makeBubble());
  }

  makeBubble() {
    return {
      x:     Math.random() * this.W,
      y:     this.H + Math.random() * 20,
      r:     Math.random() * 4 + 1.5,
      speed: Math.random() * 0.5 + 0.3,
      alpha: Math.random() * 0.4 + 0.15,
      drift: (Math.random() - 0.5) * 0.5,
    };
  }

  onClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.W / rect.width);
    const y = (e.clientY - rect.top)  * (this.H / rect.height);

    /* 在點擊位置加入多圈漣漪 */
    for (let i = 0; i < 3; i++) {
      this.ripples.push({
        x, y,
        r: 0,
        maxR: 80 + i * 40,
        alpha: 0.7 - i * 0.15,
        speed: 1.8 + i * 0.5,
        delay: i * 6,
        age:   0,
      });
    }

    /* 拋出金幣動畫 */
    this.spawnCoin(x, y);
    /* 更新許願訊息 */
    showWishMessage();
  }

  spawnCoin(x, y) {
    const container = document.getElementById('wishCoins');
    const coin = document.createElement('div');
    coin.className = 'wish-coin';
    coin.textContent = '🪙';
    const rect = this.canvas.getBoundingClientRect();
    coin.style.left = `${(x / this.W) * 100}%`;
    coin.style.top  = `${(y / this.H) * 100}%`;
    container.appendChild(coin);
    coin.addEventListener('animationend', () => coin.remove());
  }

  drawBackground() {
    const { ctx, W, H, time } = this;
    /* 橢圓形水面底色 */
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.6);
    grad.addColorStop(0,   '#0a3060');
    grad.addColorStop(0.5, '#062040');
    grad.addColorStop(1,   '#030f20');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    /* 動態光暈掃描 */
    const hx = W/2 + Math.sin(time * 0.4) * W * 0.3;
    const hy = H/2 + Math.cos(time * 0.25) * H * 0.2;
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, W * 0.4);
    halo.addColorStop(0,   'rgba(79,195,247,0.12)');
    halo.addColorStop(0.6, 'rgba(79,195,247,0.04)');
    halo.addColorStop(1,   'transparent');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    /* 細緻波紋底紋 */
    for (let i = 0; i < 4; i++) {
      const y0 = H * (0.3 + i * 0.18) + Math.sin(time * 0.8 + i) * 4;
      ctx.beginPath();
      ctx.moveTo(0, y0);
      for (let x = 0; x <= W; x += 3) {
        ctx.lineTo(x, y0 + Math.sin(x * 0.03 + time * 1.2 + i) * 3);
      }
      ctx.strokeStyle = `rgba(79,195,247,${0.05 + i * 0.02})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  drawRipples() {
    const { ctx } = this;
    this.ripples = this.ripples.filter((rp) => {
      rp.age++;
      if (rp.age < rp.delay) return true;

      const progress = (rp.r / rp.maxR);
      const alpha    = rp.alpha * (1 - progress);
      if (alpha <= 0) return false;

      rp.r += rp.speed;

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150,220,255,${alpha})`;
      ctx.lineWidth   = 1.5 * (1 - progress * 0.5);
      ctx.stroke();

      /* 內層高光線 */
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.3})`;
      ctx.lineWidth   = 0.5;
      ctx.stroke();

      return rp.r < rp.maxR;
    });
  }

  drawBubbles() {
    const { ctx } = this;
    this.bubbles.forEach((b, i) => {
      b.y    -= b.speed;
      b.x    += b.drift;
      b.alpha = Math.max(0, b.alpha - 0.001);

      if (b.y < -10 || b.alpha <= 0) {
        this.bubbles[i] = this.makeBubble();
        return;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(150,220,255,${b.alpha})`;
      ctx.lineWidth   = 0.8;
      ctx.stroke();

      /* 高光點 */
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${b.alpha * 0.6})`;
      ctx.fill();
    });
  }

  /* 固定漣漪環（背景氛圍） */
  drawAmbientRings() {
    const { ctx, W, H, time } = this;
    for (let i = 0; i < 3; i++) {
      const phase = time * 0.4 + (Math.PI * 2 / 3) * i;
      const r     = 30 + i * 25 + Math.sin(phase) * 8;
      const alpha = 0.06 + Math.sin(phase) * 0.03;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(79,195,247,${alpha})`;
      ctx.lineWidth   = 1;
      ctx.stroke();
    }
  }

  animate() {
    this.time += 0.016;
    const { ctx, W, H } = this;
    ctx.clearRect(0, 0, W, H);
    this.drawBackground();
    this.drawAmbientRings();
    this.drawBubbles();
    this.drawRipples();
    requestAnimationFrame(() => this.animate());
  }
}

/* ════════════════════════════════════════
   3. 背景浮動粒子
   ════════════════════════════════════════ */
function initBgParticles() {
  const container = document.getElementById('bgParticles');
  const count = 35;

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'bg-particle';

    const size  = Math.random() * 4 + 1.5;
    const colors = [
      'rgba(79,195,247,0.5)',
      'rgba(150,180,255,0.4)',
      'rgba(206,147,216,0.4)',
      'rgba(255,255,255,0.3)',
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    Object.assign(el.style, {
      width:    `${size}px`,
      height:   `${size}px`,
      left:     `${Math.random() * 100}%`,
      top:      `${Math.random() * 100}%`,
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      '--dur':    `${6 + Math.random() * 8}s`,
      '--delay':  `${Math.random() * 8}s`,
      '--max-op': `${0.3 + Math.random() * 0.5}`,
    });

    container.appendChild(el);
  }
}

/* ════════════════════════════════════════
   4. 幸運物卡片互動
   ════════════════════════════════════════ */
function initCards() {
  document.querySelectorAll('.lucky-card').forEach((card) => {
    const element = card.dataset.element;
    const color   = ELEMENT_COLORS[element] || ELEMENT_COLORS.water;
    const inner   = card.querySelector('.card-inner');
    const rippleC = card.querySelector('.card-ripple-container');
    const fpEl    = card.querySelector('.floating-particles');

    /* ── 懸停：3D 視差追蹤 ── */
    card.addEventListener('mousemove', (e) => {
      const rect = inner.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);

      inner.style.transform =
        `translateY(-10px) scale(1.03) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      inner.style.transform = '';
      /* 離開時清除浮動粒子 */
      fpEl.innerHTML = '';
    });

    /* 懸停進入：生成浮動粒子 */
    card.addEventListener('mouseenter', () => {
      spawnFloatingParticles(fpEl, color);
    });

    /* ── 點擊：漣漪 + 火花 + 搖晃 ── */
    card.addEventListener('click', (e) => {
      /* 卡片內漣漪 */
      createCardRipple(rippleC, e, color);
      /* 全域火花 */
      createClickSparks(e.clientX, e.clientY, color);
      /* 圖示搖晃 */
      card.classList.remove('clicked');
      void card.offsetWidth;
      card.classList.add('clicked');
      card.addEventListener('animationend', () => card.classList.remove('clicked'), { once: true });
    });
  });
}

/* 卡片內漣漪 */
function createCardRipple(container, e, color) {
  const rect   = container.getBoundingClientRect();
  const x      = e.clientX - rect.left;
  const y      = e.clientY - rect.top;
  const ripple = document.createElement('div');
  const size   = Math.max(rect.width, rect.height) * 2;

  ripple.className = 'ripple';
  Object.assign(ripple.style, {
    width:      `${size}px`,
    height:     `${size}px`,
    left:       `${x - size / 2}px`,
    top:        `${y - size / 2}px`,
    background: `rgba(${color.r},${color.g},${color.b},0.25)`,
  });

  container.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* 全域點擊火花 */
function createClickSparks(cx, cy, color) {
  const layer  = document.getElementById('clickEffects');
  const count  = 14;

  /* 爆開光圈 */
  const burst = document.createElement('div');
  burst.className = 'click-burst';
  Object.assign(burst.style, {
    left:        `${cx}px`,
    top:         `${cy}px`,
    borderColor: `rgba(${color.r},${color.g},${color.b},0.8)`,
    width:       '10px',
    height:      '10px',
  });
  layer.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove());

  /* 放射火花 */
  for (let i = 0; i < count; i++) {
    const angle  = (Math.PI * 2 / count) * i;
    const dist   = 50 + Math.random() * 60;
    const spark  = document.createElement('div');
    spark.className = 'click-spark';

    Object.assign(spark.style, {
      left:       `${cx}px`,
      top:        `${cy}px`,
      background: `rgb(${color.r},${color.g},${color.b})`,
      boxShadow:  `0 0 6px rgb(${color.r},${color.g},${color.b})`,
      '--tx':     `${Math.cos(angle) * dist}px`,
      '--ty':     `${Math.sin(angle) * dist}px`,
      '--dur':    `${0.5 + Math.random() * 0.4}s`,
    });

    layer.appendChild(spark);
    spark.addEventListener('animationend', () => spark.remove());
  }
}

/* 懸停浮動粒子（持續生成） */
function spawnFloatingParticles(container, color) {
  let active = true;

  const spawnOne = () => {
    if (!active || !container.isConnected) return;

    const p  = document.createElement('div');
    const sz = Math.random() * 5 + 2;
    const x  = Math.random() * 100;
    const dur = 1.2 + Math.random() * 1.5;

    Object.assign(p.style, {
      position:   'absolute',
      left:       `${x}%`,
      bottom:     '0',
      width:      `${sz}px`,
      height:     `${sz}px`,
      borderRadius: '50%',
      background: `rgba(${color.r},${color.g},${color.b},0.7)`,
      boxShadow:  `0 0 ${sz * 2}px rgba(${color.r},${color.g},${color.b},0.5)`,
      pointerEvents: 'none',
      animation:  `floatUp ${dur}s ease-out forwards`,
    });

    container.appendChild(p);
    setTimeout(() => p.remove(), dur * 1000);
    if (active) setTimeout(spawnOne, 150 + Math.random() * 200);
  };

  spawnOne();

  /* 離開時停止 */
  const card = container.closest('.lucky-card');
  card.addEventListener('mouseleave', () => { active = false; }, { once: true });
}

/* ════════════════════════════════════════
   5. 許願訊息輪播
   ════════════════════════════════════════ */
let msgIndex = 0;
function showWishMessage() {
  const el   = document.getElementById('wishMessage');
  const span = el.querySelector('.wish-text');

  /* 淡出 */
  span.style.opacity   = '0';
  span.style.transform = 'translateY(8px)';

  setTimeout(() => {
    span.textContent = WISH_MESSAGES[msgIndex % WISH_MESSAGES.length];
    span.classList.add('active');
    span.style.opacity   = '1';
    span.style.transform = 'translateY(0)';
    msgIndex++;
  }, 320);

  clearTimeout(showWishMessage._timer);
  showWishMessage._timer = setTimeout(() => {
    span.style.opacity   = '0';
    span.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      span.classList.remove('active');
      span.style.opacity   = '1';
      span.style.transform = 'translateY(0)';
    }, 500);
  }, 5000);
}

/* ════════════════════════════════════════
   6. 視差滾動（僅調整 translateY，不干擾懸停 3D）
   ════════════════════════════════════════ */
function initParallax() {
  const cards = document.querySelectorAll('.lucky-card');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    cards.forEach((card, i) => {
      /* 只在非懸停狀態調整，避免覆蓋 mousemove 3D transform */
      if (!card.matches(':hover')) {
        const offset = (i % 2 === 0 ? 1 : -1) * scrollY * 0.025;
        card.style.setProperty('--parallax-y', `${offset}px`);
      }
    });
  }, { passive: true });
}

/* ════════════════════════════════════════
   8. 卡片進場觀察器（Intersection Observer）
   ════════════════════════════════════════ */
function initRevealObserver() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.lucky-card').forEach((card) => {
    card.style.animationPlayState = 'paused';
    io.observe(card);
  });
}

/* ════════════════════════════════════════
   初始化
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* 背景湖面 */
  new LakeBackground(document.getElementById('lakeCanvas'));

  /* 許願池（稍微延遲確保容器尺寸已確定） */
  setTimeout(() => new WishPool(document.getElementById('poolCanvas')), 50);

  /* 背景粒子 */
  initBgParticles();

  /* 卡片互動 */
  initCards();

  /* 視差 */
  initParallax();

  /* 卡片進場觀察 */
  initRevealObserver();

  /* 許願文字初始 transition */
  const wishSpan = document.querySelector('.wish-text');
  if (wishSpan) {
    wishSpan.style.transition = 'all 0.5s ease';
    wishSpan.style.display = 'inline-block';
  }
});
