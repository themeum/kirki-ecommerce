const STOPWORDS = new Set([
  'a', 'about', 'all', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been',
  'but', 'by', 'can', 'do', 'does', 'each', 'for', 'from', 'had', 'has',
  'have', 'here', 'how', 'if', 'in', 'into', 'is', 'it', 'its', 'may', 'more',
  'most', 'must', 'no', 'not', 'of', 'on', 'once', 'only', 'or', 'other',
  'our', 'out', 'over', 'own', 'per', 'same', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this',
  'those', 'to', 'up', 'was', 'were', 'what', 'when', 'where', 'which',
  'while', 'who', 'will', 'with', 'would', 'you', 'your',
]);

const DOUBLED_KEEP = new Set(['l', 's', 'z']);

const collapseDoubled = (word) => {
  const last = word.at(-1);

  if (word.length > 3 && last === word.at(-2) && !DOUBLED_KEEP.has(last)) {
    return word.slice(0, -1);
  }

  return word;
};

export const stemWord = (word) => {
  let stem = word;

  if (stem.length > 4 && stem.endsWith('ies')) {
    stem = `${stem.slice(0, -3)}y`;
  } else if (stem.length > 4 && /(sses|shes|ches|xes|zes)$/.test(stem)) {
    stem = stem.slice(0, -2);
  } else if (stem.length > 3 && stem.endsWith('s') && !/(ss|us|is)$/.test(stem)) {
    stem = stem.slice(0, -1);
  }

  if (stem.length > 5 && stem.endsWith('ing')) {
    stem = collapseDoubled(stem.slice(0, -3));
  } else if (stem.length > 4 && stem.endsWith('ed')) {
    stem = collapseDoubled(stem.slice(0, -2));
  }

  if (stem.length > 4 && stem.endsWith('ly')) {
    stem = stem.slice(0, -2);
  }

  if (stem.length > 4 && stem.endsWith('e')) {
    stem = stem.slice(0, -1);
  }

  return stem.length >= 3 ? stem : word;
};

const splitTerms = (text, minLength) => {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= minLength && !STOPWORDS.has(word));
};

export const splitWords = (text) => {
  return splitTerms(text, 2);
};

export const splitQueryWords = (text) => {
  return splitTerms(text, 1);
};

export const tokenize = (text) => {
  return splitWords(text).map(stemWord);
};

export const isStopword = (word) => {
  return STOPWORDS.has(String(word ?? '').toLowerCase());
};

export const editDistance = (a, b, limit) => {
  if (Math.abs(a.length - b.length) > limit) {
    return limit + 1;
  }

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    let best = row;

    for (let column = 1; column <= b.length; column += 1) {
      const substitution = previous[column - 1] + (a[row - 1] === b[column - 1] ? 0 : 1);
      const distance = Math.min(current[column - 1] + 1, previous[column] + 1, substitution);

      current.push(distance);
      best = Math.min(best, distance);
    }

    if (best > limit) {
      return limit + 1;
    }

    previous = current;
  }

  return previous[b.length];
};
