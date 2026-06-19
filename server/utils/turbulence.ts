export function calculateTurbulence(
  weather: any,
  altitude: number,
  speed: number = 0
): number {
  let score = 0;

  score += Math.min((weather.windSpeed || 0) * 1.0, 20);

  score += Math.min((weather.gust || 0) * 1.2, 15);

  const pressureDiff = Math.abs(
    (weather.pressure || 1013.25) - 1013.25
  );
  score += Math.min(pressureDiff * 0.2, 8);

  score += Math.min((weather.clouds || 0) * 0.1, 10);

  score += Math.min((weather.precipitation || 0) * 5, 15);

  if (altitude > 25000) score += 3;
  if (altitude > 35000) score += 3;

  score += Math.min(speed / 80, 8);

  return Math.min(Math.round(score), 100);
}