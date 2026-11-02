import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';

import LocationProbe from './location-probe';

/**
 * The app's scoped styles are prefixed with `#wpbody-content .kirki-ecommerce-root`,
 * so a component rendered without these two ancestors gets none of its scoped CSS.
 */
const renderInRoot = (ui: ReactElement) => {
  return render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">{ui}</div>
    </div>,
  );
};

const renderPageAt = (url: string, page: ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <div id="wpbody-content">
      <div className="kirki-ecommerce-root">
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={[url]}>
            <Routes>
              <Route
                path="/analytics"
                element={
                  <>
                    {page}
                    <LocationProbe />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </div>
    </div>,
  );
};

/**
 * The opacity a user sees: the product of the computed opacity of the element and of
 * every ancestor. jsdom evaluates `:focus-within` and descendant selectors, but never `:hover`.
 */
const effectiveOpacity = (element: Element) => {
  let opacity = 1;

  for (let node: Element | null = element; node; node = node.parentElement) {
    const value = window.getComputedStyle(node).opacity;
    opacity *= value === '' ? 1 : Number(value);
  }

  return opacity;
};

type StyleRuleLike = {
  selectorText?: string;
  style?: { opacity?: string };
  cssRules?: ArrayLike<StyleRuleLike>;
  conditionText?: string;
  media?: { mediaText: string };
};

const collectRules = (rules: ArrayLike<StyleRuleLike>, media: string | null = null) => {
  const found: { selector: string; opacity: string; media: string | null }[] = [];

  for (const rule of Array.from(rules)) {
    if (rule.cssRules && !rule.selectorText) {
      found.push(...collectRules(rule.cssRules, rule.conditionText ?? rule.media?.mediaText ?? ''));
      continue;
    }
    if (rule.selectorText) {
      found.push({ selector: rule.selectorText, opacity: rule.style?.opacity ?? '', media });
    }
  }

  return found;
};

/** Every style rule on the page that sets an opacity, with the media query it sits in. */
const getOpacityRules = () => {
  const rules: { selector: string; opacity: string; media: string | null }[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    rules.push(...collectRules(sheet.cssRules as unknown as ArrayLike<StyleRuleLike>));
  }

  return rules.filter((rule) => rule.opacity !== '');
};

export { effectiveOpacity, getOpacityRules, renderInRoot, renderPageAt };
