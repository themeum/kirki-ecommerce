import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

import { buildIndex } from '../features/settings/search/search-engine.mjs';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTINGS_ROOT = path.join(APP_ROOT, 'features/settings');
const NAV_ITEMS_FILE = path.join(SETTINGS_ROOT, 'lib/utils.tsx');
const OUTPUT_FILE = path.join(SETTINGS_ROOT, 'search/settings-search-index.json');

const SETTINGS_PAGES = {
  general: { route: '/settings/general', pageTitle: 'General', routeKey: 'GeneralSettings' },
  products: { route: '/settings/products', pageTitle: 'Products', routeKey: 'ProductsSettings' },
  essentials: { route: '/settings/essentials', pageTitle: 'Essentials', routeKey: 'EssentialsSettings' },
  shipping: { route: '/settings/shipping', pageTitle: 'Shipping', routeKey: 'ShippingSettings' },
  currency: { route: '/settings/currency', pageTitle: 'Currency', routeKey: 'MultiCurrencySettings' },
  tax: { route: '/settings/tax', pageTitle: 'Tax', routeKey: 'TaxSettings' },
  payments: { route: '/settings/payments', pageTitle: 'Payments', routeKey: 'PaymentSettings' },
  checkout: { route: '/settings/checkout', pageTitle: 'Checkout', routeKey: 'CheckoutSettings' },
  email: { route: '/settings/email', pageTitle: 'Emails', routeKey: 'EmailSettings' },
  advanced: { route: '/settings/advanced', pageTitle: 'Advanced', routeKey: 'AdvancedSettings' },
};

const NAV_ITEM_ARRAYS = [
  'storeManagementSettings',
  'businessOperationSettings',
  'advancedSettings',
];

const ATTRIBUTE_KINDS = {
  title: 'title',
  header: 'title',
  description: 'description',
  subHeader: 'description',
  infoText: 'description',
  helpText: 'description',
  label: 'label',
  placeholder: 'text',
  btnText: 'text',
  buttonText: 'text',
  text: 'text',
};

const ELEMENT_KINDS = {
  CardTitle: 'title',
  CardDescription: 'description',
};

const TRANSLATION_CALLS = new Set(['__', '_x']);

const warnings = [];

const listSourceFiles = (directory) => {
  const found = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      found.push(...listSourceFiles(entryPath));
      continue;
    }

    if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      found.push(entryPath);
    }
  }

  return found.sort();
};

const parse = (filePath) => {
  return ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
};

const lineOf = (sourceFile, node) => {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
};

const openingElementOf = (node) => {
  if (ts.isJsxElement(node)) {
    return node.openingElement;
  }

  if (ts.isJsxSelfClosingElement(node)) {
    return node;
  }

  return null;
};

const translatedLiteral = (node, sourceFile) => {
  if (!node || !ts.isCallExpression(node)) {
    return null;
  }

  const [firstArgument] = node.arguments;

  if (
    !TRANSLATION_CALLS.has(node.expression.getText(sourceFile)) ||
    !firstArgument ||
    !(ts.isStringLiteral(firstArgument) ||
      ts.isNoSubstitutionTemplateLiteral(firstArgument))
  ) {
    return null;
  }

  return firstArgument.text;
};

const attributeValue = (opening, sourceFile, name) => {
  for (const attribute of opening.attributes.properties) {
    if (!ts.isJsxAttribute(attribute)) {
      continue;
    }

    if (attribute.name.getText(sourceFile) !== name) {
      continue;
    }

    const { initializer } = attribute;

    if (initializer && ts.isStringLiteral(initializer)) {
      return initializer.text;
    }

    if (initializer && ts.isJsxExpression(initializer)) {
      return translatedLiteral(initializer.expression, sourceFile);
    }
  }

  return null;
};

const textElementKind = (opening, sourceFile) => {
  const variant = attributeValue(opening, sourceFile, 'variant');
  const weight = attributeValue(opening, sourceFile, 'weight');
  const color = attributeValue(opening, sourceFile, 'color');

  if (variant?.startsWith('heading') || ['semibold', 'bold'].includes(weight)) {
    return 'title';
  }

  if (weight === 'medium') {
    return 'title';
  }

  if (['secondary', 'subdued'].includes(color)) {
    return 'description';
  }

  return null;
};

