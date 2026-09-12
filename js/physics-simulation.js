/**
 * ============================================================================
 * SIMULADOR FÍSICO INTERACTIVO PREMIUM: SISTEMA MASA-RESORTE Y FASOR ROTANTE
 * CON CÁLCULO DE ENERGÍA MECÁNICA, VECTORES DINÁMICOS Y ANIMACIÓN A 60 FPS
 * ============================================================================
 */

class PhysicsSimulation {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Parámetros físicos del sistema
    this.mass = 1.0;          // Masa m (kg)
    this.k = 25.0;            // Constante elástica k (N/m)
    this.A = 1.8;             // Amplitud inicial A (m)
    this.damping = 0.0;       // Amortiguamiento (0 para M.A.S. ideal puro)

    // Estado dinámico
    this.t = 0.0;
    this.x = this.A;
    this.v = 0.0;
    this.a = 0.0;

    // Estado del bucle de animación
    this.isPlaying = true;
    this.timeScale = 1.0;
    this.lastFrameTime = performance.now();

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupControls();
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  get omega() {
    return Math.sqrt(this.k / this.mass);
  }

  get period() {
    return (2 * Math.PI) / this.omega;
  }

  get frequency() {
    return 1 / this.period;
  }

  update(dt) {
    if (!this.isPlaying) return;

    // Integración analítica exacta para garantizar precisión infinita y conservación de energía en M.A.S.
    this.t += dt * this.timeScale;
    const w = this.omega;
    this.x = this.A * Math.cos(w * this.t);
    this.v = -this.A * w * Math.sin(w * this.t);
    this.a = -this.A * (w ** 2) * Math.cos(w * this.t);

    this.updateEnergyDashboard();
  }

  updateEnergyDashboard() {
    const Ek = 0.5 * this.mass * (this.v ** 2);
    const Ep = 0.5 * this.k * (this.x ** 2);
    const Em = Ek + Ep;

    const fillEk = document.getElementById('sim-bar-ek');
    const fillEp = document.getElementById('sim-bar-ep');
    const fillEm = document.getElementById('sim-bar-em');

    const numEk = document.getElementById('sim-val-ek');
    const numEp = document.getElementById('sim-val-ep');
    const numEm = document.getElementById('sim-val-em');

    const maxEnergy = 0.5 * this.k * (this.A ** 2) * 1.2 || 1;

    if (fillEk) fillEk.style.width = `${Math.min(100, (Ek / maxEnergy) * 100)}%`;
    if (fillEp) fillEp.style.width = `${Math.min(100, (Ep / maxEnergy) * 100)}%`;
    if (fillEm) fillEm.style.width = `${Math.min(100, (Em / maxEnergy) * 100)}%`;

    if (numEk) numEk.textContent = `${Ek.toFixed(2)} J`;
    if (numEp) numEp.textContent = `${Ep.toFixed(2)} J`;
    if (numEm) numEm.textContent = `${Em.toFixed(2)} J`;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Fondo tenue
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Configuración geométrica del simulador
    const wallX = 60;
    const floorY = h * 0.65;
    const equilibriumX = (w * 0.55);
    const pxPerMeter = (w * 0.18) / (this.A || 1);
    const massX = equilibriumX + (this.x * pxPerMeter);
    const massWidth = 70;
    const massHeight = 55;
    const massY = floorY - massHeight;

    // 1. Dibujar Pared Izquierda y Piso
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;

    // Pared con textura rayada de soporte rígido
    ctx.beginPath();
    ctx.moveTo(wallX, floorY - 140);
    ctx.lineTo(wallX, floorY);
    ctx.lineTo(w - 30, floorY);
    ctx.stroke();

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    for (let y = floorY - 130; y <= floorY; y += 14) {
      ctx.beginPath();
      ctx.moveTo(wallX - 12, y + 10);
      ctx.lineTo(wallX, y);
      ctx.stroke();
    }

    // 2. Línea de Equilibrio (x = 0)
    ctx.save();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(equilibriumX, floorY - 160);
    ctx.lineTo(equilibriumX, floorY + 30);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Equilibrio (x = 0)', equilibriumX, floorY + 20);

    // Líneas de Amplitud máxima (+A y -A)
    const leftLimitX = equilibriumX - (this.A * pxPerMeter);
    const rightLimitX = equilibriumX + (this.A * pxPerMeter);

    ctx.save();
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    ctx.beginPath();
    ctx.moveTo(leftLimitX, floorY - 100);
    ctx.lineTo(leftLimitX, floorY + 15);
    ctx.moveTo(rightLimitX, floorY - 100);
    ctx.lineTo(rightLimitX, floorY + 15);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ea580c';
    ctx.fillText('-A', leftLimitX, floorY + 16);
    ctx.fillText('+A', rightLimitX, floorY + 16);

    // 3. Resorte Helicoidal Realista
    this.drawHelicalSpring(ctx, wallX, floorY - massHeight / 2, massX, floorY - massHeight / 2);

    // 4. Bloque de Masa m
    ctx.save();
    const grad = ctx.createLinearGradient(massX, massY, massX + massWidth, massY + massHeight);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(massX, massY, massWidth, massHeight, 8);
    ctx.fill();
    ctx.stroke();

    // Rótulo de la masa
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`m = ${this.mass}kg`, massX + massWidth / 2, massY + massHeight / 2);
    ctx.restore();

    // 5. Vectores Dinámicos de Velocidad (Verde) y Aceleración (Rojo)
    const blockCenterX = massX + massWidth / 2;
    const blockCenterY = massY - 16;

    // Vector Velocidad v
    const vScale = 12;
    const vVectorLen = this.v * vScale;
    if (Math.abs(this.v) > 0.05) {
      this.drawArrow(ctx, blockCenterX, blockCenterY - 14, blockCenterX + vVectorLen, blockCenterY - 14, '#059669', `v = ${this.v.toFixed(1)} m/s`);
    }

