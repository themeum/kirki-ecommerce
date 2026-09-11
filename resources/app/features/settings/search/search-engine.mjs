import {
  conceptsForStem,
  isConceptId,
  stemsForConcept,
} from './concept-lexicon.mjs';
import {
  editDistance,
  splitQueryWords,
  splitWords,
  stemWord,
  tokenize,
} from './tokenizer.mjs';

export { isConceptId, splitWords, stemWord, tokenize };

export const INDEX_VERSION = 1;
export const EXPANSION_WEIGHT = 0.6;
export const PREFIX_WEIGHT = 0.5;
export const FUZZY_WEIGHT = 0.4;
export const SCORE_THRESHOLD = 0.12;
export const MAX_RESULTS = 12;

const PREFIX_CONFIDENCE = 0.9;
const FUZZY_CONFIDENCE = 0.8;
const MIN_LOOSE_LENGTH = 3;
const MIN_FUZZY_LENGTH = 5;
const MAX_STEM_OVERSHOOT = 2;
const SHORT_WORD_LENGTH = 6;

export const FIELD_BOOSTS = {
  title: 3,
  keywords: 2.5,
  description: 2,
  label: 1.5,
  text: 1,
};

const addWeight = (weights, term, weight) => {
  weights.set(term, (weights.get(term) ?? 0) + weight);
};

const raiseConfidence = (confidence, term, value) => {
  confidence.set(term, Math.max(confidence.get(term) ?? 0, value));
};

export const collectTermWeights = (fields) => {
  const weights = new Map();

  for (const field of fields) {
    const boost = FIELD_BOOSTS[field.kind] ?? FIELD_BOOSTS.text;

    for (const stem of tokenize(field.text)) {
      addWeight(weights, stem, boost);

      const concepts = conceptsForStem(stem);

      for (const concept of concepts) {
        addWeight(weights, concept, (boost * EXPANSION_WEIGHT) / concepts.length);
      }
    }
  }

  return weights;
};

const surfaceWords = (fields) => {
  const words = {};

  for (const field of fields) {
    const boost = FIELD_BOOSTS[field.kind] ?? FIELD_BOOSTS.text;

    for (const word of splitWords(field.text)) {
      words[word] = Math.max(words[word] ?? 0, boost);
    }
  }

  return words;
};

const termFrequency = (weight) => {
  return weight <= 1 ? weight : 1 + Math.log(weight);
};

const normalize = (entries) => {
  const magnitude = Math.sqrt(
    entries.reduce((total, [, weight]) => total + weight * weight, 0),
  );

  if (magnitude === 0) {
    return [];
  }

  return entries.map(([term, weight]) => [term, weight / magnitude]);
};

