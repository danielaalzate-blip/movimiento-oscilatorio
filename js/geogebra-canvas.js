/**
 * ============================================================================
 * MOTOR GRÁFICO ESTILO GEOGEBRA CON CUADRÍCULA MILIMETRADA, ZOOM, PAN,
 * ESCALAS INDEPENDIENTES, PALETA DE ESTILOS Y RE-ESCALAMIENTO MANUAL DE EJES
 * ============================================================================
 */

class GeoGebraGrapher {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById(containerId);

    // Parámetros físicos del M.A.S.
    this.params = {
      A: 2.0,      // Amplitud (m)
      omega: 2.0,  // Frecuencia angular (rad/s)
      phi: 0.0     // Ángulo de fase inicial (rad)
    };

    // Visibilidad de funciones
    this.showPos = true;
    this.showVel = true;
    this.showAcc = true;

    // Estilos gráficos configurables por el usuario
    this.styles = {
      pos: { color: '#2563eb', width: 2.5, style: 'solid' },
      vel: { color: '#059669', width: 2.0, style: 'dashed' },
      acc: { color: '#dc2626', width: 2.0, style: 'dotted' },
      gridMajorColor: 'rgba(70, 85, 105, 0.28)',
      gridMinorColor: 'rgba(120, 140, 160, 0.12)',
      axisColor: '#1e293b',
      paperColor: '#fafbfc'
    };

    // Estado de la vista y escalas
    this.view = {
      offsetX: 80,         // Posición del origen X en píxeles
      offsetY: 240,        // Posición del origen Y en píxeles
      scaleX: 70,          // Píxeles por unidad en eje X (segundos)
      scaleY: 50,          // Píxeles por unidad en eje Y (metros, m/s, m/s^2)
      minScale: 15,
      maxScale: 300
    };

    // Herramienta activa: 'select' (inspector), 'pan' (arrastrar)
    this.activeTool = 'pan';

