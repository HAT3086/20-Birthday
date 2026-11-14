import { breedFor } from './breeds.mjs';

export function drawCat(context, x, y, size, direction = 'down', leader = true, blink = false, costume = 'original', breed = 'original', expression = 'neutral') {
  const palette = breedFor(breed);
  const p = size / 16;
  context.save();
  context.translate(x + size / 2, y + size / 2);
  context.rotate(({ down: 0, right: -Math.PI / 2, left: Math.PI / 2, up: Math.PI })[direction]);
  context.translate(-size / 2, -size / 2);
  const rect = (a, b, w, h, color) => { context.fillStyle = color; context.fillRect(a * p, b * p, w * p, h * p); };
  const outline = breed === 'original' && !leader ? '#9d8967' : palette.outline;
  if (costume === 'bee') {
    rect(0, 6, 3, 5, '#dae4d7'); rect(13, 6, 3, 5, '#dae4d7');
  }
  if (costume === 'birthday') rect(1, 10, 14, 5, '#b57f74');
  rect(3, 2, 3, 4, outline); rect(10, 2, 3, 4, outline); rect(2, 5, 12, 7, outline); rect(3, 12, 10, 2, outline); rect(5, 14, 6, 1, outline);
  rect(4, 3, 1, 3, palette.ear); rect(11, 3, 1, 3, palette.ear);
  const jaw = breed === 'original' ? '#f5ddb2' : palette.shade;
  rect(3, 6, 10, 6, breed === 'original' && !leader ? '#e6c998' : palette.fur); rect(4, 12, 8, 1, jaw); rect(6, 13, 4, 1, jaw);
  rect(5, 5, 6, 2, breed === 'original' && !leader ? '#edd4a9' : palette.light);
  if (breed === 'british') { rect(2, 7, 1, 4, palette.fur); rect(13, 7, 1, 4, palette.fur); }
  if (breed === 'siamese') {
    rect(3, 6, 10, 5, palette.markings); rect(5, 5, 6, 2, palette.markings); rect(6, 9, 4, 3, palette.fur);
  } else if (breed === 'orange') {
    rect(5, 5, 1, 2, palette.markings); rect(7, 5, 2, 1, palette.markings); rect(10, 5, 1, 2, palette.markings);
    rect(3, 7, 2, 1, palette.markings); rect(11, 7, 2, 1, palette.markings);
    rect(5, 10, 6, 2, '#f8dfb2');
  } else if (breed === 'ragdoll') {
    rect(3, 6, 3, 5, palette.markings); rect(10, 6, 3, 5, palette.markings); rect(6, 6, 1, 2, palette.markings); rect(9, 6, 1, 2, palette.markings);
    rect(7, 6, 2, 4, palette.light);
  }
  if (expression === 'happy') {
    for (const eye of [4, 10]) { rect(eye, 9, 1, 1, palette.eye); rect(eye + 1, 8, 1, 1, palette.eye); rect(eye + 2, 9, 1, 1, palette.eye); }
  } else if (expression === 'sparkle') {
    for (const eye of [4, 10]) { rect(eye, 8, 2, 3, palette.eye); rect(eye, 8, 1, 1, '#fff8df'); }
  } else {
    rect(4, blink ? 9 : 8, blink ? 2 : 1, blink ? 1 : 2, palette.eye); rect(11, blink ? 9 : 8, blink ? 2 : 1, blink ? 1 : 2, palette.eye);
  }
  rect(3, 10, 2, 1, '#e9ac91'); rect(11, 10, 2, 1, '#e9ac91'); rect(7, 10, 2, 1, '#c78476'); rect(7, 11, 1, 1, '#b18a71');
  if (leader) { rect(5, 14, 6, 1, '#90a99a'); rect(7, 14, 2, 1, '#e2b655'); }
  if (costume === 'gardener') {
    rect(1, 4, 14, 2, '#72805a'); rect(4, 1, 8, 3, '#98a16b'); rect(5, 0, 6, 1, '#a9b17b');
    rect(8, 1, 1, 3, '#5d754d'); rect(9, 1, 2, 1, '#c8cf9c'); rect(5, 13, 6, 2, '#71825e');
  } else if (costume === 'sailor') {
    rect(2, 3, 12, 2, '#587987'); rect(4, 1, 8, 2, '#edf0df'); rect(6, 0, 4, 1, '#edf0df');
    rect(4, 12, 8, 2, '#587987'); rect(6, 13, 4, 2, '#e4d7b1'); rect(7, 13, 2, 2, '#6e8790');
  } else if (costume === 'bee') {
    rect(4, 0, 1, 3, '#6d634a'); rect(11, 0, 1, 3, '#6d634a'); rect(3, 0, 3, 1, '#c2a252'); rect(10, 0, 3, 1, '#c2a252');
    rect(4, 12, 8, 3, '#c6a557'); rect(4, 13, 8, 1, '#76684a');
  } else if (costume === 'wizard') {
    rect(1, 4, 14, 2, '#7d739b'); rect(4, 2, 8, 2, '#8e83ac'); rect(6, 0, 5, 2, '#8e83ac'); rect(9, 0, 4, 1, '#8e83ac');
    rect(6, 2, 2, 2, '#d8bf77'); rect(4, 13, 8, 2, '#7d739b'); rect(7, 13, 2, 1, '#d8bf77');
  } else if (costume === 'astronaut') {
    rect(1, 3, 1, 9, '#b1c6c5'); rect(14, 3, 1, 9, '#b1c6c5'); rect(2, 1, 12, 2, '#dfe7db');
    rect(2, 12, 12, 2, '#dfe7db'); rect(2, 3, 1, 3, '#edf0e2'); rect(3, 3, 3, 1, '#edf0e2');
    rect(5, 14, 6, 1, '#829ba0'); rect(7, 14, 2, 1, '#b77b68');
  } else if (costume === 'birthday') {
    rect(5, 3, 7, 2, '#b77e7e'); rect(6, 1, 5, 2, '#d39b91'); rect(8, 0, 1, 1, '#d7b466');
    rect(8, 2, 1, 1, '#f4d3a1'); rect(5, 13, 6, 1, '#c4986c'); rect(7, 13, 2, 2, '#e0b662');
  }
  context.restore();
}