export const buildIndex = (documents) => {
  const documentWeights = documents.map((document) =>
    collectTermWeights(document.fields),
  );

  const documentFrequency = new Map();

  for (const weights of documentWeights) {
    for (const term of weights.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const vocabulary = [...documentFrequency.keys()].sort();
  const termIndex = new Map(vocabulary.map((term, index) => [term, index]));
  const total = documents.length;
  const idf = vocabulary.map((term) =>
    Number(Math.log(1 + total / documentFrequency.get(term)).toFixed(6)),
  );

  const indexedDocuments = documents.map((document, position) => {
    const entries = [...documentWeights[position]].map(([term, weight]) => [
      term,
      termFrequency(weight) * idf[termIndex.get(term)],
    ]);

    const vector = {};

    for (const [term, weight] of normalize(entries)) {
      vector[termIndex.get(term)] = Number(weight.toFixed(5));
    }

    const { fields, ...rest } = document;

    return {
      ...rest,
      words: surfaceWords(fields),
      vector,
    };
  });

  return {
    version: INDEX_VERSION,
    vocabulary,
    idf,
    documents: indexedDocuments,
  };
};

const lookupCache = new WeakMap();

const termIndexOf = (index) => {
  const cached = lookupCache.get(index);

  if (cached) {
    return cached;
  }

  const lookup = new Map(index.vocabulary.map((term, position) => [term, position]));
  lookupCache.set(index, lookup);

  return lookup;
};

export const buildQuery = (query) => {
  const words = splitWords(query);
  const stems = words.map(stemWord);
  const concepts = new Set();
  const weights = new Map();
  const confidence = new Map();

  for (const stem of stems) {
    addWeight(weights, stem, 1);
    raiseConfidence(confidence, stem, 1);

    const stemConcepts = conceptsForStem(stem);
    const share = EXPANSION_WEIGHT / stemConcepts.length;

    for (const concept of stemConcepts) {
      concepts.add(concept);
      addWeight(weights, concept, share);

      for (const sibling of stemsForConcept(concept)) {
        if (sibling !== stem) {
          addWeight(weights, sibling, share);
          raiseConfidence(confidence, sibling, share);
        }
      }
    }
  }

  return { words, stems: new Set(stems), concepts, weights, confidence };
};

const prefixMatches = (word, vocabulary) => {
  return vocabulary.filter((term) => {
    if (isConceptId(term) || term.length < MIN_LOOSE_LENGTH) {
      return false;
    }

    return (
      term.startsWith(word) ||
      (word.startsWith(term) && word.length - term.length <= MAX_STEM_OVERSHOOT)
    );
  });
};

const fuzzyMatches = (stem, vocabulary) => {
  if (stem.length < MIN_FUZZY_LENGTH) {
    return [];
  }

  const limit = stem.length <= SHORT_WORD_LENGTH ? 1 : 2;

  return vocabulary.filter((term) => {
    if (isConceptId(term) || term.length < MIN_LOOSE_LENGTH) {
      return false;
    }

    return editDistance(stem, term, limit) <= limit;
  });
};

const resolveUnknownWords = (parsedQuery, vocabulary, lookup) => {
  const resolved = new Map();
  const confidence = new Map();
  const lastIndex = parsedQuery.words.length - 1;

  parsedQuery.words.forEach((word, index) => {
    const stem = stemWord(word);

    if (lookup.has(stem) || word.length < MIN_LOOSE_LENGTH) {
      return;
    }

    const prefixed = index === lastIndex ? prefixMatches(word, vocabulary) : [];
    const matches = prefixed.length > 0 ? prefixed : fuzzyMatches(stem, vocabulary);
    const weight = prefixed.length > 0 ? PREFIX_WEIGHT : FUZZY_WEIGHT;
    const certainty = prefixed.length > 0 ? PREFIX_CONFIDENCE : FUZZY_CONFIDENCE;

    for (const term of matches) {
      addWeight(resolved, term, weight);
      raiseConfidence(confidence, term, certainty);
    }
  });

  return { resolved, confidence };
};

const matchedTermsFor = (index, document, parsedQuery, literalTerms) => {
  const matched = [];

  for (const position of Object.keys(document.vector)) {
    const term = index.vocabulary[Number(position)];

    if (isConceptId(term)) {
      continue;
    }

    const isDirect = literalTerms.has(term);
    const isRelated = conceptsForStem(term).some((concept) =>
      parsedQuery.concepts.has(concept),
    );

    if (isDirect || isRelated) {
      matched.push(term);
    }
  }

  return matched;
};

export const literalSearch = (index, query) => {
  const words = splitQueryWords(query);

  if (words.length === 0) {
    return [];
  }

  const results = [];

  for (const document of index.documents) {
    const surface = Object.entries(document.words ?? {});
    const matchedPrefixes = [];
    let score = 0;

    for (const word of words) {
      let best = 0;

      for (const [candidate, boost] of surface) {
        if (candidate.startsWith(word)) {
          best = Math.max(best, boost);
        }
      }

      if (best === 0) {
        break;
      }

      score += best;
      matchedPrefixes.push(word);
    }

    if (matchedPrefixes.length !== words.length) {
      continue;
    }

    results.push({ id: document.id, score, matchedTerms: [], matchedPrefixes });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
};

export const search = (index, query) => {
  const parsedQuery = buildQuery(query);

  if (parsedQuery.weights.size === 0) {
    return literalSearch(index, query);
  }

  const lookup = termIndexOf(index);
  const { resolved, confidence } = resolveUnknownWords(
    parsedQuery,
    index.vocabulary,
    lookup,
  );
  const literalTerms = new Set([...parsedQuery.stems, ...resolved.keys()]);
  const weights = new Map(parsedQuery.weights);

  for (const [term, weight] of resolved) {
    addWeight(weights, term, weight);
  }

  for (const [term, value] of parsedQuery.confidence) {
    raiseConfidence(confidence, term, value);
  }

  const entries = [];
  const confidenceByPosition = new Map();

  for (const [term, weight] of weights) {
    const position = lookup.get(term);

    if (position === undefined) {
      continue;
    }

    entries.push([position, termFrequency(weight) * index.idf[position]]);
    confidenceByPosition.set(position, confidence.get(term) ?? 0);
  }

  if (entries.length === 0) {
    return literalSearch(index, query);
  }

  const queryVector = new Map(normalize(entries));
  const results = [];

  for (const document of index.documents) {
    let score = 0;
    let certainty = 0;

    for (const [position, weight] of queryVector) {
      const documentWeight = document.vector[position];

      if (!documentWeight) {
        continue;
      }

      score += weight * documentWeight;
      certainty = Math.max(certainty, confidenceByPosition.get(position) ?? 0);
    }

    if (score * certainty < SCORE_THRESHOLD) {
      continue;
    }

    results.push({
      id: document.id,
      score,
      matchedTerms: matchedTermsFor(index, document, parsedQuery, literalTerms),
    });
  }

  if (results.length === 0) {
    return literalSearch(index, query);
  }

  return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
};
