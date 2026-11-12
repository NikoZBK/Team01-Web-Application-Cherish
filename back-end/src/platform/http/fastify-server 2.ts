import { randomUUID } from 'node:crypto';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import type { HttpConfig } from '../../config/config.ts';
import { forbidden } from '../../shared/domain/errors.ts';
import type { Principal } from '../../shared/domain/principal.ts';
import { AccessGuard, type Authenticator } from '../../shared/http/access-guard.ts';
import type { AppModule } from '../../shared/http/module.ts';
import type { ResponseCookie, Route } from '../../shared/http/route.ts';
import { ProblemSchema } from '../../shared/http/schemas.ts';
import type { HttpServer } from './http-server.ts';
import { problem, toProblem, type Problem } from './problem.ts';

declare module 'fastify' {
  interface FastifyRequest {
    principal: Principal | null;
  }
}

export interface FastifyServerOptions {
  readonly config: HttpConfig;
  readonly modules: readonly AppModule[];
  readonly authenticator: Authenticator;
}

const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);
const BEARER_SCHEME = 'bearerAuth';

/**
 * The only place that knows about Fastify. It applies the cross-cutting
 * protections (headers, CORS, CSRF origin check, throttling, validation,
 * access control, error shaping) uniformly to every route a module declares.
 */
export async function createFastifyServer(options: FastifyServerOptions): Promise<HttpServer> {
  const { config, modules } = options;
  const guard = new AccessGuard(options.authenticator);
  const allowedOrigins: ReadonlySet<string> = new Set(config.corsOrigins);

  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
    genReqId: () => randomUUID(),
    bodyLimit: config.bodyLimitBytes,
    trustProxy: config.trustProxy,
    requestTimeout: 30_000,
    ajv: {
      // Reject unknown properties instead of silently dropping them.
      customOptions: { removeAdditional: false, coerceTypes: true, useDefaults: true },
    },
  });

  await app.register(helmet, {
    // A JSON API serves no documents: lock the browser down completely.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    },
  });
  await app.register(cors, {
    origin: [...config.corsOrigins],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  });
  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: config.rateLimit.standardMax,
    timeWindow: config.rateLimit.windowMs,
  });
  await app.register(swagger, {
    openapi: {
      info: { title: 'Plug-n-Play Backend API', version: '1.0.0' },
      components: {
        securitySchemes: { [BEARER_SCHEME]: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
  });

  app.decorateRequest('principal', null);

  // CSRF defence for cookie-carrying requests: a browser always sends Origin on
  // state-changing cross-origin requests, so anything not on the allowlist is refused.
  app.addHook('onRequest', async (request) => {
    if (SAFE_METHODS.has(request.method)) return;
    const origin = request.headers.origin;
    if (origin !== undefined && !allowedOrigins.has(origin)) throw forbidden('Origin not allowed');
  });

  app.addHook('onSend', async (_request, reply) => {
    reply.header('cache-control', 'no-store');
  });

  app.setErrorHandler((error, request, reply) => {
    const result = toProblem(error);
    if (result.status >= 500) request.log.error({ err: error }, 'request failed');
    return sendProblem(request, reply, result);
  });

  app.setNotFoundHandler({ preHandler: app.rateLimit() }, (request, reply) =>
    sendProblem(request, reply, problem(404, 'not_found', 'Route not found')),
  );

  for (const module of modules) {
    for (const route of module.routes) {
      registerRoute(app, route, module.name, guard, config);
    }
  }

  if (config.exposeOpenApi) {
    app.get(`${config.basePath}/openapi.json`, { schema: { hide: true } }, async () => app.swagger());
  }

  return {
    listen: () => app.listen({ host: config.host, port: config.port }),
    close: () => app.close(),
  };
}

function registerRoute(
  app: FastifyInstance,
  route: Route,
  tag: string,
  guard: AccessGuard,
  config: HttpConfig,
): void {
  const isPublic = route.access.kind === 'public';
  const max = route.throttle === 'strict' ? config.rateLimit.strictMax : config.rateLimit.standardMax;

  app.route({
    method: route.method,
    url: `${config.basePath}${route.path}`,
    schema: {
      tags: [tag],
      summary: route.summary,
      ...(isPublic ? {} : { security: [{ [BEARER_SCHEME]: [] }] }),
      ...(route.request?.body ? { body: route.request.body } : {}),
      ...(route.request?.query ? { querystring: route.request.query } : {}),
      ...(route.request?.params ? { params: route.request.params } : {}),
      response: responseSchemas(route),
    },
    config: { rateLimit: { max, timeWindow: config.rateLimit.windowMs } },
    // Authenticate before the body is parsed or validated.
    onRequest: async (request) => {
      request.principal = await guard.resolve(route.access, request.headers.authorization);
    },
    handler: async (request, reply) => {
      const response = await route.handle({
        body: request.body,
        query: request.query,
        params: request.params,
        principal: request.principal,
        cookies: request.cookies,
      });
      for (const item of response.cookies ?? []) setCookie(reply, item, config);
      return reply.code(response.status).send(response.body);
    },
  });
}

function responseSchemas(route: Route): Record<string, unknown> {
  const schemas: Record<string, unknown> = { '4xx': ProblemSchema, '5xx': ProblemSchema };
  for (const [status, schema] of Object.entries(route.responses)) {
    schemas[status] = schema ?? { type: 'null', description: 'No content' };
  }
  return schemas;
}

function setCookie(reply: FastifyReply, item: ResponseCookie, config: HttpConfig): void {
  reply.setCookie(item.name, item.value, {
    path: item.path,
    maxAge: item.maxAgeSeconds,
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
  });
}

function sendProblem(request: FastifyRequest, reply: FastifyReply, result: Problem): FastifyReply {
  if (result.status === 401) reply.header('www-authenticate', 'Bearer');
  return reply
    .code(result.status)
    .type('application/problem+json')
    .send({ ...result, requestId: request.id });
}
