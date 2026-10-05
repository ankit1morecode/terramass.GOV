/**
 * Terrain–mass–grip braking model (same equations as the Calculator page).
 * Slope convention: positive degrees = downhill in the direction of travel.
 */
export const G = 9.81;
/** Stopping distance the safe speed is solved for, in metres. */
export const MAX_BRAKING_DISTANCE = 50;
const MIN_DECEL = 0.1;

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Achievable braking deceleration in m/s² (can be ≤ 0 on steep, slippery descents). */
export const brakingDecel = (slopeDeg: number, grip: number) =>
  G * (grip * Math.cos(rad(slopeDeg)) - Math.sin(rad(slopeDeg)));

/** Highest speed (km/h) that still stops within `maxDistance` metres. */
export const safeSpeedKmh = (slopeDeg: number, grip: number, maxDistance = MAX_BRAKING_DISTANCE) =>
  Math.sqrt(2 * Math.max(brakingDecel(slopeDeg, grip), MIN_DECEL) * maxDistance) * 3.6;

/** Stopping distance (m) from `speedKmh`. */
export const brakingDistanceM = (speedKmh: number, slopeDeg: number, grip: number) => {
  const v = speedKmh / 3.6;
  return (v * v) / (2 * Math.max(brakingDecel(slopeDeg, grip), MIN_DECEL));
};

export type SpeedStatus = "safe" | "warning" | "critical";

export const speedStatus = (speedKmh: number, safeKmh: number): SpeedStatus =>
  speedKmh > safeKmh * 1.1 ? "critical" : speedKmh > safeKmh * 0.9 ? "warning" : "safe";
