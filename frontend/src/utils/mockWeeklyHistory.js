function rnd(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// One demo cell: weekday mornings busy, afternoon meetings (14-16h) worst, weekends calm.
export function mockCell(day, hour) {
  const weekday = day < 5;
  let base = weekday ? 14 : 6;
  if (weekday && hour >= 9 && hour <= 11) base += 14;
  if (weekday && hour >= 14 && hour <= 16) base += 52;
  if (hour >= 12 && hour <= 13) base += 10;

  const risk = Math.max(2, Math.min(95, base + (rnd(day * 31 + hour) - 0.5) * 18));
  return {
    day,
    hour,
    risk: +risk.toFixed(1),
    peak: +Math.min(100, risk * 1.25).toFixed(1),
    co2: Math.round(430 + risk * 9),
    pm25: +(5 + risk * 0.45).toFixed(1),
    n: 0,
    demo: true,
  };
}