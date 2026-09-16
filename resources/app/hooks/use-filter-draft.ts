import { useCallback, useMemo, useRef, useState } from 'react';

import type { UseListParamsOptions } from '@/hooks/use-list-params';
import useListParams from '@/hooks/use-list-params';
import { getObjectKeys } from '@/utils/object';

type FilterDraftValue = string | number | boolean | string[] | number[] | undefined;

type FilterDraft = Record<string, FilterDraftValue>;

const isUnset = (value: FilterDraftValue, emptyValue: FilterDraftValue) => {
  if (Array.isArray(value)) {
    return !value.length;
  }

  if (value === undefined || value === null || value === '') {
    return true;
  }

  return value === emptyValue;
};

const useFilterDraft = <TFilter extends Record<string, unknown>, TDraft extends FilterDraft>(
  options: UseListParamsOptions<TFilter>,
  emptyDraft: TDraft,
) => {
  const { params, setParams } = useListParams<TFilter>(options);
  const [draft, setDraft] = useState<TDraft>(emptyDraft);

  const emptyDraftRef = useRef(emptyDraft);
  emptyDraftRef.current = emptyDraft;

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const appliedCount = useMemo(() => {
    const current = params as Record<string, FilterDraftValue>;

    return getObjectKeys(emptyDraft).filter((name) => {
      return !isUnset(current[name as string], emptyDraft[name]);
    }).length;
  }, [params, emptyDraft]);

  const setDraftValue = useCallback((name: keyof TDraft, value: FilterDraftValue) => {
    setDraft((previous) => ({
      ...previous,
      [name]: value,
    }));
  }, []);

  const handleOpen = useCallback(() => {
    const empty = emptyDraftRef.current;
    const current = paramsRef.current as Record<string, FilterDraftValue>;

    setDraft(
      getObjectKeys(empty).reduce((seeded, name) => {
        const value = current[name as string];

        return {
          ...seeded,
          [name]: isUnset(value, empty[name]) ? empty[name] : value,
        };
      }, {} as TDraft),
    );
  }, []);

  const handleClose = useCallback(() => {
    setDraft(emptyDraftRef.current);
  }, []);

  const handleApply = useCallback(() => {
    const empty = emptyDraftRef.current;
    const current = draftRef.current;

    setParams(
      getObjectKeys(empty).reduce((update, name) => {
        const value = current[name];

        return {
          ...update,
          [name]: isUnset(value, empty[name]) ? undefined : value,
        };
      }, {}),
    );
  }, [setParams]);

  const handleClear = useCallback(() => {
    const empty = emptyDraftRef.current;

    setDraft(empty);
    setParams(
      getObjectKeys(empty).reduce((update, name) => {
        return {
          ...update,
          [name]: undefined,
        };
      }, {}),
    );
  }, [setParams]);

  return {
    params,
    draft,
    appliedCount,
    setDraftValue,
    handleOpen,
    handleClose,
    handleApply,
    handleClear,
  };
};

export type { FilterDraft, FilterDraftValue };

export default useFilterDraft;
