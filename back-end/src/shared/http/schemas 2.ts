import { Type, type TSchema } from '@sinclair/typebox';

/** Every object schema rejects unknown properties (no mass assignment). */
export const strict = { additionalProperties: false } as const;

export const MAX_PAGE_SIZE = 100;

export const IdParams = Type.Object({ id: Type.String({ format: 'uuid' }) }, strict);

export const PageQuery = Type.Object(
  {
    limit: Type.Integer({ minimum: 1, maximum: MAX_PAGE_SIZE, default: 20 }),
    offset: Type.Integer({ minimum: 0, maximum: 1_000_000, default: 0 }),
  },
  strict,
);

export const pageOf = <T extends TSchema>(item: T) =>
  Type.Object({
    items: Type.Array(item),
    total: Type.Integer(),
    limit: Type.Integer(),
    offset: Type.Integer(),
  });

/** RFC 9457 problem details, used for every error response. */
export const ProblemSchema = Type.Object({
  type: Type.String(),
  title: Type.String(),
  status: Type.Integer(),
  detail: Type.String(),
  code: Type.String(),
  requestId: Type.String(),
  errors: Type.Optional(
    Type.Array(Type.Object({ path: Type.String(), message: Type.String() })),
  ),
});
