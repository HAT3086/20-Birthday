import { FLIGHT } from './flappy-engine.mjs';
import { drawCat } from './art.mjs';

export function drawFlight(context, game, { costume = 'original', breed = 'original', time = 0, reducedMotion = false } = {}) {
  const rect = (x, y, w, h, color) => { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); };
  context.imageSmoothingEnabled = false;
  rect(0, 0, 800, 500, '#c8d9d6');
  rect(0, 0, 800, 32, '#d1dfd8');
  const drift = reducedMotion ? 0 : game.distance * .13;
  [[72, 84, 1], [359, 144, .75], [645, 64, 1.2], [906, 184, .7]].forEach(([x, y, scale]) => {
    const cx = ((x - drift) % 1000 + 1000) % 1000 - 100;
    rect(cx, y + 12 * scale, 94 * scale, 16 * scale, '#edf0e1'); rect(cx + 15 * scale, y, 53 * scale, 30 * scale, '#edf0e1'); rect(cx + 65 * scale, y + 7 * scale, 18 * scale, 22 * scale, '#edf0e1');
  });
  for (let i = 0; i < 8; i++) {
    const x = i * 140 - (game.distance * .24 % 140);
    rect(x, 416 + i % 2 * 12, 144, 58, '#b2c6b1'); rect(x + 28, 398 + i % 2 * 12, 85, 26, '#b2c6b1');
  }
  for (const gate of game.gates) {
    const upper = gate.center - gate.gap / 2, lower = gate.center + gate.gap / 2;
    for (const [top, bottom, capY] of [[0, upper, upper - 20], [lower, FLIGHT.ground, lower]]) {
      rect(gate.x, top, FLIGHT.pipeWidth, bottom - top, '#657f5e');
      rect(gate.x + 4, top, 59, bottom - top, '#91a981'); rect(gate.x + 8, top, 9, bottom - top, '#a8bc95'); rect(gate.x + 58, top, 8, bottom - top, '#7b966c');
      rect(gate.x - 5, capY, 80, 20, '#617c57'); rect(gate.x - 2, capY + 3, 73, 13, '#95ac81'); rect(gate.x + 3, capY + 4, 10, 11, '#b3c49a');
    }
  }
  rect(0, FLIGHT.ground, 800, 34, '#d3c5a2'); rect(0, FLIGHT.ground, 800, 7, '#879e70'); rect(0, FLIGHT.ground + 7, 800, 3, '#b0bd8b');
  for (let x = -30; x < 840; x += 32) rect(x - game.distance % 32, 486, 15, 3, '#b9ab87');
  const bob = game.status === 'ready' && !reducedMotion ? Math.sin(time / 320) * 5 : 0;
  const tilt = game.status === 'ready' ? -.08 : Math.max(-.25, Math.min(.55, game.velocity / 750));
  context.save(); context.translate(FLIGHT.catX, game.y + bob); context.rotate(tilt);
  const wingY = game.velocity < 0 ? -4 : 5;
  for (const [x, y, width, height] of [[16, wingY, 15, 7], [22, wingY - 6, 13, 7]]) {
    rect(x, y, width, height, '#eaf0df'); rect(-x - width, y, width, height, '#eaf0df');
  }
  drawCat(context, -24, -24, 48, 'down', true, false, costume, breed);
  context.restore();
}
