type SetKeyValuePayload = {
  key: string;
  value: string | number | boolean | null | undefined | object;
  nestedToggler?: string[];
};

export type { SetKeyValuePayload };