const collectFromFile = (filePath, documents) => {
  const sourceFile = parse(filePath);
  const relativePath = path.relative(APP_ROOT, filePath);

  const openScope = (searchId, node, opening) => {
    const [pageKey] = searchId.split('.');
    const page = SETTINGS_PAGES[pageKey];

    if (!page) {
      warnings.push(
        `${relativePath}:${lineOf(sourceFile, node)} unknown page key "${pageKey}" in data-search-id="${searchId}"`,
      );
    }

    const scope = {
      id: searchId,
      pageKey,
      route: page?.route ?? '',
      pageTitle: page?.pageTitle ?? pageKey,
      title: '',
      fields: [],
    };

    documents.push(scope);

    const declaredTitle = attributeValue(opening, sourceFile, 'data-search-title');

    if (declaredTitle) {
      push(scope, 'title', declaredTitle);
    }

    const declaredKeywords = attributeValue(opening, sourceFile, 'data-search-keywords');

    for (const keyword of (declaredKeywords ?? '').split(',')) {
      push(scope, 'keywords', keyword);
    }

    return scope;
  };

  const push = (scope, kind, value) => {
    const text = value.replace(/\s+/g, ' ').trim();

    if (!scope || !text) {
      return;
    }

    scope.fields.push({ kind, text });

    if (!scope.title && kind === 'title') {
      scope.title = text;
    }
  };

  const visit = (node, scope, kind) => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(sourceFile);
      const [firstArgument] = node.arguments;

      if (
        TRANSLATION_CALLS.has(callee) &&
        firstArgument &&
        (ts.isStringLiteral(firstArgument) ||
          ts.isNoSubstitutionTemplateLiteral(firstArgument))
      ) {
        push(scope, kind, firstArgument.text);
      }
    }

    if (ts.isJsxText(node)) {
      push(scope, kind, node.text);
    }

    const opening = openingElementOf(node);

    if (!opening) {
      ts.forEachChild(node, (child) => visit(child, scope, kind));
      return;
    }

    const tagName = opening.tagName.getText(sourceFile);
    const searchId = attributeValue(opening, sourceFile, 'data-search-id');
    const nextScope = searchId ? openScope(searchId, node, opening) : scope;

    if (!scope && !searchId && tagName === 'Card') {
      const body = sourceFile.text.slice(node.pos, node.end);

      if (body.includes('__(') && !body.includes('data-search-skip')) {
        warnings.push(
          `${relativePath}:${lineOf(sourceFile, node)} <Card> has translated copy but no data-search-id`,
        );
      }
    }

    const nextKind =
      ELEMENT_KINDS[tagName] ??
      (tagName === 'Text' ? textElementKind(opening, sourceFile) : null) ??
      kind;

    for (const attribute of opening.attributes.properties) {
      if (
        ts.isJsxAttribute(attribute) &&
        attribute.name.getText(sourceFile).startsWith('data-search-')
      ) {
        continue;
      }

      if (ts.isJsxAttribute(attribute) && attribute.initializer) {
        const attributeKind =
          ATTRIBUTE_KINDS[attribute.name.getText(sourceFile)] ?? nextKind;
        visit(attribute.initializer, nextScope, attributeKind);
        continue;
      }

      visit(attribute, nextScope, nextKind);
    }

    if (ts.isJsxElement(node)) {
      for (const child of node.children) {
        visit(child, nextScope, nextKind);
      }
    }
  };

  visit(sourceFile, null, 'text');
};

const slugify = (value) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

const findRouteKey = (node, sourceFile) => {
  let routeKey = null;

  const visit = (current) => {
    if (
      routeKey === null &&
      ts.isCallExpression(current) &&
      current.expression.getText(sourceFile).endsWith('.get') &&
      current.arguments.length > 0 &&
      ts.isStringLiteral(current.arguments[0])
    ) {
      routeKey = current.arguments[0].text;
    }

    ts.forEachChild(current, visit);
  };

  visit(node);

  return routeKey;
};

const findTranslatedString = (node, sourceFile) => {
  let value = null;

  const visit = (current) => {
    if (
      value === null &&
      ts.isCallExpression(current) &&
      TRANSLATION_CALLS.has(current.expression.getText(sourceFile)) &&
      current.arguments.length > 0 &&
      ts.isStringLiteral(current.arguments[0])
    ) {
      value = current.arguments[0].text;
    }

    ts.forEachChild(current, visit);
  };

  visit(node);

  return value;
};

const collectNavigationItems = () => {
  const sourceFile = parse(NAV_ITEMS_FILE);
  const pageByRouteKey = new Map(
    Object.entries(SETTINGS_PAGES).map(([pageKey, page]) => [
      page.routeKey,
      { pageKey, ...page },
    ]),
  );
  const documents = [];

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      NAV_ITEM_ARRAYS.includes(node.name.getText(sourceFile)) &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) {
          continue;
        }

        const parts = {};

        for (const property of element.properties) {
          if (!ts.isPropertyAssignment(property)) {
            continue;
          }

          parts[property.name.getText(sourceFile)] = property.initializer;
        }

        const header = parts.header && findTranslatedString(parts.header, sourceFile);
        const subHeader =
          parts.subHeader && findTranslatedString(parts.subHeader, sourceFile);
        const routeKey = parts.link && findRouteKey(parts.link, sourceFile);
        const page = pageByRouteKey.get(routeKey);

        if (!header || !page) {
          warnings.push(
            `features/settings/lib/utils.tsx:${lineOf(sourceFile, element)} navigation item skipped (header or route unresolved)`,
          );
          continue;
        }

        documents.push({
          id: `nav.${slugify(header)}`,
          pageKey: page.pageKey,
          route: page.route,
          pageTitle: page.pageTitle,
          title: header,
          fields: [
            { kind: 'title', text: header },
            ...(subHeader ? [{ kind: 'description', text: subHeader }] : []),
          ],
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return documents;
};

const cardDocuments = [];

for (const filePath of listSourceFiles(SETTINGS_ROOT)) {
  collectFromFile(filePath, cardDocuments);
}

const documents = [...collectNavigationItems(), ...cardDocuments];
const empty = documents.filter((document) => document.fields.length === 0);

for (const document of empty) {
  warnings.push(`document "${document.id}" has no translated copy`);
}

const untitled = documents.filter((document) => !document.title);

for (const document of untitled) {
  warnings.push(
    `document "${document.id}" has no title the crawler can read — add data-search-title, or a result will show its id`,
  );
}

const index = buildIndex(
  documents.map((document) => ({
    ...document,
    title: document.title || document.id.split('.').slice(1).join(' '),
  })),
);

fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(index, null, 2)}\n`);

for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

console.log(
  `settings search index: ${index.documents.length} documents, ${index.vocabulary.length} terms, ${warnings.length} warnings`,
);
console.log(`written to ${path.relative(APP_ROOT, OUTPUT_FILE)}`);
