import { common, join, normalize } from "../deps.ts";
export function joinThrowable(
  base: string,
  ...path: string[]
): string {
  if (path.length) {
    const requested = join(base, path[0]);
    const commonPath = common([join(base), requested]);
    if (normalize(commonPath) == normalize(base)) {
      return joinThrowable(requested, ...path.slice(1));
    }
    throw new Deno.errors.PermissionDenied(
      `${base}, ${requested}, ${commonPath}`,
    );
  } else {
    return base;
  }
}
export function fileExists(path: string): boolean {
  try {
    const stat = Deno.statSync(path);
    return stat && stat.isFile;
  } catch (error) {
    if (error && error instanceof Deno.errors.NotFound) {
      return false;
    } else {
      throw error; // throwable
    }
  }
}
