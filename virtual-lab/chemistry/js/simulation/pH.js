/**
 * pH helpers — pure functions, no framework dependencies.
 */

export function phToLabel(ph) {
  if (ph < 3)  return 'Strong Acid';
  if (ph < 7)  return 'Acid';
  if (ph === 7) return 'Neutral';
  if (ph < 11) return 'Base';
  return 'Strong Base';
}

export function phToColor(ph) {
  // Returns a CSS hex string for pH indicator strip colour
  if (ph < 3)  return '#ff2222';
  if (ph < 5)  return '#ff8800';
  if (ph < 6)  return '#ffdd00';
  if (ph < 7)  return '#aadd00';
  if (ph === 7) return '#00cc66';
  if (ph < 9)  return '#00aaee';
  if (ph < 11) return '#4466ff';
  return '#8822ff';
}

export function mixpH(phA, phB, ratioA = 0.5) {
  // Simple weighted average in [H+] space
  const hA  = Math.pow(10, -phA);
  const hB  = Math.pow(10, -phB);
  const hMix = hA * ratioA + hB * (1 - ratioA);
  return -Math.log10(hMix);
}
