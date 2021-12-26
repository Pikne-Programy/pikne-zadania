import { vs } from "../deps.ts";
import { makeSection, Section } from "../utils/mod.ts";
import { comb, kebabCase } from "../common/mod.ts";

export const exerciseSchema = {
  subject: vs.string({ strictType: true, pattern: comb(/_?/, kebabCase) }),
  id: vs.string({ strictType: true, pattern: kebabCase }),
  uid: vs.string({
    strictType: true,
    pattern: comb(/_?/, kebabCase, /\//, kebabCase),
  }),
  hierarchy: vs.array<Section>({
    converter: (arr: unknown[], f) => arr.map((e) => makeSection(e, f)),
  }),
  content: vs.string({ strictType: true }),
  answer: vs.object(),
};
