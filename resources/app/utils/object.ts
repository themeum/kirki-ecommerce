export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const getObjectKeys = <T extends Record<string, unknown>>(
  obj: T,
): Array<keyof T> => {
  return Object.keys(obj) as Array<keyof T>;
};