    // Estado del mouse / touch
    this.isDragging = false;
    this.dragMode = null; // 'pan', 'scaleX', 'scaleY'
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.hoverX = null;
    this.hoverY = null;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      this.draw();
    });

    this.setupEvents();
    this.setupControls();
    this.draw();
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

    // Centrar o ajustar origen vertical inicial
    if (!this.initializedView) {
      this.view.offsetY = this.height / 2;
      this.initializedView = true;
    }
  }

  setupEvents() {
    const el = this.canvas;

    el.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => this.onPointerUp());

    // Soporte táctil para móviles y tablets
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        this.onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('touchend', () => this.onPointerUp());

    // Zoom con rueda del ratón
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.zoomAt(mouseX, mouseY, zoomFactor, zoomFactor);
    }, { passive: false });
  }

  onPointerDown(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    this.lastMouseX = x;
    this.lastMouseY = y;
    this.isDragging = true;

    // Detectar si se está haciendo clic sobre los ejes para re-escalamiento manual directo
    const distToAxisY = Math.abs(x - this.view.offsetX);
    const distToAxisX = Math.abs(y - this.view.offsetY);

    if (distToAxisY < 20 && distToAxisX > 25) {
      this.dragMode = 'scaleY'; // Arrastrando eje Y: reescala escala vertical
    } else if (distToAxisX < 20 && distToAxisY > 25) {
      this.dragMode = 'scaleX'; // Arrastrando eje X: reescala escala horizontal
    } else {
      this.dragMode = 'pan';    // Arrastrar todo el lienzo
    }
  }

  onPointerMove(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (x >= 0 && x <= this.width && y >= 0 && y <= this.height) {
      this.hoverX = x;
      this.hoverY = y;
      this.updateCoordinatesDisplay();
    } else {
      this.hoverX = null;
      this.hoverY = null;
    }

    if (this.isDragging) {
      const dx = x - this.lastMouseX;
      const dy = y - this.lastMouseY;

      if (this.dragMode === 'pan') {
        this.view.offsetX += dx;
        this.view.offsetY += dy;
      } else if (this.dragMode === 'scaleX') {
        const factor = 1 + (dx / 100);
        this.view.scaleX = Math.max(this.view.minScale, Math.min(this.view.maxScale, this.view.scaleX * factor));
      } else if (this.dragMode === 'scaleY') {
        const factor = 1 - (dy / 100);
        this.view.scaleY = Math.max(this.view.minScale, Math.min(this.view.maxScale, this.view.scaleY * factor));
      }

      this.lastMouseX = x;
      this.lastMouseY = y;
      this.draw();
    } else {
      // Si no arrastra pero pasa sobre los ejes, cambiar cursor para indicar reescalamiento
      const distToAxisY = Math.abs(x - this.view.offsetX);
      const distToAxisX = Math.abs(y - this.view.offsetY);
      if (distToAxisY < 20 && distToAxisX > 25) {
        this.canvas.style.cursor = 'ns-resize';
      } else if (distToAxisX < 20 && distToAxisY > 25) {
        this.canvas.style.cursor = 'ew-resize';
      } else if (this.activeTool === 'pan') {
        this.canvas.style.cursor = 'grab';
      } else {
        this.canvas.style.cursor = 'crosshair';
      }
      this.draw();
    }
  }

  onPointerUp() {
    this.isDragging = false;
    this.dragMode = null;
    if (this.activeTool === 'pan') {
      this.canvas.style.cursor = 'grab';
    } else {
      this.canvas.style.cursor = 'crosshair';
    }
    this.draw();
  }

  zoomAt(x, y, factorX, factorY) {
    const worldX = (x - this.view.offsetX) / this.view.scaleX;
    const worldY = (this.view.offsetY - y) / this.view.scaleY;

    this.view.scaleX = Math.max(this.view.minScale, Math.min(this.view.maxScale, this.view.scaleX * factorX));
    this.view.scaleY = Math.max(this.view.minScale, Math.min(this.view.maxScale, this.view.scaleY * factorY));

    this.view.offsetX = x - worldX * this.view.scaleX;
    this.view.offsetY = y + worldY * this.view.scaleY;

    this.draw();
  }

  zoomIn() {
    this.zoomAt(this.width / 2, this.height / 2, 1.25, 1.25);
  }

  zoomOut() {
    this.zoomAt(this.width / 2, this.height / 2, 0.8, 0.8);
  }

  resetView() {
    this.view.offsetX = 80;
    this.view.offsetY = this.height / 2;
    this.view.scaleX = 70;
    this.view.scaleY = 50;
    this.draw();
  }

  // Conversión Mundo -> Pantalla y Pantalla -> Mundo
  toScreenX(t) { return this.view.offsetX + t * this.view.scaleX; }
  toScreenY(val) { return this.view.offsetY - val * this.view.scaleY; }
  toWorldX(px) { return (px - this.view.offsetX) / this.view.scaleX; }
  toWorldY(py) { return (this.view.offsetY - py) / this.view.scaleY; }

  // Funciones cinemáticas teóricas exactas del M.A.S.
  getPos(t) {
    return this.params.A * Math.cos(this.params.omega * t + this.params.phi);
  }

  getVel(t) {
    return -this.params.A * this.params.omega * Math.sin(this.params.omega * t + this.params.phi);
  }

  getAcc(t) {
    return -this.params.A * (this.params.omega ** 2) * Math.cos(this.params.omega * t + this.params.phi);
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Fondo estilo papel blanco/milimetrado
    ctx.fillStyle = this.styles.paperColor;
    ctx.fillRect(0, 0, w, h);

    // 1. Cuadrícula Menor (Estilo papel milimetrado con subdivisiones)
    this.drawMillimeterGrid(ctx, w, h);

    // 2. Ejes Cartesianos con Reglas, Ticks y Números
    this.drawAxes(ctx, w, h);

    // 3. Gráficas cinemáticas
    if (this.showPos) this.plotFunction(ctx, (t) => this.getPos(t), this.styles.pos);
    if (this.showVel) this.plotFunction(ctx, (t) => this.getVel(t), this.styles.vel);
    if (this.showAcc) this.plotFunction(ctx, (t) => this.getAcc(t), this.styles.acc);

    // 4. Cursor inspector o punto destacado
    if (this.hoverX !== null) {
      this.drawInspector(ctx);
    }
  }

  drawMillimeterGrid(ctx, w, h) {
    const stepX = this.getGridStep(this.view.scaleX);
    const stepY = this.getGridStep(this.view.scaleY);

    const minT = this.toWorldX(0);
    const maxT = this.toWorldX(w);
    const minVal = this.toWorldY(h);
    const maxVal = this.toWorldY(0);

    // Cuadrícula menor (subdivisiones de 5 por división mayor, estilo milimetrado)
    ctx.strokeStyle = this.styles.gridMinorColor;
    ctx.lineWidth = 0.8;
    const subStepX = stepX / 5;
    const subStepY = stepY / 5;

    ctx.beginPath();
    const startSubX = Math.floor(minT / subStepX) * subStepX;
    for (let t = startSubX; t <= maxT; t += subStepX) {
      const sx = this.toScreenX(t);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    const startSubY = Math.floor(minVal / subStepY) * subStepY;
    for (let v = startSubY; v <= maxVal; v += subStepY) {
      const sy = this.toScreenY(v);
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // Cuadrícula mayor (divisiones principales)
    ctx.strokeStyle = this.styles.gridMajorColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const startX = Math.floor(minT / stepX) * stepX;
    for (let t = startX; t <= maxT; t += stepX) {
      const sx = this.toScreenX(t);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    const startY = Math.floor(minVal / stepY) * stepY;
    for (let v = startY; v <= maxVal; v += stepY) {
      const sy = this.toScreenY(v);
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();
  }

  getGridStep(scale) {
    // Calcula escalonamiento limpio (1, 2, 5, 0.5, 0.2, etc.)
    const roughStep = 75 / scale;
    const power = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const fraction = roughStep / power;

    if (fraction <= 1.5) return 1 * power;
    if (fraction <= 3.5) return 2 * power;
    if (fraction <= 7.5) return 5 * power;
    return 10 * power;
  }

  drawAxes(ctx, w, h) {
    const originX = this.view.offsetX;
    const originY = this.view.offsetY;

    ctx.save();
    ctx.strokeStyle = this.styles.axisColor;
    ctx.fillStyle = this.styles.axisColor;
    ctx.lineWidth = 2.0;

    // Eje X (Tiempo t)
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();

    // Flecha del Eje X
    ctx.beginPath();
    ctx.moveTo(w - 10, originY - 5);
    ctx.lineTo(w, originY);
    ctx.lineTo(w - 10, originY + 5);
    ctx.fill();

    // Eje Y (Magnitud física)
    ctx.beginPath();
    ctx.moveTo(originX, h);
    ctx.lineTo(originX, 0);
    ctx.stroke();

    // Flecha del Eje Y
    ctx.beginPath();
    ctx.moveTo(originX - 5, 10);
    ctx.lineTo(originX, 0);
    ctx.lineTo(originX + 5, 10);
    ctx.fill();

    // Ticks y números en Eje X
    const stepX = this.getGridStep(this.view.scaleX);
    const minT = this.toWorldX(0);
    const maxT = this.toWorldX(w);
    const startX = Math.floor(minT / stepX) * stepX;

    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let t = startX; t <= maxT; t += stepX) {
      if (Math.abs(t) < 1e-6) continue; // el 0 se escribe aparte
      const sx = this.toScreenX(t);
      // Marca / tick
      ctx.beginPath();
      ctx.moveTo(sx, originY - 4);
      ctx.lineTo(sx, originY + 4);
      ctx.stroke();

      // Número
      const numStr = Number(t.toFixed(2)).toString();
      ctx.fillText(numStr, sx, Math.min(Math.max(originY + 6, 12), h - 22));
    }

    // Ticks y números en Eje Y
    const stepY = this.getGridStep(this.view.scaleY);
    const minVal = this.toWorldY(h);
    const maxVal = this.toWorldY(0);
    const startY = Math.floor(minVal / stepY) * stepY;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let v = startY; v <= maxVal; v += stepY) {
      if (Math.abs(v) < 1e-6) continue;
      const sy = this.toScreenY(v);
      // Marca / tick
      ctx.beginPath();
      ctx.moveTo(originX - 4, sy);
      ctx.lineTo(originX + 4, sy);
      ctx.stroke();

      // Número
      const numStr = Number(v.toFixed(2)).toString();
      ctx.fillText(numStr, Math.max(originX - 7, 30), sy);
    }

    // Rótulo del Origen (0,0)
    ctx.fillText('0', originX - 6, originY + 6);

    // Rótulos de los ejes
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.fillText('t (s)', w - 16, Math.min(Math.max(originY + 16, 18), h - 14));
    ctx.textAlign = 'left';
    ctx.fillText('x, v, a (S.I.)', Math.max(originX + 8, 12), 16);

    ctx.restore();
  }

  plotFunction(ctx, fn, style) {
    ctx.save();
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;

    if (style.style === 'dashed') {
      ctx.setLineDash([6, 4]);
    } else if (style.style === 'dotted') {
      ctx.setLineDash([2, 3]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    let started = false;

    // Muestreo con paso fino para curvas suaves de alta precisión
    const stepPx = 1.5;
    for (let px = 0; px <= this.width; px += stepPx) {
      const t = this.toWorldX(px);
      const val = fn(t);
      const py = this.toScreenY(val);

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawInspector(ctx) {
    const t = this.toWorldX(this.hoverX);
    if (t < -5 || t > 20) return;

    ctx.save();
    // Línea guía vertical
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(this.hoverX, 0);
    ctx.lineTo(this.hoverX, this.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Puntos sobre las curvas
    const renderPoint = (val, color) => {
      const py = this.toScreenY(val);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.hoverX, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    if (this.showPos) renderPoint(this.getPos(t), this.styles.pos.color);
    if (this.showVel) renderPoint(this.getVel(t), this.styles.vel.color);
    if (this.showAcc) renderPoint(this.getAcc(t), this.styles.acc.color);

    ctx.restore();
  }

  updateCoordinatesDisplay() {
    const coordsEl = document.getElementById('geo-coords-val');
    if (!coordsEl || this.hoverX === null) return;

    const t = this.toWorldX(this.hoverX);
    const x = this.getPos(t);
    const v = this.getVel(t);
    const a = this.getAcc(t);

    coordsEl.textContent = `t = ${t.toFixed(2)}s | x = ${x.toFixed(2)}m | v = ${v.toFixed(2)}m/s | a = ${a.toFixed(2)}m/s²`;
  }

  setupControls() {
    // Botones de la barra flotante GeoGebra
    const btnZoomIn = document.getElementById('geo-btn-zoomin');
    const btnZoomOut = document.getElementById('geo-btn-zoomout');
    const btnPan = document.getElementById('geo-btn-pan');
    const btnSelect = document.getElementById('geo-btn-select');
    const btnReset = document.getElementById('geo-btn-reset');
    const btnPalette = document.getElementById('geo-btn-palette');

    if (btnZoomIn) btnZoomIn.addEventListener('click', () => this.zoomIn());
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => this.zoomOut());
    if (btnReset) btnReset.addEventListener('click', () => this.resetView());

    if (btnPan && btnSelect) {
      btnPan.addEventListener('click', () => {
        this.activeTool = 'pan';
        btnPan.classList.add('active');
        btnSelect.classList.remove('active');
        this.canvas.style.cursor = 'grab';
      });
      btnSelect.addEventListener('click', () => {
        this.activeTool = 'select';
        btnSelect.classList.add('active');
        btnPan.classList.remove('active');
        this.canvas.style.cursor = 'crosshair';
      });
    }

    // Modal de la paleta gráfica
    const paletteModal = document.getElementById('geo-palette-modal');
    const paletteClose = document.getElementById('geo-palette-close');
    if (btnPalette && paletteModal) {
      btnPalette.addEventListener('click', () => {
        paletteModal.classList.toggle('visible');
      });
    }
    if (paletteClose && paletteModal) {
      paletteClose.addEventListener('click', () => {
        paletteModal.classList.remove('visible');
      });
    }

    // Controles de visibilidad de funciones (Pills)
    const chkPos = document.getElementById('geo-chk-pos');
    const chkVel = document.getElementById('geo-chk-vel');
    const chkAcc = document.getElementById('geo-chk-acc');

    if (chkPos) chkPos.addEventListener('change', (e) => { this.showPos = e.target.checked; this.draw(); });
    if (chkVel) chkVel.addEventListener('change', (e) => { this.showVel = e.target.checked; this.draw(); });
    if (chkAcc) chkAcc.addEventListener('change', (e) => { this.showAcc = e.target.checked; this.draw(); });

    // Sliders de parámetros físicos: A, omega, phi
    const sliderA = document.getElementById('geo-slider-a');
    const sliderOmega = document.getElementById('geo-slider-omega');
    const sliderPhi = document.getElementById('geo-slider-phi');

    const valA = document.getElementById('geo-val-a');
    const valOmega = document.getElementById('geo-val-omega');
    const valPhi = document.getElementById('geo-val-phi');

    if (sliderA) {
      sliderA.addEventListener('input', (e) => {
        this.params.A = parseFloat(e.target.value);
        if (valA) valA.textContent = `${this.params.A.toFixed(1)} m`;
        this.draw();
      });
    }

    if (sliderOmega) {
      sliderOmega.addEventListener('input', (e) => {
        this.params.omega = parseFloat(e.target.value);
        if (valOmega) valOmega.textContent = `${this.params.omega.toFixed(1)} rad/s`;
        this.draw();
      });
    }

    if (sliderPhi) {
      sliderPhi.addEventListener('input', (e) => {
        this.params.phi = parseFloat(e.target.value);
        if (valPhi) valPhi.textContent = `${(this.params.phi / Math.PI).toFixed(2)} π`;
        this.draw();
      });
    }

    // Opciones de la paleta (Color, grosor y estilo)
    const styleWidth = document.getElementById('geo-palette-width');
    const styleLine = document.getElementById('geo-palette-style');
    const targetFunc = document.getElementById('geo-palette-target');

    if (styleWidth && targetFunc) {
      styleWidth.addEventListener('input', (e) => {
        const key = targetFunc.value;
        if (this.styles[key]) {
          this.styles[key].width = parseFloat(e.target.value);
          this.draw();
        }
      });
    }

    if (styleLine && targetFunc) {
      styleLine.addEventListener('change', (e) => {
        const key = targetFunc.value;
        if (this.styles[key]) {
          this.styles[key].style = e.target.value;
          this.draw();
        }
      });
    }

    // Selección de color desde la paleta
    document.querySelectorAll('.palette-color-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.target.getAttribute('data-color');
        const key = targetFunc ? targetFunc.value : 'pos';
        if (this.styles[key]) {
          this.styles[key].color = color;
          document.querySelectorAll('.palette-color-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.draw();
        }
      });
    });
  }
}

// Inicialización global accesible
window.GeoGebraGrapher = GeoGebraGrapher;
