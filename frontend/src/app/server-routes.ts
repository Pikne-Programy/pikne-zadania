export const publicExerciseList = '/api/public';
export const register = '/api/register';
export const login = '/api/login';
export const account = '/api/account';
export function image(subject: string, file: string): string {
  return `/api/public/${subject}/static/${file}`;
}
