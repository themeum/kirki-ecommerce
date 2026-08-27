import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

import type { PathArgs, PathParams, RouteChildren, RouteDefinition } from '@/libs/route';

const usePageBack = <T extends string, C extends RouteChildren>(
  route: RouteDefinition<T, C>,
  params?: PathParams<T> extends never ? undefined : PathArgs<T>,
) => {
  const navigate = useNavigate();
  const location = useLocation();
  const link = (route.buildLink as (value?: PathArgs<T>) => string)(params);

  return useCallback(() => {
    const isCameFromCreate = (location.state as { fromCreate?: boolean } | null)?.fromCreate;
    const hasInAppHistory = (window.history.state?.idx ?? 0) > 0;

    if (isCameFromCreate || !hasInAppHistory) {
      void navigate(link);
      return;
    }

    void navigate(-1);
  }, [navigate, location, link]);
};

usePageBack.displayName = 'usePageBack';

export default usePageBack;