    // Vector Aceleración a / Fuerza Restauradora F = -kx
    const aScale = 5;
    const aVectorLen = this.a * aScale;
    if (Math.abs(this.a) > 0.05) {
      this.drawArrow(ctx, blockCenterX, blockCenterY - 32, blockCenterX + aVectorLen, blockCenterY - 32, '#dc2626', `a = ${this.a.toFixed(1)} m/s²`);
    }

    // 6. Fasor Rotante en Miniatura (Relación M.A.S. con M.C.U.)
    this.drawPhasor(ctx, w * 0.16, floorY - 60);

    // 7. Lecturas de Estado Instantáneo
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${this.t.toFixed(2)} s`, 24, 28);
    ctx.fillText(`x(t) = ${this.x.toFixed(2)} m`, 24, 46);
    ctx.fillText(`v(t) = ${this.v.toFixed(2)} m/s`, 24, 64);
    ctx.fillText(`a(t) = ${this.a.toFixed(2)} m/s²`, 24, 82);
    ctx.fillText(`ω = ${this.omega.toFixed(2)} rad/s | T = ${this.period.toFixed(2)} s`, 24, 100);
  }

  drawHelicalSpring(ctx, x1, y1, x2, y2) {
    const totalLength = x2 - x1;
    const coils = 16;
    const springRadius = 16;

    ctx.save();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const leadIn = 18;
    const leadOut = 18;
    const springBodyLength = totalLength - leadIn - leadOut;

    ctx.lineTo(x1 + leadIn, y1);

    const step = springBodyLength / coils;
    for (let i = 0; i < coils; i++) {
      const cx1 = x1 + leadIn + (i + 0.25) * step;
      const cy1 = y1 - springRadius;
      const cx2 = x1 + leadIn + (i + 0.75) * step;
      const cy2 = y1 + springRadius;
      ctx.lineTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
    }

    ctx.lineTo(x2 - leadOut, y2);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  drawArrow(ctx, fromX, fromY, toX, toY, color, label) {
    const headLen = 9;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 10px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, (fromX + toX) / 2, fromY - 6);
    }
    ctx.restore();
  }

  drawPhasor(ctx, cx, cy) {
    const radius = 42;
    const phaseAngle = this.omega * this.t;

    ctx.save();
    // Círculo de referencia
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Ejes del círculo
    ctx.beginPath();
    ctx.moveTo(cx - radius - 5, cy);
    ctx.lineTo(cx + radius + 5, cy);
    ctx.moveTo(cx, cy - radius - 5);
    ctx.lineTo(cx, cy + radius + 5);
    ctx.stroke();

    // Vector fasor rotante
    const phasorX = cx + radius * Math.cos(phaseAngle);
    const phasorY = cy - radius * Math.sin(phaseAngle);

    ctx.strokeStyle = '#7c3aed';
    ctx.fillStyle = '#7c3aed';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(phasorX, phasorY);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(phasorX, phasorY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Proyección sobre el eje horizontal
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(phasorX, phasorY);
    ctx.lineTo(phasorX, cy);
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.arc(phasorX, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '9px "Outfit", sans-serif';
    ctx.fillStyle = '#6d28d9';
    ctx.textAlign = 'center';
    ctx.fillText('Fasor A', cx, cy + radius + 15);
    ctx.restore();
  }

  loop() {
    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05); // cap dt a 50ms para estabilidad
    this.lastFrameTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame(() => this.loop());
  }

  setupControls() {
    const btnPlay = document.getElementById('sim-btn-play');
    const btnPause = document.getElementById('sim-btn-pause');
    const btnReset = document.getElementById('sim-btn-reset');
    const btnStep = document.getElementById('sim-btn-step');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        this.isPlaying = true;
        btnPlay.classList.add('primary');
        if (btnPause) btnPause.classList.remove('primary');
      });
    }

    if (btnPause) {
      btnPause.addEventListener('click', () => {
        this.isPlaying = false;
        btnPause.classList.add('primary');
        if (btnPlay) btnPlay.classList.remove('primary');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.t = 0;
        this.x = this.A;
        this.v = 0;
        this.a = -this.A * (this.omega ** 2);
        this.updateEnergyDashboard();
        this.draw();
      });
    }

    if (btnStep) {
      btnStep.addEventListener('click', () => {
        this.isPlaying = false;
        if (btnPause) btnPause.classList.add('primary');
        if (btnPlay) btnPlay.classList.remove('primary');
        this.update(0.05);
        this.draw();
      });
    }

    // Sliders de masa y constante k
    const sliderMass = document.getElementById('sim-slider-mass');
    const sliderK = document.getElementById('sim-slider-k');
    const sliderA = document.getElementById('sim-slider-amp');

    const valMass = document.getElementById('sim-val-mass');
    const valK = document.getElementById('sim-val-k');
    const valA = document.getElementById('sim-val-amp');

    if (sliderMass) {
      sliderMass.addEventListener('input', (e) => {
        this.mass = parseFloat(e.target.value);
        if (valMass) valMass.textContent = `${this.mass.toFixed(1)} kg`;
      });
    }

    if (sliderK) {
      sliderK.addEventListener('input', (e) => {
        this.k = parseFloat(e.target.value);
        if (valK) valK.textContent = `${this.k.toFixed(0)} N/m`;
      });
    }

    if (sliderA) {
      sliderA.addEventListener('input', (e) => {
        this.A = parseFloat(e.target.value);
        if (valA) valA.textContent = `${this.A.toFixed(1)} m`;
      });
    }
  }
}

window.PhysicsSimulation = PhysicsSimulation;
