export function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function formatTime(milliseconds: number) {
  const roundTowardsZero = milliseconds > 0 ? Math.floor : Math.ceil;
  const min = roundTowardsZero(milliseconds / 60000);
  const s = roundTowardsZero(milliseconds / 1000) % 60;
  const ms = roundTowardsZero(milliseconds) % 1000;
  let result = '';
  if (min) {
    result += ` ${min}m`;
  }
  if (s) {
    result += ` ${s}s`;
  }
  if (ms) {
    result += ` ${ms}ms`;
  }
  return result.trim();
}
