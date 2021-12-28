import { Collection } from "../deps.ts";
import { CustomDictError } from "../common/mod.ts";
import { Awaited } from "../utils/mod.ts";

interface Type<T> extends Function {
  new (a: T): T;
}

interface Entity {
  id: string | number;
}

type Id<T extends Entity> = T["id"];
type PickId<T extends Entity> = Pick<T, "id">;

type KeysMatching<T, V> = {
  [K in keyof T]-?: T[K] extends V ? [K, T[K]] : never;
}[keyof T];

export abstract class Repository<T extends Entity> {
  constructor(
    public readonly type: Type<T>,
    public readonly collection: Collection<T>
  ) {}

  #zeroMatch2notFound = (
    result: Awaited<ReturnType<Collection<T>["updateOne"]>>
  ) => {
    if (!result.matchedCount) {
      throw new CustomDictError("NotFound", {});
    }

    return result;
  };

  async get(id: Id<T>) {
    const entity = await this.collection.findOne({ id });
    return entity ? new this.type(entity) : entity;
  }
  async getOrFail(id: Id<T>) {
    const subject = await this.get(id);

    if (!subject) {
      throw new CustomDictError("NotFound", {});
    }

    return subject;
  }
  async delete(user: PickId<T>) {
    const deletedCount = await this.collection.deleteOne({ id: user.id });
    if (!deletedCount) {
      throw new CustomDictError("NotFound", {});
    }
  }
  arrayPush<P extends KeysMatching<T, unknown[]>>(
    team: PickId<T>,
    arrProp: P[0],
    value: P[1][number]
  ) {
    return this.collection
      .updateOne(
        { id: team.id },
        {
          $push: { [arrProp]: value },
        }
      )
      .then(this.#zeroMatch2notFound);
  }
  arrayPull<P extends KeysMatching<T, unknown[]>>(
    team: PickId<T>,
    arrProp: P[0],
    value: P[1][number]
  ) {
    return this.collection
      .updateOne(
        { id: team.id },
        {
          $pull: { [arrProp]: value },
        }
      )
      .then(this.#zeroMatch2notFound);
  }
}
