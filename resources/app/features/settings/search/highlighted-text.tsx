import { Fragment } from 'react';

import { stemWord } from '@/features/settings/search/search-engine.mjs';
import { defineStyles, scoped } from '@/theme/mixins';

type HighlightedTextProps = {
  text: string;
  terms: string[];
};

const WORD_PATTERN = /[A-Za-z0-9]+/g;

const HighlightedText = (props: HighlightedTextProps) => {
  const { text, terms } = props;

  if (terms.length === 0) {
    return <>{text}</>;
  }

  const matched = new Set(terms);
  const segments = [];
  let cursor = 0;

  for (const match of text.matchAll(WORD_PATTERN)) {
    const word = match[0];

    if (!matched.has(stemWord(word.toLowerCase()))) {
      continue;
    }

    if (match.index > cursor) {
      segments.push({ value: text.slice(cursor, match.index), isMatch: false });
    }

    segments.push({ value: word, isMatch: true });
    cursor = match.index + word.length;
  }

  if (cursor < text.length) {
    segments.push({ value: text.slice(cursor), isMatch: false });
  }

  return (
    <>
      {segments.map((segment, index) => (
        <Fragment key={`${segment.value}-${index}`}>
          {segment.isMatch ? (
            <mark css={scoped(styles.mark)}>{segment.value}</mark>
          ) : (
            segment.value
          )}
        </Fragment>
      ))}
    </>
  );
};

HighlightedText.displayName = 'HighlightedText';

export default HighlightedText;

const styles = defineStyles({
  mark: {
    backgroundColor: 'transparent',
    color: 'inherit',
    fontWeight: 700,
  },
});
