import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import type { PathArgs, PathParams, RouteChildren, RouteDefinition } from '@/libs/route';

const useRedirect = () => {
  const navigate = useNavigate();

  return useCallback(
    <T extends string, C extends RouteChildren>(
      route: RouteDefinition<T, C>,
      params: PathParams<T> extends never ? null : PathArgs<T>,
      fromCreate = false,
    ) => {
      const link = (route.buildLink as (value?: PathArgs<T>) => string)(
        (params ?? undefined) as PathArgs<T>,
      );
      void navigate(link, { state: { fromCreate } });
    },
    [navigate],
  );
};

useRedirect.displayName = 'useRedirect';

export default useRedirect;
