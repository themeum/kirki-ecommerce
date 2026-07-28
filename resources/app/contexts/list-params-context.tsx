import { createContext, useContext, useMemo, type ReactNode } from 'react';

import useListParams, {
  type UseListParamsOptions,
} from '@/hooks/use-list-params';
import type { ListParams } from '@/types';

type ListParamsActions<TFilter extends Record<string, unknown> = {}> = Pick<
  ReturnType<typeof useListParams<TFilter>>,
  'setParam' | 'setParams' | 'resetParams'
>;

/*
 * Two contexts on purpose: the value changes on every URL change, the actions
 * never do. Write-only consumers (a search box, a filter popup's Apply button)
 * subscribe to the actions alone and stay out of the re-render path.
 */
const ListParamsValueContext = createContext<ListParams<
  Record<string, unknown>
> | null>(null);

const ListParamsActionsContext = createContext<ListParamsActions | null>(null);

type ListParamsProviderProps<TFilter extends Record<string, unknown>> = {
  options: UseListParamsOptions<TFilter>;
  children: ReactNode;
};

/*
 * `options` must be a stable reference (a module-scope constant) — otherwise
 * `useListParams` rebuilds its setters every render and the actions context
 * stops being stable.
 */
const ListParamsProvider = <TFilter extends Record<string, unknown> = {}>({
  options,
  children,
}: ListParamsProviderProps<TFilter>) => {
  const { params, setParam, setParams, resetParams } =
    useListParams<TFilter>(options);

  const actions = useMemo<ListParamsActions>(
    () =>
      ({ setParam, setParams, resetParams }) as unknown as ListParamsActions,
    [setParam, setParams, resetParams],
  );

  return (
    <ListParamsActionsContext.Provider value={actions}>
      <ListParamsValueContext.Provider
        value={params as unknown as ListParams<Record<string, unknown>>}
      >
        {children}
      </ListParamsValueContext.Provider>
    </ListParamsActionsContext.Provider>
  );
};

ListParamsProvider.displayName = 'ListParamsProvider';

const useListParamsValue = <
  TFilter extends Record<string, unknown> = {},
>(): ListParams<TFilter> => {
  const context = useContext(ListParamsValueContext);

  if (!context) {
    throw new Error('useListParamsValue must be used within ListParamsProvider');
  }

  return context as unknown as ListParams<TFilter>;
};

const useListParamsActions = <
  TFilter extends Record<string, unknown> = {},
>(): ListParamsActions<TFilter> => {
  const context = useContext(ListParamsActionsContext);

  if (!context) {
    throw new Error(
      'useListParamsActions must be used within ListParamsProvider',
    );
  }

  return context as unknown as ListParamsActions<TFilter>;
};

export { ListParamsProvider, useListParamsActions, useListParamsValue };
export type { ListParamsActions };
