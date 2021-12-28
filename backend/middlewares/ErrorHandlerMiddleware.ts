import { Logger } from "../services/mod.ts";
import { Context, HttpError, httpErrors } from "../deps.ts";
import { CustomDictError } from "../common/mod.ts";

const errors = {
  ExerciseBadAnswerFormat: "BadRequest",
  ExerciseBadFormat: "BadRequest",
  JWTNotPresented: "BadRequest",

  UserCredentialsInvalid: "Unauthorized",
  JWTNotFound: "Unauthorized",
  TeamInvitationNotFound: "Forbidden",

  UserNotFound: "NotFound",
  TeamNotFound: "NotFound",
  SubjectNotFound: "NotFound",
  ExerciseNotFound: "NotFound",
  NotFound: "NotFound",

  UserAlreadyExists: "Conflict",
  TeamAlreadyExists: "Conflict",
  SubjectAlreadyExists: "Conflict",
  ExerciseAlreadyExists: "Conflict",
} as const;

/**
 * map known errors to HttpErrors
 */
function mapErrors<T>(err: T | CustomDictError) {
  if (!(err instanceof CustomDictError)) {
    return err;
  }

  const httpErrorClass = httpErrors[errors[err.type]];

  return httpErrorClass ? new httpErrorClass(err.type) : err;
}

const sendError = (ctx: Context, { status, message }: HttpError) => {
  ctx.response.status = status;
  ctx.response.body = { status, message };
};

/**
 * map non HttpErrors errors to InternalServerError
 */
const normalize2HttpError = (e: unknown) =>
  e instanceof HttpError
    ? e
    : new httpErrors["InternalServerError"](
        //FIXME maybe dont show unknown errors to user?
        e instanceof Error ? e.message : ""
      );

export const ErrorHandlerMiddleware =
  (logger: Logger) => async (ctx: Context, next: () => unknown) => {
    try {
      await next();
    } catch (e: unknown) {
      const error = normalize2HttpError(mapErrors(e));

      sendError(ctx, error);

      if (error.status) {
        logger.recogniseAndTrace(e);
      }
    }
  };
