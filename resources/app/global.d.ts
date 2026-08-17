/// <reference types="vite/client" />

import type { CSSObject } from '@emotion/react';
import type { RowData } from '@tanstack/react-table';

import type { AppTheme } from '@/theme';
import type { TableAlignment } from '@/types/components/common';

import '@emotion/react';
import '@tanstack/react-table';

type KirkiEcommerceConfig = {
  site_url: string;
  rest_url_base: string;
  rest_nonce: string;
  version: string;
  is_dev: boolean;
};

type WpI18n = {
  __: (text: string, domain?: string) => string;
  _x: (text: string, context: string, domain?: string) => string;
  _n: (
    single: string,
    plural: string,
    number: number,
    domain?: string,
  ) => string;
  _nx: (
    single: string,
    plural: string,
    number: number,
    context: string,
    domain?: string,
  ) => string;
  sprintf: (format: string, ...args: (string | number)[]) => string;
  setLocaleData: (data: Record<string, unknown>, domain?: string) => void;
  getLocaleData: (domain?: string) => Record<string, unknown>;
};

type TinyMceEditor = {
  on: (event: string, callback: () => void) => void;
  setContent: (content: string) => void;
  getContent: () => string;
  remove: () => void;
};

type TinyMceStatic = {
  init: (settings: Record<string, unknown>) => void;
  get: (id: string) => TinyMceEditor | null;
};

type WpMediaAttachment = {
  toJSON: () => Record<string, unknown>;
};

type WpMediaSelection = {
  map: <T>(callback: (attachment: WpMediaAttachment) => T) => T[];
};

type WpMediaFrame = {
  on: (event: string, callback: () => void) => void;
  state: () => {
    get: (key: string) => WpMediaSelection;
  };
  open: () => void;
};

type WpMediaFactory = (options: {
  title?: string;
  library?: { type?: AcceptedMediaTypes[] };
  multiple?: boolean;
  button?: { text?: string };
}) => WpMediaFrame;

type WpEditor = {
  initialize?: (id: string, settings?: Record<string, unknown>) => void;
  remove?: (id: string) => void;
};

type WpGlobal = {
  i18n?: WpI18n;
  editor?: WpEditor;
  media?: WpMediaFactory;
};

declare global {
  interface Window {
    kirki_ecommerce: KirkiEcommerceConfig;
    wp?: WpGlobal;
    tinymce?: TinyMceStatic;
  }

  const wp: WpGlobal | undefined;
}

declare module '@emotion/react' {
  export interface Theme extends AppTheme { }
}

declare module '@tanstack/table-core' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must match table-core's own param names for declaration merging to unify
  interface ColumnMeta<TData extends RowData, TValue> {
    alignment?: TableAlignment;
    cssOverride?: CSSObject;
  }
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

export { };

