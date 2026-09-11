import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { stemWord } from '@/features/settings/search/search-engine.mjs';
import { useSettingsSearchTarget } from '@/features/settings/search/settings-search-context';
import { theme } from '@/theme';

const MARK_ATTRIBUTE = 'data-settings-search-mark';
const WORD_PATTERN = /[A-Za-z0-9]+/g;
const MAX_LOOKUP_FRAMES = 40;

const clearMarks = (root: ParentNode) => {
  for (const mark of root.querySelectorAll(`[${MARK_ATTRIBUTE}]`)) {
    const parent = mark.parentNode;

    if (!parent) {
      continue;
    }

    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    parent.normalize();
  }
};

const collectTextNodes = (element: Element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;

      if (!parent || parent.closest(`[${MARK_ATTRIBUTE}]`)) {
        return NodeFilter.FILTER_REJECT;
      }

      if (['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(parent.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }

      return node.nodeValue?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];

  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text);
  }

  return nodes;
};

const markTextNode = (node: Text, terms: Set<string>) => {
  const text = node.nodeValue ?? '';
  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const match of text.matchAll(WORD_PATTERN)) {
    if (!terms.has(stemWord(match[0].toLowerCase()))) {
      continue;
    }

    if (match.index > cursor) {
      fragment.append(text.slice(cursor, match.index));
    }

    const mark = document.createElement('mark');
    mark.setAttribute(MARK_ATTRIBUTE, 'true');
    mark.style.backgroundColor = theme.colors.background.fillSecondary;
    mark.style.color = 'inherit';
    mark.style.borderRadius = theme.radius.sm;
    mark.textContent = match[0];
    fragment.append(mark);

    cursor = match.index + match[0].length;
  }

  if (cursor === 0) {
    return;
  }

  if (cursor < text.length) {
    fragment.append(text.slice(cursor));
  }

  node.parentNode?.replaceChild(fragment, node);
};

export const useSearchHighlight = () => {
  const { target } = useSettingsSearchTarget();
  const { pathname } = useLocation();

  useEffect(() => {
    if (target?.route !== pathname || target.terms.length === 0) {
      return;
    }

    let frame = 0;
    let animationId = 0;
    let highlighted: Element | null = null;

    const attempt = () => {
      const element = document.querySelector(
        `[data-search-id="${CSS.escape(target.searchId)}"]`,
      );

      if (!element) {
        if (frame < MAX_LOOKUP_FRAMES) {
          frame += 1;
          animationId = window.requestAnimationFrame(attempt);
        }

        return;
      }

      highlighted = element;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const terms = new Set(target.terms);

      for (const node of collectTextNodes(element)) {
        markTextNode(node, terms);
      }
    };

    attempt();

    return () => {
      window.cancelAnimationFrame(animationId);

      if (highlighted) {
        clearMarks(highlighted);
      }
    };
  }, [target, pathname]);
};
