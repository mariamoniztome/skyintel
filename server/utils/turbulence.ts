export function calculateTurbulence(weather: any, altitude: number): number {
  let score = 0;

  // Wind speed contribution (up to 30 points)
  score += Math.min((weather.windSpeed || 0) * 1.5, 30);

  // Gust contribution (up to 20 points)
  score += Math.min((weather.gust || 0) * 2, 20);

  // Pressure instability (mocked as variance from standard 1013.25 hPa)
  const pressureDiff = Math.abs((weather.pressure || 1013.25) - 1013.25);
  score += Math.min(pressureDiff * 0.5, 15);

  // Clouds and Precipitation (up to 25 points)
  score += Math.min((weather.clouds || 0) * 0.1, 10);
  score += Math.min((weather.precipitation || 0) * 5, 15);

  // Altitude variation factor (mocked)
  // Higher altitude sometimes means smoother air, but jet streams can be turbulent
  if (altitude > 30000) {
    score += 5; // Jet stream risk
  }

  return Math.min(Math.round(score), 100);
}
