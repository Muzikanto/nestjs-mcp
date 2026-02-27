import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { IncomingMessage, ServerResponse } from "http";

export type IRequest = {
  original: IncomingMessage & {
    auth?: AuthInfo;
  };
  query?: object;
  body?: object;
};

export type IResponse = {
  original: ServerResponse;
  send: (statusCode: number, result: string) => void;
};

export type IHttpAdapter = {
  getRequest: (req: any) => IRequest;
  getResponse: (res: any) => IResponse;
};

export const DEFAULT_FASTIFY_ADAPTER: IHttpAdapter = {
  getRequest: (fastifyRequest) => {
    return {
      original: fastifyRequest.raw,
      body: fastifyRequest.body,
      query: fastifyRequest.query,
    };
  },
  getResponse: (fastifyResponse) => {
    return {
      original: fastifyResponse.raw,
      send: (code, result) => fastifyResponse.status(code).send(result),
    };
  },
};
