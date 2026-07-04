export function toBooleanFlag(value: number | boolean | null | undefined) {
  return value === 1 || value === true;
}

export function fromBooleanFlag(value: boolean) {
  return value ? 1 : 0;
}
