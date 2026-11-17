export type TimeUnit = "ms" | "s" | "m" | "h" | "d";

const TIME_IN_MS: Record<TimeUnit, number> = {
  ms: 1,
  s: 1000,
  m: 1000 * 60,
  h: 1000 * 60 * 60,
  d: 1000 * 60 * 60 * 24,
};

export const getExpiryDate = (value: number, unit: TimeUnit = "m"): Date => {
  const addedMilliseconds = value * TIME_IN_MS[unit];
  return new Date(Date.now() + addedMilliseconds);
};
