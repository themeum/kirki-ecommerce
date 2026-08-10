import { sprintf } from "@/wpi18n";

/* eslint-disable @typescript-eslint/no-invalid-void-type */
const replaceParams = (template: string, params: Record<string, unknown> = {}) => {
  return Object.keys(params).reduce(
    (acc, key) => acc.replace(`:${key}`, String(params[key])),
    template,
  );
};

const joinRoute = (primaryRoute: string, ...routes: string[]) =>
  sprintf('%s/%s', primaryRoute, routes.map((route) => route.replace(/\/$/, '')).join('/'));

// Based on https://davidtimms.github.io/programming-languages/typescript/2020/11/20/exploring-template-literal-types-in-typescript-4.1.html
type PathParams<Path extends string> = Path extends `:${infer Param}/${infer Rest}`
  ? Param | PathParams<Rest>
  : Path extends `:${infer Param}`
  ? Param
  : Path extends `${infer _Prefix}:${infer Rest}`
  ? PathParams<`:${Rest}`>
  : never;

type PathArgs<Path extends string> = Record<PathParams<Path>, string | number>;

export interface RouteChildren {
  [key: string]: RouteDefinition<string, RouteChildren>;
}

type ChildRoutes<ParentTemplate extends string, Children extends RouteChildren> = {
  [Key in keyof Children]: Children[Key] extends RouteDefinition<infer T, infer C>
    ? RouteDefinition<`${ParentTemplate}${T}`, ChildRoutes<ParentTemplate, C>>
    : never;
};

export interface RouteDefinition<T extends string, C extends RouteChildren = RouteChildren> {
  template: T;
  buildLink: (params: PathParams<T> extends never ? void : PathArgs<T>) => string;
  buildJoinLink: (
    joinTemplate: string,
    params: PathParams<T> extends never ? void : PathArgs<T>,
  ) => string;
  children: C;
  get: <Key extends keyof C>(name: Key) => C[Key];
}

const createRoute = <P extends string>(template: P) => {
  type Params = PathParams<P>;
  return {
    template,
    buildLink: (params: Params extends never ? void : PathArgs<P>) =>
      replaceParams(template, params as PathArgs<P> | undefined),
    buildJoinLink: (joinTemplate: string, params: Params extends never ? void : PathArgs<P>) =>
      joinRoute(
        replaceParams(template, params as PathArgs<P> | undefined),
        replaceParams(joinTemplate, params as PathArgs<P> | undefined),
      ),
  };
};

const createRouteNode = <P extends string, C extends RouteChildren>(
  template: P,
  children: C,
): RouteDefinition<P, C> => ({
  ...createRoute(template),
  children,
  get: (name) => children[name],
});

const buildChildRoutes = (parentTemplate: string, children: RouteChildren): RouteChildren =>
  Object.fromEntries(
    Object.entries(children).map(([key, child]) => [
      key,
      createRouteNode(
        `${parentTemplate}${child.template}`,
        buildChildRoutes(parentTemplate, child.children),
      ),
    ]),
  );

export const defineRoute = <P extends string, C extends RouteChildren = Record<never, never>>(
  template: P,
  children?: C,
): RouteDefinition<P, ChildRoutes<P, C>> => {
  return createRouteNode(template, buildChildRoutes(template, children ?? {}) as ChildRoutes<P, C>);
};
