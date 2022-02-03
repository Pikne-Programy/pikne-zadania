import {
  ExerciseRepository,
  SubjectRepository,
  UserRepository,
} from "../repositories/mod.ts";
import { Guest, Subject, User } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";
import { Actions, CustomDictError } from "../common/mod.ts";
import { iterateSection, joinThrowable, Section } from "../utils/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";
import type { onInit } from "../core/types/mod.ts";

@Injectable()
export class SubjectService implements onInit {
  constructor(
    private userRepository: UserRepository,
    private subjectRepository: SubjectRepository,
    private exerciseRepository: ExerciseRepository,
  ) {}

  async findOne(
    currentUser: User,
    { subject: subjectId }: { subject: string },
  ) {
    const subject = await this.subjectRepository.getOrFail(subjectId);

    currentUser.assertCan(Actions.READ, subject);

    const assignees = await Promise.all(
      (subject.assignees || []).map(async (userId) => ({
        userId,
        name: (await this.userRepository.get(userId))?.name, //FIXME n+1
      })),
    );

    return {
      assignees: assignees.length ? assignees : null,
    };
  }

  async findAll(currentUser: User | Guest) {
    const allSubjects = this.exerciseRepository.listSubjects();
    const selection = await Promise.all(
      allSubjects.map(async (subjectId) => {
        //FIXME n+1
        const subject = await this.subjectRepository.get(subjectId);
        return subject && currentUser.can(Actions.READ, subject);
      }),
    );
    const subjects = allSubjects.filter((_, i) => selection[i]);

    return { subjects };
  }

  async create(
    currentUser: User,
    { subject: id, assignees }: { subject: string; assignees: string[] | null },
  ) {
    currentUser.assertCan(Actions.CREATE, Subject);

    // TODO: all assignees exist?
    const subject = await this.subjectRepository.get(id);

    if (subject) {
      throw new CustomDictError("SubjectAlreadyExists", { subject: id });
    }

    await this.subjectRepository.collection.insertOne({ id, assignees });
  }

  async permit(
    currentUser: User,
    {
      subject: subjectId,
      assignees,
    }: { subject: string; assignees: string[] | null },
  ) {
    const subject = await this.subjectRepository.getOrFail(subjectId);

    currentUser.assertCan(Actions.UPDATE, subject);

    await this.subjectRepository.collection.updateOne(
      { id: subject.id },
      {
        $set: { assignees },
      },
    );
  }

  async getStaticPath(
    currentUser: User | Guest,
    { subject }: { subject: string },
  ) {
    currentUser.assertCan(
      Actions.READ,
      await this.subjectRepository.getOrFail(subject),
    );

    return {
      root: this.exerciseRepository.getStaticContentPath(subject),
    };
  }

  async putStatic(
    currentUser: User,
    { subject, filename }: { subject: string; filename: string },
    content: Uint8Array,
  ) {
    currentUser.assertCan(
      Actions.UPDATE,
      await this.subjectRepository.getOrFail(subject),
    );

    //! resource-intensive
    await Deno.writeFile(
      joinThrowable(
        this.exerciseRepository.getStaticContentPath(subject),
        filename,
      ),
      content,
      { mode: 0o2664 },
    );
  }

  async getHierarchy(
    currentUser: User | Guest,
    { subject: subjectId, raw }: { subject: string; raw: boolean },
  ) {
    if (!this.exerciseRepository.listSubjects().includes(subjectId)) {
      throw new httpErrors["NotFound"]();
    }

    const response = await iterateSection(
      //FIXME we already pass both 'exerciseRepository' and 'subjectId'
      //no need for this arg
      this.exerciseRepository._structure[subjectId],
      subjectId,
      raw,
      this.exerciseRepository,
      currentUser,
    );
    const subject = await this.subjectRepository.get(subjectId);
    if (subject && currentUser.can(Actions.READ, subject) && !raw) {
      response.unshift({
        name: "",
        children: this.exerciseRepository.unlisted[subjectId]
          .map((children) => {
            const exercise = this.exerciseRepository.get(subjectId, children);

            return (
              exercise && {
                name: exercise.name,
                children,
                type: exercise.type,
                description: exercise.description,
                done: null,
              }
            );
          })
          .filter(Boolean),
      });
    }

    return response;
  }

  async setHierarchy(
    currentUser: User,
    { subject, hierarchy }: { subject: string; hierarchy: Section[] },
  ) {
    currentUser.assertCan(
      Actions.UPDATE,
      await this.subjectRepository.getOrFail(subject),
    );

    if (!this.exerciseRepository.listSubjects().includes(subject)) {
      throw new httpErrors["NotFound"]();
    }
    // TODO V what if exercise doesn't exist
    await this.exerciseRepository.structureSet(subject, hierarchy);
  }

  async init() {
    const diskSubjects = new Set(this.exerciseRepository.listSubjects());
    const dbSubjects = new Set(
      await this.subjectRepository.collection.find().map(({ id }) => id),
    );

    const allSubjects = new Set([...diskSubjects, ...dbSubjects]);

    for (const id of allSubjects) {
      const inDisk = diskSubjects.has(id);
      const inDb = dbSubjects.has(id);

      if (inDisk && !inDb) {
        await this.subjectRepository.collection.insertOne({
          id,
          assignees: null,
        });
      } else if (!inDisk && inDb) {
        await this.subjectRepository.collection.deleteOne({ id });
      }
    }
  }
}
