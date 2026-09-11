import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { stemWord } from '@/features/settings/search/search-engine.mjs';
import { useSettingsSearchTarget } from '@/features/settings/search/settings-search-context';
import { theme } from '@/theme';

const MARK_ATTRIBUTE = 'data-settings-search-mark';
const GROUP_ATTRIBUTE = 'data-settings-search-mark-group';
const WORD_PATTERN = /[A-Za-z0-9]+/g;
const MAX_LOOKUP_FRAMES = 40;
export const FOCUS_HOLD_MS = 1000;
const FOCUS_RISE_MS = 150;
export const FOCUS_SETTLE_MS = 1200;
const FOCUS_LIFT = 'translateY(-4px)';
const FOCUS_SHADOW = `0 22px 56px -8px rgba(0, 0, 0, 0.30), 0 8px 20px -6px rgba(0, 0, 0, 0.16), 0 0 0 2px ${theme.colors.background.fillSecondaryHover}`;

const focusCard = (element: HTMLElement) => {
  element.style.transition = `transform ${FOCUS_RISE_MS}ms ease-out, box-shadow ${FOCUS_RISE_MS}ms ease-out`;
  element.style.transform = FOCUS_LIFT;
  element.style.boxShadow = FOCUS_SHADOW;

  const settleId = window.setTimeout(() => {
    element.style.transition = `transform ${FOCUS_SETTLE_MS}ms ease-in-out, box-shadow ${FOCUS_SETTLE_MS}ms ease-in-out`;
    element.style.removeProperty('transform');
    element.style.removeProperty('box-shadow');
  }, FOCUS_HOLD_MS);

  const restId = window.setTimeout(() => {
    element.style.removeProperty('transition');
  }, FOCUS_HOLD_MS + FOCUS_SETTLE_MS);

  return () => {
    window.clearTimeout(settleId);
    window.clearTimeout(restId);
    element.style.removeProperty('transform');
    element.style.removeProperty('box-shadow');
    element.style.removeProperty('transition');
  };
};

const clearMarks = (root: ParentNode) => {
  for (const group of root.querySelectorAll(`[${GROUP_ATTRIBUTE}]`)) {
    const parent = group.parentNode;

    if (!parent) {
      continue;
    }

    parent.replaceChild(document.createTextNode(group.textContent ?? ''), group);
    parent.normalize();
  }
};

const collectTextNodes = (element: Element) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;

      if (!parent || parent.closest(`[${GROUP_ATTRIBUTE}]`)) {
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

const markTextNode = (node: Text, terms: Set<string>, prefixes: string[]) => {
  const text = node.nodeValue ?? '';
  const fragment = document.createDocumentFragment();
  let cursor = 0;

  for (const match of text.matchAll(WORD_PATTERN)) {
    const word = match[0].toLowerCase();

    if (
      !terms.has(stemWord(word)) &&
      !prefixes.some((prefix) => word.startsWith(prefix))
    ) {
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

  const group = document.createElement('span');
  group.setAttribute(GROUP_ATTRIBUTE, 'true');
  group.append(fragment);

  node.parentNode?.replaceChild(group, node);
};

export const useSearchHighlight = () => {
  const { target } = useSettingsSearchTarget();
  const { pathname } = useLocation();

  useEffect(() => {
    if (
      target?.route !== pathname ||
      (target.terms.length === 0 && target.prefixes.length === 0)
    ) {
      return;
    }

    let frame = 0;
    let animationId = 0;
    let highlighted: Element | null = null;
    let releaseFocus: (() => void) | null = null;

    const attempt = () => {
      const element = document.querySelector<HTMLElement>(
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
      releaseFocus = focusCard(element);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const terms = new Set(target.terms);

      for (const node of collectTextNodes(element)) {
        markTextNode(node, terms, target.prefixes);
      }
    };

    attempt();

    return () => {
      window.cancelAnimationFrame(animationId);
      releaseFocus?.();

      if (highlighted) {
        clearMarks(highlighted);
      }
    };
  }, [target, pathname]);
};
