export type SearchFieldKind = 'title' | 'keywords' | 'description' | 'label' | 'text';

export type SearchField = {
  kind: SearchFieldKind;
  text: string;
};

export type SearchDocumentInput = {
  id: string;
  pageKey: string;
  route: string;
  pageTitle: string;
  title: string;
  fields: SearchField[];
};

export type SearchDocument = {
  id: string;
  pageKey: string;
  route: string;
  pageTitle: string;
  title: string;
  words: Record<string, number>;
  vector: Record<string, number>;
};

export type SearchIndex = {
  version: number;
  vocabulary: string[];
  idf: number[];
  documents: SearchDocument[];
};

export type SearchResult = {
  id: string;
  score: number;
  matchedTerms: string[];
  matchedPrefixes?: string[];
};

export type ParsedQuery = {
  words: string[];
  stems: Set<string>;
  concepts: Set<string>;
  weights: Map<string, number>;
  confidence: Map<string, number>;
};

export declare const INDEX_VERSION: number;
export declare const EXPANSION_WEIGHT: number;
export declare const PREFIX_WEIGHT: number;
export declare const FUZZY_WEIGHT: number;
export declare const SCORE_THRESHOLD: number;
export declare const MAX_RESULTS: number;
export declare const FIELD_BOOSTS: Record<SearchFieldKind, number>;

export declare const tokenize: (text: string) => string[];
export declare const splitWords: (text: string) => string[];
export declare const stemWord: (word: string) => string;
export declare const isConceptId: (term: string) => boolean;

export declare const collectTermWeights: (
  fields: SearchField[],
) => Map<string, number>;
export declare const buildIndex: (
  documents: SearchDocumentInput[],
) => SearchIndex;
export declare const buildQuery: (query: string) => ParsedQuery;
export declare const search: (
  index: SearchIndex,
  query: string,
) => SearchResult[];
export declare const literalSearch: (
  index: SearchIndex,
  query: string,
) => SearchResult[];
