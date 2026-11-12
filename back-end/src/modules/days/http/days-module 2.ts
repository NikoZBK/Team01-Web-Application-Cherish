import { Type, type Static } from '@sinclair/typebox';
import type { AppModule } from '../../../shared/http/module.ts';
import { access, defineRoute, noContent, ok } from '../../../shared/http/route.ts';
import { strict } from '../../../shared/http/schemas.ts';
import type { DayService } from '../application/day-service.ts';
import { EMOTIONS, type DayContent } from '../domain/day.ts';

const DateSchema = Type.String({ format: 'date', pattern: '^\\d{4}-\\d{2}-\\d{2}$' });
const DateParams = Type.Object({ date: DateSchema }, strict);

const EmotionEntrySchema = Type.Object(
  {
    emotion: Type.Union(EMOTIONS.map((emotion) => Type.Literal(emotion))),
    magnitude: Type.Integer({ minimum: 1, maximum: 10 }),
    description: Type.String({ maxLength: 250 }),
    time: Type.String({ maxLength: 40 }),
  },
  strict,
);

const DayFields = {
  rating: Type.Number({ minimum: 0, maximum: 10 }),
  journal: Type.String({ maxLength: 2_000 }),
  emotions: Type.Array(EmotionEntrySchema, { maxItems: 100 }),
};

const DayDto = Type.Object({ date: Type.String({ format: 'date' }), ...DayFields });

function toDayDto(day: DayContent): Static<typeof DayDto> {
  return {
    date: day.date,
    rating: day.rating,
    journal: day.journal,
    emotions: day.emotions.map(({ emotion, magnitude, description, time }) => ({
      emotion,
      magnitude,
      description,
      time,
    })),
  };
}

/** The wellness calendar: one private day per user per calendar date. */
export function createDaysModule(days: DayService): AppModule {
  return {
    name: 'days',
    routes: [
      defineRoute({
        method: 'GET',
        path: '/days',
        summary: 'List your recorded days, oldest first, optionally within a date range',
        access: access.authenticated,
        request: {
          query: Type.Object({ from: Type.Optional(DateSchema), to: Type.Optional(DateSchema) }, strict),
        },
        responses: { 200: Type.Object({ items: Type.Array(DayDto) }) },
        handler: async ({ principal, query }) =>
          ok({ items: (await days.list(principal.userId, query)).map(toDayDto) }),
      }),
      defineRoute({
        method: 'DELETE',
        path: '/days',
        summary: 'Erase everything you have recorded',
        access: access.authenticated,
        responses: { 204: null },
        handler: async ({ principal }) => {
          await days.clear(principal.userId);
          return noContent();
        },
      }),
      defineRoute({
        method: 'GET',
        path: '/days/:date',
        summary: 'Get one of your days; a date with nothing recorded is returned blank',
        access: access.authenticated,
        request: { params: DateParams },
        responses: { 200: DayDto },
        handler: async ({ principal, params }) => ok(toDayDto(await days.get(principal.userId, params.date))),
      }),
      defineRoute({
        method: 'PUT',
        path: '/days/:date',
        summary: 'Record a day, replacing what was stored for that date',
        access: access.authenticated,
        request: { params: DateParams, body: Type.Object(DayFields, strict) },
        responses: { 200: DayDto },
        handler: async ({ principal, params, body }) =>
          ok(toDayDto(await days.save(principal.userId, params.date, body))),
      }),
    ],
  };
}
