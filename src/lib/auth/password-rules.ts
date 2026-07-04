export const MIN_PASSWORD_LENGTH = 8;

export function validateNewPassword(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return "Password must be at least 8 characters";
  }
  return null;
}
