import {
  UserRepository,
  SubjectRepository,
  ExerciseRepository,
} from "../repositories/mod.ts";
import { User } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";
import { isAssigneeOf, isPermittedToView } from "../core/mod.ts";
import { CustomDictError } from "../common/mod.ts";
import { joinThrowable, iterateSection, Section } from "../utils/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class SubjectService {
  constructor(
    private userRepository: UserRepository,
    private subjectRepository: SubjectRepository,
    private exerciseRepository: ExerciseRepository
  ) {}

  async findOne(
    currentUser: User,
    { subject: subjectId }: { subject: string }
  ) {
    const subject = await this.subjectRepository.getOrFail(subjectId);

    if (!currentUser.isTeacher() || !isPermittedToView(subject, currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    const assignees = await Promise.all(
      (subject.assignees || []).map(async (userId) => ({
        userId,
        name: (await this.userRepository.get(userId))?.name, //FIXME n+1
      }))
    );

    return {
      // learn more: https://pikne-programy.github.io/pikne-zadania/API#:~:text=POST%20/api/subject/create%20%2D%20create%20a%20new%20subject
      assignees: assignees.length ? assignees : null,
    };
  }

  async findAll(currentUser?: User) {
    const allSubjects = this.exerciseRepository.listSubjects();
    const selection = await Promise.all(
      allSubjects.map(async (subjectId) => {
        //FIXME n+1
        const subject = await this.subjectRepository.get(subjectId);
        return subject && isPermittedToView(subject, currentUser);
      })
    );
    const subjects = allSubjects.filter((_, i) => selection[i]);

    return { subjects };
  }

  async create(
    currentUser: User,
    { subject: id, assignees }: { subject: string; assignees: string[] | null }
  ) {
    if (!currentUser.isTeacher()) {
      throw new httpErrors["Forbidden"]();
    }
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
    }: { subject: string; assignees: string[] | null }
  ) {
    const subject = await this.subjectRepository.get(subjectId);

    if (!isAssigneeOf(subject, currentUser)) {
      throw new httpErrors["Forbidden"]();
    }
    await this.subjectRepository.collection.updateOne(
      { id: subject!.id },
      {
        $set: { assignees },
      }
    );
  }

  async getStaticPath(
    currentUser: User | undefined,
    { subject }: { subject: string }
  ) {
    if (
      !isPermittedToView(
        await this.subjectRepository.getOrFail(subject),
        currentUser
      )
    ) {
      throw new httpErrors["Forbidden"]();
    }
    return {
      root: this.exerciseRepository.getStaticContentPath(subject),
    };
  }
  async putStatic(
    currentUser: User | undefined,
    { subject, filename }: { subject: string; filename: string },
    content: Uint8Array
  ) {
    if (!isAssigneeOf(await this.subjectRepository.get(subject), currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    //! resource-intensive
    await Deno.writeFile(
      joinThrowable(
        this.exerciseRepository.getStaticContentPath(subject),
        filename
      ),
      content,
      { mode: 0o2664 }
    );
  }

  async getHierarchy(
    currentUser: User | undefined,
    { subject, raw }: { subject: string; raw: boolean }
  ) {
    if (!this.exerciseRepository.listSubjects().includes(subject)) {
      throw new httpErrors["NotFound"]();
    }

    const response = await iterateSection(
      //FIXME
      this.exerciseRepository._structure[subject],
      subject,
      raw,
      this.exerciseRepository,
      currentUser
    );

    if (
      isAssigneeOf(await this.subjectRepository.get(subject), currentUser) &&
      !raw
    ) {
      response.unshift({
        name: "",
        children: this.exerciseRepository.unlisted[subject]
          .map((children) => {
            const exercise = this.exerciseRepository.get(subject, children);

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
    { subject, hierarchy }: { subject: string; hierarchy: Section[] }
  ) {
    if (!isAssigneeOf(await this.subjectRepository.get(subject), currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    if (!this.exerciseRepository.listSubjects().includes(subject)) {
      throw new httpErrors["NotFound"]();
    }
    // TODO V what if exercise doesn't exist
    await this.exerciseRepository.structureSet(subject, hierarchy);
  }

  async init() {
    const diskSubjects = new Set(this.exerciseRepository.listSubjects());
    const dbSubjects = new Set(
      await this.subjectRepository.collection.find().map(({ id }) => id)
    );

    // TODO: see FindCursor (without .toArray())
    const allSubjects = new Set([...diskSubjects, ...dbSubjects]);

    for (const id of allSubjects) {
      const inDisk = diskSubjects.has(id);
      const inDb = dbSubjects.has(id);

      if (inDisk && !inDb) {
        //FIXME that sync db and disk but why?
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
