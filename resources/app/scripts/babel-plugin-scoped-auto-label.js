import path from 'path';

/**
 * Derive a kebab-case basename from a source file path.
 *
 * @param {string} filename Absolute or relative file path.
 *
 * @returns {string} Kebab-case file basename without extension.
 */
const getFileLabel = (filename) => {
  const basename = path.basename(filename).replace(/\.[^.]+$/, '');

  return basename
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
};

/**
 * Walk up from a CallExpression to collect object property key names.
 *
 * @param {import('@babel/core').NodePath} callPath Path to the scoped() call.
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

    if (current.isVariableDeclarator() || current.isProgram()) {
      break;
    }

    current = current.parentPath;
  }

  return keys;
};

/**
 * Babel plugin that injects debug labels into scoped() calls during development.
 *
 * Transforms: scoped({ ... }) → scoped('base', { ... })
 *
 * Uses the leaf object key so composed styles stay short in DevTools
 * (e.g. css-xxx-base-primary-sm instead of long file+path labels).
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

        if (!callee.isIdentifier({ name: 'scoped' })) {
          return;
        }

        const args = callPath.node.arguments;

        if (args.length === 0) {
          return;
        }

        if (t.isStringLiteral(args[0])) {
          return;
        }

        const filename = state.filename || state.file?.opts?.filename || 'unknown';
        const fileLabel = getFileLabel(filename);
        const keyPath = getKeyPath(callPath);

        // Leaf key only so composed css={[base, primary, sm]} stays short:
        // css-xxx-base-primary-sm (not button-base-button-variants-primary-...)
        let label = fileLabel;

        if (keyPath.length > 0) {
          label = keyPath[keyPath.length - 1];
        } else {
          const line = callPath.node.loc?.start?.line;
          label = line ? `${fileLabel}-L${line}` : fileLabel;
        }

        callPath.node.arguments.unshift(t.stringLiteral(label));
      },
    },
  };
}
