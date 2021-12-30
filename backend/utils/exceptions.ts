export const reThrow = <T>(action: () => T, err: unknown) => {
  try {
    return action();
  } catch {
    throw err;
  }
};
