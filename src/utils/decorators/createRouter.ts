/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import { METADATA_KEYS } from "./routesDecorators.js";

type MiddlewareTypes = (
  req: Request,
  res: Response,
  next: NextFunction
) => unknown;

interface RouteDefinition {
  path: string;
  httpMethod: "get" | "post" | "put" | "delete" | "patch";
  methodName: string;
  middlewares: MiddlewareTypes[];
}

export function createRouterForController(ControllerClass: any) {
  const router = express.Router();
  const controller = new ControllerClass();

  const prefix = Reflect.getMetadata(METADATA_KEYS.prefix, ControllerClass);

  const routes: RouteDefinition[] =
    Reflect.getMetadata(METADATA_KEYS.routes, ControllerClass) || [];

  routes.forEach((route) => {
    const fullPath = prefix + route.path;
    const handler = controller[route.methodName];

    const boundHandler = handler.bind(controller);
    const routeMiddlewares = route.middlewares ?? [];

    router[route.httpMethod](fullPath, routeMiddlewares, boundHandler);
  });

  return router;
}
