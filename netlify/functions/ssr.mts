import type { Config, Context } from "@netlify/functions";

type ServerHandler = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response>;
};

let handlerPromise: Promise<ServerHandler> | undefined;

async function getHandler(): Promise<ServerHandler> {
  if (!handlerPromise) {
    handlerPromise = import("../../dist/server/server.js").then((m) => (m.default ?? m) as ServerHandler);
  }
  return handlerPromise;
}

export default async (req: Request, context: Context) => {
  const handler = await getHandler();
  return handler.fetch(req, undefined, context);
};

export const config: Config = {
  path: "/*",
  preferStatic: true,
};
