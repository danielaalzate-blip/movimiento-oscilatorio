/**
 * ============================================================================
 * MÓDULO DE EJERCICIOS Y CALCULADORA INTERACTIVA DE COMPROBACIÓN FÍSICA
 * Implementa la metodología estricta de 5 pasos con validación simbólica/numérica
 * ============================================================================
 */

class PhysicsExerciseManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupInteractiveCalculators();
  }

  setupInteractiveCalculators() {
    // Calculadora interactiva del Ejercicio 1 (Parámetros Cinemáticos y Dinámicos)
    const inM = document.getElementById('calc-ex1-m');
    const inK = document.getElementById('calc-ex1-k');
    const inA = document.getElementById('calc-ex1-a');

    const updateEx1 = () => {
      if (!inM || !inK || !inA) return;
      const m = parseFloat(inM.value) || 0.5;
      const k = parseFloat(inK.value) || 200.0;
      const A = parseFloat(inA.value) || 0.15;

      // 1. Frecuencia angular w = sqrt(k/m)
      const omega = Math.sqrt(k / m);
      // 2. Período T = 2pi / w
      const T = (2 * Math.PI) / omega;
      // 3. Frecuencia f = 1 / T
      const f = 1 / T;
      // 4. Velocidad máxima vmax = w * A
      const vmax = omega * A;
      // 5. Aceleración máxima amax = w^2 * A
      const amax = (omega ** 2) * A;
      // 6. Energía mecánica total Em = 1/2 k A^2
      const Em = 0.5 * k * (A ** 2);

      // Actualizar salidas en el DOM (destacadas en NARANJA porque ya no son incógnitas)
      this.setText('calc-out-w', `${omega.toFixed(2)} rad/s`);
      this.setText('calc-out-t', `${T.toFixed(3)} s`);
      this.setText('calc-out-f', `${f.toFixed(2)} Hz`);
      this.setText('calc-out-vmax', `${vmax.toFixed(3)} m/s`);
      this.setText('calc-out-amax', `${amax.toFixed(2)} m/s²`);
      this.setText('calc-out-em', `${Em.toFixed(3)} J`);
    };

    if (inM) inM.addEventListener('input', updateEx1);
    if (inK) inK.addEventListener('input', updateEx1);
    if (inA) inA.addEventListener('input', updateEx1);
    updateEx1();

    // Calculadora interactiva del Ejercicio 2 (Cinemática a un tiempo t dado)
    const inT = document.getElementById('calc-ex2-t');
    const inPhi = document.getElementById('calc-ex2-phi');

    const updateEx2 = () => {
      if (!inT || !inM || !inK || !inA) return;
      const m = parseFloat(inM.value) || 0.5;
      const k = parseFloat(inK.value) || 200.0;
      const A = parseFloat(inA.value) || 0.15;
      const t = parseFloat(inT.value) || 0.25;
      const phi = inPhi ? parseFloat(inPhi.value) || 0.0 : 0.0;

      const omega = Math.sqrt(k / m);
      const angle = omega * t + phi;

      const xt = A * Math.cos(angle);
      const vt = -A * omega * Math.sin(angle);
      const at = -A * (omega ** 2) * Math.cos(angle);

      const Ek = 0.5 * m * (vt ** 2);
      const Ep = 0.5 * k * (xt ** 2);

      this.setText('calc-out-xt', `${xt.toFixed(4)} m`);
      this.setText('calc-out-vt', `${vt.toFixed(4)} m/s`);
      this.setText('calc-out-at', `${at.toFixed(3)} m/s²`);
      this.setText('calc-out-ekt', `${Ek.toFixed(4)} J`);
      this.setText('calc-out-ept', `${Ep.toFixed(4)} J`);
    };

    if (inT) inT.addEventListener('input', updateEx2);
    if (inPhi) inPhi.addEventListener('input', updateEx2);
    if (inM) inM.addEventListener('input', updateEx2);
    if (inK) inK.addEventListener('input', updateEx2);
    if (inA) inA.addEventListener('input', updateEx2);
    updateEx2();
  }

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

window.PhysicsExerciseManager = PhysicsExerciseManager;
