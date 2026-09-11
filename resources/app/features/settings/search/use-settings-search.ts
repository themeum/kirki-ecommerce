import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

import {
  advancedSettings,
  businessOperationSettings,
  storeManagementSettings,
} from '@/features/settings/lib/utils';
import { loadSearchIndex } from '@/features/settings/search/load-index.mjs';
import { search, type SearchIndex } from '@/features/settings/search/search-engine.mjs';

type SettingsSearchResult = {
  id: string;
  title: string;
  pageTitle: string;
  route: string;
  icon: ReactNode;
  matchedTerms: string[];
};

const buildIconMap = () => {
  const icons = new Map<string, ReactNode>();

  for (const item of [
    ...storeManagementSettings,
    ...businessOperationSettings,
    ...advancedSettings,
  ]) {
    if (!icons.has(item.link)) {
      icons.set(item.link, item.icon);
    }
  }

  return icons;
};

const iconByRoute = buildIconMap();

const useSearchIndex = (enabled: boolean) => {
  const [index, setIndex] = useState<SearchIndex | null>(null);

  useEffect(() => {
    if (!enabled || index) {
      return;
    }

    let cancelled = false;

    void loadSearchIndex().then((loaded) => {
      if (!cancelled) {
        setIndex(loaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, index]);

  return index;
};

export const useSettingsSearch = (query: string) => {
  const trimmedQuery = query.trim();
  const index = useSearchIndex(trimmedQuery.length > 0);

  const results = useMemo<SettingsSearchResult[]>(() => {
    if (!index || !trimmedQuery) {
      return [];
    }

    const documents = new Map(index.documents.map((document) => [document.id, document]));

    return search(index, trimmedQuery).flatMap((result) => {
      const document = documents.get(result.id);

      if (!document) {
        return [];
      }

      return [
        {
          id: document.id,
          title: document.title,
          pageTitle: document.pageTitle,
          route: document.route,
          icon: iconByRoute.get(document.route) ?? null,
          matchedTerms: result.matchedTerms,
        },
      ];
    });
  }, [index, trimmedQuery]);

  return {
    results,
    isSearching: trimmedQuery.length > 0,
    isLoading: trimmedQuery.length > 0 && !index,
  };
};

export type { SettingsSearchResult };
