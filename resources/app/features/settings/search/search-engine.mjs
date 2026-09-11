import {
  conceptsForStem,
  isConceptId,
  stemsForConcept,
} from './concept-lexicon.mjs';
import { splitWords, stemWord, tokenize } from './tokenizer.mjs';

export { isConceptId, splitWords, stemWord, tokenize };

export const INDEX_VERSION = 1;
export const EXPANSION_WEIGHT = 0.6;
export const SCORE_THRESHOLD = 0.12;
export const MAX_RESULTS = 12;

export const FIELD_BOOSTS = {
  title: 3,
  description: 2,
  label: 1.5,
  text: 1,
};

const addWeight = (weights, term, weight) => {
  weights.set(term, (weights.get(term) ?? 0) + weight);
};

export const collectTermWeights = (fields) => {
  const weights = new Map();

  for (const field of fields) {
    const boost = FIELD_BOOSTS[field.kind] ?? FIELD_BOOSTS.text;

    for (const stem of tokenize(field.text)) {
      addWeight(weights, stem, boost);

      for (const concept of conceptsForStem(stem)) {
        addWeight(weights, concept, boost * EXPANSION_WEIGHT);
      }
    }
  }

  return weights;
};

const termFrequency = (weight) => {
  return 1 + Math.log(weight);
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
      text: fields.map((field) => field.text).join(' '),
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
  const stems = tokenize(query);
  const concepts = new Set();
  const weights = new Map();

  for (const stem of stems) {
    addWeight(weights, stem, 1);

    for (const concept of conceptsForStem(stem)) {
      concepts.add(concept);
      addWeight(weights, concept, EXPANSION_WEIGHT);

      for (const sibling of stemsForConcept(concept)) {
        if (sibling !== stem) {
          addWeight(weights, sibling, EXPANSION_WEIGHT);
        }
      }
    }
  }

  return { stems: new Set(stems), concepts, weights };
};

const matchedTermsFor = (index, document, parsedQuery) => {
  const matched = [];

  for (const position of Object.keys(document.vector)) {
    const term = index.vocabulary[Number(position)];

    if (isConceptId(term)) {
      continue;
    }

    const isDirect = parsedQuery.stems.has(term);
    const isRelated = conceptsForStem(term).some((concept) =>
      parsedQuery.concepts.has(concept),
    );

    if (isDirect || isRelated) {
      matched.push(term);
    }
  }

  return matched;
};

export const search = (index, query) => {
  const parsedQuery = buildQuery(query);

  if (parsedQuery.weights.size === 0) {
    return [];
  }

  const lookup = termIndexOf(index);
  const entries = [];

  for (const [term, weight] of parsedQuery.weights) {
    const position = lookup.get(term);

    if (position === undefined) {
      continue;
    }

    entries.push([position, termFrequency(weight) * index.idf[position]]);
  }

  if (entries.length === 0) {
    return [];
  }

  const queryVector = new Map(normalize(entries));
  const results = [];

  for (const document of index.documents) {
    let score = 0;

    for (const [position, weight] of queryVector) {
      score += weight * (document.vector[position] ?? 0);
    }

    if (score < SCORE_THRESHOLD) {
      continue;
    }

    results.push({
      id: document.id,
      score,
      matchedTerms: matchedTermsFor(index, document, parsedQuery),
    });
  }

  return results.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS);
};
