import { Collection } from "../deps.ts";
import { CustomDictError } from "../common/mod.ts";
import { Awaited, KeysMatching, onInit, Type } from "../core/types/mod.ts";
import { DatabaseDriver } from "../drivers/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

interface Entity {
  id: string | number;
}

type Id<T extends Entity> = T["id"];
type PickId<T extends Entity> = Pick<T, "id">;

@Injectable()
export class Repository<T extends Entity> implements onInit {
  static registerFor = <S extends Entity>(e: Type<S>) => {
    @Injectable()
    class E extends Repository<S> {
      constructor(db: DatabaseDriver) {
        super(e, db);
        Object.defineProperty(E, "name", {
          value: this.getCollectionName(e),
        });
      }
    }

    return E;
  };

  public collection!: Collection<T>;
  constructor(public readonly type: Type<T>, private db: DatabaseDriver) {}

  init() {
    this.collection = this.db.getCollection<T>(
      this.getCollectionName(this.type),
    );
  }

  protected getCollectionName(e: Type<T>) {
    return e.name.toLocaleLowerCase() + "s";
  }

  #zeroMatch2notFound = (
    result: Awaited<ReturnType<Collection<T>["updateOne"]>>,
  ) => {
    if (!result.matchedCount) {
      throw new CustomDictError("NotFound", {});
    }

    return result;
  };

  async get(id: Id<T>) {
    const entity = await this.collection.findOne({ id });
    return entity ? Object.assign(new this.type(), entity) : entity;
  }

  async getOrFail(id: Id<T>) {
    const entity = await this.get(id);

    if (!entity) {
      throw new CustomDictError("NotFound", {});
    }

    return entity;
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
    value: P[1][number],
  ) {
    return this.collection
      .updateOne(
        { id: team.id },
        {
          $push: { [arrProp]: value },
        },
      )
      .then(this.#zeroMatch2notFound);
  }

  arrayPull<P extends KeysMatching<T, unknown[]>>(
    team: PickId<T>,
    arrProp: P[0],
    value: P[1][number],
  ) {
    return this.collection
      .updateOne(
        { id: team.id },
        {
          $pull: { [arrProp]: value },
        },
      )
      .then(this.#zeroMatch2notFound);
  }
}
