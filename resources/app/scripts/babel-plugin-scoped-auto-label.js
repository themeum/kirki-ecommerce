import path from 'path';

const MIXINS_MODULE_SUFFIX = 'theme/mixins';
const LABELED_HELPERS = new Set(['scoped', 'scopedMerge']);

/**
 * Convert a camelCase/snake_case name to kebab-case.
 *
 * @param {string} name Source name.
 *
 * @returns {string} Kebab-case name.
 */
const toKebabCase = (name) => {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
};

/**
 * Derive a kebab-case basename from a source file path.
 *
 * @param {string} filename Absolute or relative file path.
 *
 * @returns {string} Kebab-case file basename without extension.
 */
const getFileLabel = (filename) => {
  return toKebabCase(path.basename(filename).replace(/\.[^.]+$/, ''));
};

/**
 * Check that an identifier callee is the scoped()/scopedMerge() helper imported
 * from theme/mixins, and not an unrelated local binding with the same name.
 *
 * Calls made *inside* theme/mixins.ts resolve to local bindings, so the
 * scoped() call that scopedMerge() makes internally is never labeled — that is
 * what kept every scopedMerge() call site collapsing onto one `mixins-L<line>`
 * label.
 *
 * @param {import('@babel/core').NodePath} callPath Path to the helper call.
 * @param {string} name Local callee name.
 *
 * @returns {string|null} The imported helper name, or null when not a helper.
 */
const getHelperName = (callPath, name) => {
  const binding = callPath.scope.getBinding(name);

  if (!binding || !binding.path.isImportSpecifier()) {
    return null;
  }

  const source = binding.path.parentPath.node.source.value;

  if (!source.endsWith(MIXINS_MODULE_SUFFIX)) {
    return null;
  }

  const imported = binding.path.node.imported;
  const importedName = imported.type === 'Identifier' ? imported.name : imported.value;

  return LABELED_HELPERS.has(importedName) ? importedName : null;
};

/**
 * Walk up from a CallExpression to collect object property key names, stopping
 * at the enclosing function or declarator so unrelated outer keys aren't picked up.
 *
 * @param {import('@babel/core').NodePath} callPath Path to the helper call.
 *
 * @returns {string[]} Key path from outermost object property to innermost.
 */
const getKeyPath = (callPath) => {
  const keys = [];
  let current = callPath.parentPath;

  while (current) {
    if (current.isObjectProperty()) {
      const keyNode = current.node.key;

      if (current.node.computed) {
        break;
      }

      if (keyNode.type === 'Identifier') {
        keys.unshift(keyNode.name);
      } else if (keyNode.type === 'StringLiteral') {
        keys.unshift(keyNode.value);
      } else {
        break;
      }
    }

    if (current.isFunction() || current.isVariableDeclarator() || current.isProgram()) {
      break;
    }

    current = current.parentPath;
  }

  return keys;
};

/**
 * Babel plugin that injects debug labels into scoped()/scopedMerge() calls
 * during development.
 *
 * Transforms: scoped({ ... }) → scoped('button-L77', { ... })
 *
 * Labels are file-qualified so the generated Emotion class name
 * (e.g. css-1062m53-button-L77) points at the exact call site.
 *
 * @param {import('@babel/core')} api Babel API.
 *
 * @returns {import('@babel/core').PluginObj} Babel plugin object.
 */
export default function babelPluginScopedAutoLabel(api) {
  const { types: t } = api;

  if (!api.env('development')) {
    return {};
  }

  return {
    name: 'scoped-auto-label',
    visitor: {
      CallExpression(callPath, state) {
        const callee = callPath.get('callee');

        if (!callee.isIdentifier()) {
          return;
        }

        if (!getHelperName(callPath, callee.node.name)) {
          return;
        }

        const args = callPath.node.arguments;

        if (args.length === 0 || t.isStringLiteral(args[0])) {
          return;
        }

        const filename = state.filename || state.file?.opts?.filename || 'unknown';
        const fileLabel = getFileLabel(filename);
        const keyPath = getKeyPath(callPath);
        const leafKey = keyPath[keyPath.length - 1];
        const line = callPath.node.loc?.start?.line;

        const label = leafKey
          ? `${fileLabel}-${toKebabCase(leafKey)}`
          : `${fileLabel}-L${line ?? 0}`;

        callPath.node.arguments.unshift(t.stringLiteral(label));
      },
    },
  };
}
