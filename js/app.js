/**
 * ============================================================================
 * CONTROLADOR PRINCIPAL DEL CUADERNO DIGITAL INTERACTIVO (SPA / PWA)
 * ============================================================================
 */

class PhysicsNotebookApp {
  constructor() {
    this.currentPage = 0;
    this.totalPages = 10; // Páginas 0 a 10 (Total 11 páginas)
    this.pages = [];
    this.audioContext = null;

    this.init();
  }

  init() {
    this.pages = document.querySelectorAll('.notebook-page');
    this.setupNavigation();
    this.setupKeyboard();
    this.setupTouchGestures();
    this.renderIcons();
    this.renderMath();
    this.initSubsystems();

    // Ir a la página guardada en hash si existe (ej. #page-3)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#page-')) {
      const p = parseInt(hash.replace('#page-', ''), 10);
      if (!isNaN(p) && p >= 0 && p <= this.totalPages) {
        this.goToPage(p, false);
      } else {
        this.goToPage(0, false);
      }
    } else {
      this.goToPage(0, false);
    }
  }

  setupNavigation() {
    const btnPrev = document.getElementById('nav-btn-prev');
    const btnNext = document.getElementById('nav-btn-next');
    const btnHome = document.getElementById('nav-btn-home');
    const pageSelect = document.getElementById('nav-page-select');
    const btnOpenCover = document.getElementById('btn-open-notebook');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    if (btnPrev) btnPrev.addEventListener('click', () => this.prevPage());
    if (btnNext) btnNext.addEventListener('click', () => this.nextPage());
    if (btnHome) btnHome.addEventListener('click', () => this.goToPage(0));
    if (btnOpenCover) btnOpenCover.addEventListener('click', () => this.goToPage(1));

    if (pageSelect) {
      pageSelect.addEventListener('change', (e) => {
        this.goToPage(parseInt(e.target.value, 10));
      });
    }

    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    }

    // Enlaces directos en el índice
    document.querySelectorAll('[data-goto-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const p = parseInt(el.getAttribute('data-goto-page'), 10);
        if (!isNaN(p)) this.goToPage(p);
      });
    });
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Ignorar si el foco está en un input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        this.nextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        this.prevPage();
      } else if (e.key === 'Home') {
        this.goToPage(0);
      } else if (e.key === 'End') {
        this.goToPage(this.totalPages);
      }
    });
  }

  setupTouchGestures() {
    let startX = 0;
    let startY = 0;

    window.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;

        // Si el swipe es predominantemente horizontal y supera 60px
        if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          // No cambiar de página si el toque ocurrió dentro de un canvas interactivo
          const target = e.target;
          if (target && target.tagName === 'CANVAS') return;

          if (diffX < 0) {
            this.nextPage();
          } else {
            this.prevPage();
          }
        }
      }
    }, { passive: true });
  }

  goToPage(pageIndex, playSound = true) {
    if (pageIndex < 0 || pageIndex > this.totalPages) return;

    this.currentPage = pageIndex;
    window.location.hash = `page-${pageIndex}`;

    // Actualizar clases de visualización
    this.pages.forEach((p, idx) => {
      if (idx === pageIndex) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // Actualizar controles de navegación
    const btnPrev = document.getElementById('nav-btn-prev');
    const btnNext = document.getElementById('nav-btn-next');
    const pageSelect = document.getElementById('nav-page-select');
    const pageBadge = document.getElementById('header-page-badge');

    if (btnPrev) btnPrev.disabled = (pageIndex === 0);
    if (btnNext) btnNext.disabled = (pageIndex === this.totalPages);
    if (pageSelect) pageSelect.value = pageIndex;
    if (pageBadge) {
      pageBadge.textContent = pageIndex === 0 ? 'Portada' : `Página ${pageIndex} / ${this.totalPages}`;
    }

    if (playSound) this.playPageFlipSound();

    // Scroll suave al inicio del libro
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Desencadenar redibujo de componentes según la página
    setTimeout(() => {
      if (pageIndex === 3 && window.mindMapInstance) {
        window.mindMapInstance.resize();
        window.mindMapInstance.draw();
      }
      if (pageIndex === 7 && window.geoGebraInstance) {
        window.geoGebraInstance.resize();
        window.geoGebraInstance.draw();
      }
      if (pageIndex === 8 && window.physicsSimInstance) {
        window.physicsSimInstance.resize();
      }
      this.renderMath();
    }, 100);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  playPageFlipSound() {
    try {
      if (!this.audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioContext = new AudioContextClass();
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      if (!this.audioContext) return;

      // Síntesis auditiva sutil de roce de papel (Noise buffer + Bandpass filter)
      const bufferSize = this.audioContext.sampleRate * 0.08;
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.audioContext.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.2;

      const gain = this.audioContext.createGain();
      gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioContext.destination);

      noise.start();
    } catch (e) {
      // Audio silencioso si el navegador no lo permite
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }

  renderIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  renderMath() {
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  }

  initSubsystems() {
    // Inicializar Motor GeoGebra
    if (document.getElementById('geogebra-canvas')) {
      window.geoGebraInstance = new GeoGebraGrapher('geogebra-canvas', 'geogebra-container');
    }

    // Inicializar Simulador Físico
    if (document.getElementById('sim-canvas')) {
      window.physicsSimInstance = new PhysicsSimulation('sim-canvas');
    }

    // Inicializar Mapa Mental
    if (document.getElementById('mindmap-canvas')) {
      window.mindMapInstance = new InteractiveMindMap('mindmap-canvas', 'mindmap-info-card');
    }

    // Inicializar Gestor de Ejercicios
    window.exerciseManagerInstance = new PhysicsExerciseManager();
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.notebookApp = new PhysicsNotebookApp();
});
