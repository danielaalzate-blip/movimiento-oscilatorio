/**
 * ============================================================================
 * MAPA MENTAL INTERACTIVO Y GESTIÓN DE LÍNEA DE TIEMPO HISTÓRICA
 * ============================================================================
 */

class InteractiveMindMap {
  constructor(canvasId, infoCardId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.infoCard = document.getElementById(infoCardId);

    // Nodos del mapa conceptual
    this.nodes = [
      {
        id: 'root',
        title: 'Movimiento Oscilatorio',
        subtitle: 'Concepto Central',
        x: 0.5, y: 0.5,
        radius: 46,
        color: '#1e3a8a',
        textColor: '#ffffff',
        category: 'core',
        desc: 'Movimiento de vaivén en torno a una posición de equilibrio estable, provocado por una fuerza restauradora que tiende a regresar el cuerpo al equilibrio.'
      },
      // Rama 1: Movimiento Periódico
      {
        id: 'periodico',
        parent: 'root',
        title: 'Movimiento Periódico',
        subtitle: 'Repetición en T',
        x: 0.22, y: 0.28,
        radius: 36,
        color: '#2563eb',
        textColor: '#ffffff',
        category: 'periodic',
        desc: 'Aquel movimiento que se repite exactamente a intervalos iguales de tiempo llamados período (T).'
      },
      {
        id: 'frecuencia',
        parent: 'periodico',
        title: 'Frecuencia (f) y ω',
        subtitle: 'Hertz (Hz) y rad/s',
        x: 0.10, y: 0.18,
        radius: 32,
        color: '#3b82f6',
        textColor: '#ffffff',
        category: 'periodic',
        desc: 'Número de ciclos completados por unidad de tiempo: f = 1/T (Hz). Su versión angular es ω = 2πf (rad/s).'
      },
      // Rama 2: Parámetros Espaciales
      {
        id: 'elongacion',
        parent: 'root',
        title: 'Elongación y Amplitud',
        subtitle: 'x(t) y A',
        x: 0.78, y: 0.28,
        radius: 36,
        color: '#7c3aed',
        textColor: '#ffffff',
        category: 'spatial',
        desc: 'Elongación (x): distancia respecto al punto de equilibrio en cualquier instante t. Amplitud (A): elongación máxima alcanzada.'
      },
      // Rama 3: Dinámica y M.A.S.
      {
        id: 'mas',
        parent: 'root',
        title: 'M.A.S.',
        subtitle: 'Fuerza Hookeana',
        x: 0.5, y: 0.82,
        radius: 38,
        color: '#dc2626',
        textColor: '#ffffff',
        category: 'dynamic',
        desc: 'Movimiento Armónico Simple: oscilación donde la aceleración es proporcional y opuesta a la elongación: a(t) = -ω² x(t).'
      },
      {
        id: 'edo',
        parent: 'mas',
        title: 'E.D.O. del M.A.S.',
        subtitle: 'd²x/dt² + ω²x = 0',
        x: 0.22, y: 0.82,
        radius: 34,
        color: '#b91c1c',
        textColor: '#ffffff',
        category: 'dynamic',
        desc: 'Ecuación diferencial ordinaria lineal homogénea de 2º orden cuya solución armónica es x(t) = A cos(ωt + φ).'
      },
      // Rama 4: Cinemática
      {
        id: 'cinematica',
        parent: 'root',
        title: 'Cinemática (x, v, a)',
        subtitle: 'Fasores y Desfases',
        x: 0.82, y: 0.65,
        radius: 36,
        color: '#059669',
        textColor: '#ffffff',
        category: 'kinematics',
        desc: 'x(t) = A cos(ωt+φ), v(t) = -Aω sin(ωt+φ) (desfase π/2), a(t) = -Aω² cos(ωt+φ) (desfase π).'
      },
      // Rama 5: Energía
      {
        id: 'energia',
        parent: 'mas',
        title: 'Energía Mecánica',
        subtitle: 'Em = ½ k A²',
        x: 0.76, y: 0.88,
        radius: 34,
        color: '#ea580c',
        textColor: '#ffffff',
        category: 'energy',
        desc: 'Conservación de la energía mecánica total en ausencia de fricción: Em = Ec(t) + Ep(t) = ½ m v² + ½ k x² = ½ k A².'
      }
    ];

    this.hoveredNode = null;
    this.selectedNode = this.nodes[0];
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => {
      this.resize();
      this.draw();
    });

    this.setupEvents();
    this.draw();
    this.updateInfoCard(this.selectedNode);
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

  setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found = null;
      for (const node of this.nodes) {
        const nx = node.x * this.width;
        const ny = node.y * this.height;
        const dist = Math.hypot(mx - nx, my - ny);
        if (dist <= node.radius) {
          found = node;
          break;
        }
      }

      if (found !== this.hoveredNode) {
        this.hoveredNode = found;
        this.canvas.style.cursor = found ? 'pointer' : 'default';
        this.draw();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredNode) {
        this.selectedNode = this.hoveredNode;
        this.updateInfoCard(this.selectedNode);
        this.draw();
      }
    });
  }

  updateInfoCard(node) {
    if (!this.infoCard || !node) return;
    this.infoCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <div style="width: 14px; height: 14px; border-radius: 4px; background: ${node.color};"></div>
        <h4 style="font-family: var(--font-title); font-size: 1.15rem; font-weight: 700; color: #0f172a; margin: 0;">
          ${node.title}
        </h4>
        <span style="font-size: 0.78rem; background: #f1f5f9; padding: 2px 8px; border-radius: 12px; color: #64748b; font-weight: 600;">
          ${node.subtitle}
        </span>
      </div>
      <p style="font-size: 0.95rem; color: #334155; line-height: 1.6; margin: 0;">
        ${node.desc}
      </p>
    `;
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Fondo suave
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 1. Dibujar líneas conectoras con curvas Bézier suaves
    for (const node of this.nodes) {
      if (node.parent) {
        const parent = this.nodes.find(n => n.id === node.parent);
        if (parent) {
          const px = parent.x * w;
          const py = parent.y * h;
          const cx = node.x * w;
          const cy = node.y * h;

          ctx.save();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          // Curva cúbica suave
          const midX = (px + cx) / 2;
          ctx.bezierCurveTo(midX, py, midX, cy, cx, cy);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // 2. Dibujar nodos
    for (const node of this.nodes) {
      const nx = node.x * w;
      const ny = node.y * h;
      const isHovered = this.hoveredNode === node;
      const isSelected = this.selectedNode === node;

      ctx.save();

      // Sombra
      ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
      ctx.shadowBlur = isHovered || isSelected ? 16 : 8;
      ctx.shadowOffsetY = 4;

      // Círculo del nodo
      ctx.beginPath();
      const r = isHovered ? node.radius + 4 : node.radius;
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Borde activo
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      ctx.restore();

      // Texto dentro del nodo
      ctx.save();
      ctx.fillStyle = node.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(10, Math.floor(node.radius * 0.32))}px "Outfit", sans-serif`;
      
      // Partición de líneas para nombres largos
      const words = node.title.split(' ');
      if (words.length > 1 && node.title.length > 12) {
        ctx.fillText(words.slice(0, 2).join(' '), nx, ny - 6);
        ctx.fillText(words.slice(2).join(' '), nx, ny + 8);
      } else {
        ctx.fillText(node.title, nx, ny);
      }
      ctx.restore();
    }
  }
}

window.InteractiveMindMap = InteractiveMindMap;