export function drawSittingCat(context, width, height, costume = 'original', breed = 'original', pose = {}) {
  const palette = breedFor(breed);
  const bodyOutline = breed === 'original' ? '#8a795e' : palette.outline;
  const bodyFur = breed === 'original' ? '#fff0ce' : palette.fur;
  const tail = breed === 'original' ? '#968364' : palette.markings;
  context.clearRect(0, 0, width, height);
  const p = width / 48;
  const rect = (x, y, w, h, color) => { context.fillStyle = color; context.fillRect(x * p, y * p, w * p, h * p); };
  const offset = height / p - 36;
  context.save(); context.translate(0, offset * p);
  rect(12, 33, 26, 2, '#c9c7a688');
  context.save();
  context.translate(24 * p, (33 - (pose.lift || 0)) * p);
  context.rotate(pose.tilt || 0);
  context.scale((pose.scale ?? 1) * (pose.stretchX ?? 1), (pose.scale ?? 1) * (pose.stretchY ?? 1));
  context.translate(-24 * p, -33 * p);
  context.save(); context.translate(33 * p, 25 * p); context.rotate(pose.tail || 0); context.translate(-33 * p, -25 * p);
  rect(32, 24, 6, 3, tail); rect(36, 21, 3, 5, tail); rect(36, 20, 2, 2, tail);
  if (breed === 'orange') { rect(33, 24, 2, 3, palette.fur); rect(36, 21, 3, 1, palette.fur); }
  context.restore();
  rect(16, 18, 17, 14, bodyOutline); rect(17, 20, 15, 11, palette.shade); rect(19, 21, 11, 11, bodyFur);
  rect(14, 30, 9, 3, bodyOutline); rect(26, 30, 9, 3, bodyOutline); rect(15, 30, 7, 2, bodyFur); rect(27, 30, 7, 2, bodyFur);
  rect(18, 24, 2, 6, palette.markings); rect(29, 24, 2, 6, palette.markings);
  if (breed === 'orange') {
    rect(21, 21, 7, 10, '#f8dfb2');
    rect(18, 23, 2, 1, palette.markings); rect(29, 25, 2, 1, palette.markings);
  }
  if (breed === 'ragdoll') { rect(14, 19, 3, 6, palette.fur); rect(32, 19, 3, 6, palette.fur); }
  const coats = { gardener: '#89966c', sailor: '#708e9b', bee: '#c5a658', wizard: '#9185aa', astronaut: '#dbe3db', birthday: '#c18c82' };
  if (coats[costume]) {
    rect(17, 22, 15, 8, coats[costume]);
    rect(19, 26, 2, 4, bodyFur); rect(28, 26, 2, 4, bodyFur);
    if (costume === 'bee') { rect(17, 24, 15, 2, '#77684c'); rect(17, 28, 15, 2, '#77684c'); }
    if (costume === 'sailor') { rect(23, 22, 3, 5, '#f0e5c7'); rect(24, 24, 1, 3, '#546f80'); }
    if (costume === 'wizard') { rect(23, 24, 3, 1, '#d9c27d'); rect(24, 23, 1, 3, '#d9c27d'); }
    if (costume === 'astronaut') { rect(22, 24, 5, 3, '#8eaaa8'); rect(23, 24, 1, 1, '#c88871'); }
    if (costume === 'birthday') { rect(23, 23, 3, 2, '#dfbe78'); rect(24, 25, 1, 4, '#dfbe78'); }
  }
  drawCat(context, 10 * p, -2 * p, 29 * p, 'down', true, false, costume, breed, pose.expression || 'neutral');
  for (const [x, raised] of [[12, pose.pawLeft || 0], [32, pose.pawRight || 0]]) {
    if (raised <= .05) continue;
    const y = 27 - raised * 7;
    rect(x, y, 6, 5, bodyOutline); rect(x + 1, y + 1, 4, 3, bodyFur); rect(x + 2, y + 2, 2, 1, palette.ear);
  }
  context.restore();
  context.restore();
}

