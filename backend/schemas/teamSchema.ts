import { vs } from "../deps.ts";
import {
  reservedTeamInvitation,
  teamInvitationOptions,
  teamNameOptions,
} from "../common/mod.ts";

export const teamSchema = {
  id: vs.number({ strictType: true, minValue: 1, integer: true }),
  name: vs.string(teamNameOptions),
  /** `undefined` -> `null` */
  nameOptional: vs.string({ ...teamNameOptions, ifUndefined: null }),
  /** `null` -> `""` */
  invitation: vs.string({ ...teamInvitationOptions, ifNull: "" }),
  invitationRequired: vs.string(teamInvitationOptions),
  /** `null` -> `""`, `undefined` -> `null` */
  invitationOptional: vs.string({
    ...teamInvitationOptions,
    ifUndefined: null,
    ifNull: "",
  }),
  /** `null` -> `""`, `undefined` -> `null`, `""` -> `"\u0011"` (`reservedTeamInvitation`) */
  invitationGenerateOptional: vs.string({
    ...teamInvitationOptions,
    ifUndefined: null,
    ifNull: "",
    ifEmptyString: reservedTeamInvitation,
  }),
};
