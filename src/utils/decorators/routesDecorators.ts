/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import "reflect-metadata";

export const METADATA_KEYS = {
  prefix: Symbol("prefix"),
  routes: Symbol("routes"),
};

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

// --- The @Controller Class Decorator ---
export function Controller(prefix: string) {
  return function (target: any) {
    Reflect.defineMetadata(METADATA_KEYS.prefix, prefix, target);
  };
}

function createRouteDecorator(httpMethod: RouteDefinition["httpMethod"]) {
  return function (
    path: string,
    ...middlewares: MiddlewareTypes[]
  ): MethodDecorator {
    return function (
      target: any,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor
    ) {
      const controllerClass = target.constructor;
      const methodName = String(propertyKey);

      const routes: RouteDefinition[] =
        Reflect.getMetadata(METADATA_KEYS.routes, controllerClass) || [];

      routes.push({
        path,
        httpMethod,
        methodName,
        middlewares: middlewares ?? [],
      });

      Reflect.defineMetadata(METADATA_KEYS.routes, routes, controllerClass);

      // Wrap the Method with error handling
      const originalMethod = descriptor.value;

      descriptor.value = function (
        req: Request,
        res: Response,
        next: NextFunction
      ) {
        try {
          const result = originalMethod.apply(this, [req, res, next]);
          Promise.resolve(result).catch(next);
        } catch (error) {
          next(error);
        }
      };

      return descriptor;
    };
  };
}

export const Get = createRouteDecorator("get");
export const Post = createRouteDecorator("post");
export const Put = createRouteDecorator("put");
export const Delete = createRouteDecorator("delete");
export const Patch = createRouteDecorator("patch");
