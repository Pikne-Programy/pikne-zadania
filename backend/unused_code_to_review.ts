import { isArrayOf, isObject, Section } from "./types/mod.ts";

function isSection(what: unknown): what is Section {
  if (!isObject(what)) {
    return false;
  }
  if (typeof what.children === "string") {
    return true;
  }
  return (
    typeof what.name === "string" &&
    what.name !== "" &&
    isArrayOf(isSection, what.children)
  );
}

// taken from ExerciseRepository
//   private inYaml(subject: string, exerciseId: string) {
//     const exercise = this.exercises[this.uid(subject, exerciseId)];

//     if (exercise === undefined) {
//       throw new CustomDictError("ExerciseNotFound", { subject, exerciseId });
//     }

//     return exercise[1];
//   }

class Lock {
  last = Promise.resolve();

  resolver?: () => void;
  acquire(): Promise<void> {
    let resolver: () => void;
    const { last } = this;

    this.last = new Promise<void>((r) => {
      resolver = r;
    });

    last.then(() => {
      this.resolver = resolver;
    });

    return last;
  }
  release() {
    this.resolver?.();
  }
}

class Padlock {
  // see Mutex
  readonly key = Symbol();
  lock = new Lock();

  async get() {
    await this.lock.acquire();
    return this.key;
  }
  release() {
    this.lock.release();
  }
  check(key: unknown) {
    return key === this.key;
  }
}
