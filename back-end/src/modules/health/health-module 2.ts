import { Type } from '@sinclair/typebox';
import type { HealthProbe } from '../../shared/application/ports.ts';
import type { AppModule } from '../../shared/http/module.ts';
import { access, defineRoute, ok } from '../../shared/http/route.ts';

const StatusDto = Type.Object({ status: Type.Union([Type.Literal('ok'), Type.Literal('unavailable')]) });

/** Liveness and readiness for load balancers. Deliberately reveals nothing else. */
export function createHealthModule(probe: HealthProbe): AppModule {
  return {
    name: 'health',
    routes: [
      defineRoute({
        method: 'GET',
        path: '/health',
        summary: 'Liveness: the process is serving requests',
        access: access.public,
        responses: { 200: StatusDto },
        handler: async () => ok({ status: 'ok' }),
      }),
      defineRoute({
        method: 'GET',
        path: '/health/ready',
        summary: 'Readiness: dependencies are reachable',
        access: access.public,
        responses: { 200: StatusDto, 503: StatusDto },
        handler: async () => {
          const reachable = await probe.ping().then(
            () => true,
            () => false,
          );
          return reachable ? ok({ status: 'ok' }) : { status: 503, body: { status: 'unavailable' } };
        },
      }),
    ],
  };
}
