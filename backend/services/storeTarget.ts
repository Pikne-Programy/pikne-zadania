import {
  IConfigService,
  IDatabaseService,
  ITeamStore,
  ITeamStoreConstructor,
  IUserStore,
  IUserStoreConstructor,
} from "../interfaces/mod.ts";

export class StoreTarget {
  public readonly ts: ITeamStore;
  public readonly us: IUserStore;
  constructor(
    cfg: IConfigService,
    db: IDatabaseService,
    ts: ITeamStoreConstructor,
    us: IUserStoreConstructor,
  ) { // TODO: add SubjectStore and models' constructors
    this.ts = new ts(cfg, db, this);
    this.us = new us(cfg, db, this);
  }
}
