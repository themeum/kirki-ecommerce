import { type SerializedStyles } from '@emotion/react';
import { useEffect, useMemo, useRef } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type Shortcode = { label: string; value: string };

type RichTextProps = {
  id?: string;
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  label?: string | false;
  helpText?: string;
  error?: string | boolean;
  css?: SerializedStyles;
  shortcodes?: Shortcode[];
  rootBlockElement?: 'p' | 'div';
};

type TinyMceEvent = {
  key?: string;
  newBlock?: HTMLElement;
  preventDefault: () => void;
};

type TinyMceEditorInstance = {
  on: (event: string, callback: (event: TinyMceEvent) => void) => void;
  setContent: (content: string) => void;
  getContent: () => string;
  remove: () => void;
  addButton: (name: string, settings: Record<string, unknown>) => void;
  focus: () => void;
  getWin: () => Window;
  getContainer: () => HTMLElement;
  iframeElement: HTMLIFrameElement;
  formatter: {
    apply: (name: string, vars?: Record<string, unknown>) => void;
  };
  selection: {
    getBookmark: (type?: number, normalized?: boolean) => unknown;
    moveToBookmark: (bookmark: unknown) => void;
    getNode: () => HTMLElement;
    isCollapsed: () => boolean;
    getRng: () => Range;
    setRng: (range: Range) => void;
    setCursorLocation: (node?: Node, offset?: number) => void;
  };
  dom: {
    getStyle: (elm: HTMLElement, name: string, computed?: boolean) => string;
    rename: (elm: HTMLElement, name: string) => HTMLElement;
  };
  execCommand: (command: string, ui: boolean, value?: string) => void;
  windowManager: {
    open: (settings: Record<string, unknown>) => void;
  };
};

type TinyMceButtonControl = {
  getEl: () => HTMLElement | null;
};

const DEFAULT_FONT_SIZES = ['10', '12', '13', '14', '16', '18', '20', '24', '30', '36'];

const normalizeFontSize = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^(\d+(?:\.\d+)?)(px)?$/i.exec(trimmed);
  return match ? `${match[1]}px` : null;
};

const getNumericFontSize = (value: string) => {
  const match = /^\d+(\.\d+)?/.exec(value);
  return match ? match[0] : '';
};

const getCustomFontSizeSettings = (
  editor: TinyMceEditorInstance,
  onChange: (content: string) => void,
) => {
  return {
    type: 'button',
    text: '',
    icon: false,
    tooltip: __('Font size', 'kirki-ecommerce'),
    onPostRender(this: TinyMceButtonControl) {
      const container = this.getEl();
      if (!container) {
        return;
      }

      container.classList.add('kirki-ecommerce-rich-text-fontsize-control');
      container.innerHTML = '';

      const field = document.createElement('span');
      field.className = 'kirki-ecommerce-rich-text-fontsize-field';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'kirki-ecommerce-rich-text-fontsize-input';
      input.placeholder = __('Size', 'kirki-ecommerce');

      const unit = document.createElement('span');
      unit.className = 'kirki-ecommerce-rich-text-fontsize-unit';
      unit.textContent = 'px';

      field.appendChild(input);
      field.appendChild(unit);

      const panel = document.createElement('div');
      panel.className = 'kirki-ecommerce-rich-text-fontsize-options-panel';

      let bookmark: unknown = null;
      const captureBookmark = () => {
        bookmark = editor.selection.getBookmark(2, true);
      };

      const updateSelectedOption = () => {
        Array.from(panel.children).forEach((child) => {
          if (child instanceof HTMLElement) {
            child.classList.toggle('is-selected', child.dataset.size === input.value);
          }
        });
      };

      const applySize = (rawValue: string) => {
        const size = normalizeFontSize(rawValue);
        if (size) {
          editor.focus();
          if (bookmark) editor.selection.moveToBookmark(bookmark);
          if (!editor.selection.isCollapsed()) {
            editor.formatter.apply('fontsize', { value: size });
            onChange(editor.getContent());
          }
          input.value = getNumericFontSize(size);
          updateSelectedOption();
        }
        panel.classList.remove('is-open');
      };

      DEFAULT_FONT_SIZES.forEach((size) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.textContent = `${size}px`;
        option.dataset.size = size;
        option.addEventListener('mousedown', (event) => {
          event.preventDefault();
          applySize(size);
        });
        panel.appendChild(option);
      });

      input.addEventListener('mousedown', (event) => {
        event.stopPropagation();
        captureBookmark();
        panel.classList.toggle('is-open');
        updateSelectedOption();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          applySize(input.value);
        }
      });
      input.addEventListener('blur', () => {
        applySize(input.value);
      });

      editor.on('nodechange', () => {
        const currentSize = editor.dom.getStyle(editor.selection.getNode(), 'font-size', true);
        input.value = currentSize ? getNumericFontSize(currentSize) : '';
        updateSelectedOption();
      });

      const closeOnOutsideClick = (event: MouseEvent) => {
        if (event.target instanceof Node && !container.contains(event.target)) {
          panel.classList.remove('is-open');
        }
      };
      document.addEventListener('mousedown', closeOnOutsideClick);
      editor.on('mousedown', () => {
        panel.classList.remove('is-open');
      });
      editor.on('remove', () => {
        document.removeEventListener('mousedown', closeOnOutsideClick);
      });

      container.appendChild(field);
      container.appendChild(panel);
    },
  };
};

const renderShortcodeOptions = (
  panel: HTMLElement,
  items: Shortcode[],
  onSelect: (value: string) => void,
) => {
  panel.innerHTML = '';
  items.forEach((item) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.textContent = item.label;
    option.addEventListener('mousedown', (event) => {
      event.preventDefault();
      onSelect(item.value);
    });
    panel.appendChild(option);
  });
};

const getShortcodesButtonSettings = (
  editor: TinyMceEditorInstance,
  onChange: (content: string) => void,
  shortcodes: Shortcode[],
) => {
  return {
    type: 'button',
    icon: false,
    tooltip: __('Shortcodes', 'kirki-ecommerce'),
    onPostRender(this: TinyMceButtonControl) {
      const container = this.getEl();
      if (!container) {
        return;
      }

      container.classList.add('kirki-ecommerce-rich-text-shortcodes-control');
      container.innerHTML = '<span class="kirki-ecommerce-rich-text-shortcodes-icon">{/}</span>';

      const panel = document.createElement('div');
      panel.className = 'kirki-ecommerce-rich-text-shortcodes-options-panel';

      let bookmark: unknown = null;

      const insertShortcode = (value: string) => {
        editor.focus();
        if (bookmark) editor.selection.moveToBookmark(bookmark);
        editor.execCommand('mceInsertContent', false, value);
        onChange(editor.getContent());
        panel.classList.remove('is-open');
      };

      renderShortcodeOptions(panel, shortcodes, insertShortcode);

      container.addEventListener('mousedown', (event) => {
        if (event.target instanceof Node && panel.contains(event.target)) {
          return;
        }
        event.preventDefault();
        bookmark = editor.selection.getBookmark(2, true);
        panel.classList.toggle('is-open');
      });

      const closeOnOutsideClick = (event: MouseEvent) => {
        if (event.target instanceof Node && !container.contains(event.target)) {
          panel.classList.remove('is-open');
        }
      };
      document.addEventListener('mousedown', closeOnOutsideClick);
      editor.on('mousedown', () => {
        panel.classList.remove('is-open');
      });
      editor.on('remove', () => {
        document.removeEventListener('mousedown', closeOnOutsideClick);
      });

      container.appendChild(panel);
    },
  };
};

const setupTextColorSelectionFix = (editor: TinyMceEditorInstance) => {
  let lastBookmark: unknown = null;

  const captureBookmark = () => {
    if (!editor.selection.isCollapsed()) {
      lastBookmark = editor.selection.getBookmark(2, true);
    }
  };
  editor.on('mouseup keyup nodechange', captureBookmark);

  const restoreSelection = (event: MouseEvent) => {
    if (!lastBookmark) {
      return;
    }
    if (event.target instanceof Element && event.target.closest('[data-mce-color]')) {
      editor.focus();
      editor.selection.moveToBookmark(lastBookmark);
    }
  };
  document.addEventListener('mousedown', restoreSelection, true);

  editor.on('remove', () => {
    document.removeEventListener('mousedown', restoreSelection, true);
  });
};

const setupNewBlockRootElement = (editor: TinyMceEditorInstance, rootBlockElement: 'p' | 'div') => {
  editor.on('NewBlock', (event) => {
    const newBlock = event.newBlock;
    if (newBlock && newBlock.nodeName.toLowerCase() !== rootBlockElement) {
      const renamed = editor.dom.rename(newBlock, rootBlockElement);
      editor.selection.setCursorLocation(renamed, 0);
    }
  });
};

const setupShortcodeAutocomplete = (
  editor: TinyMceEditorInstance,
  onChange: (content: string) => void,
  shortcodes: Shortcode[],
) => {
  const panel = document.createElement('div');
  panel.className = 'kirki-ecommerce-rich-text-shortcodes-autocomplete-panel';
  editor.on('init', () => {
    editor.getContainer().appendChild(panel);
  });

  let activeMatchRange: Range | null = null;
  let visibleShortcodes: Shortcode[] = [];

  const closePanel = () => {
    panel.classList.remove('is-open');
    activeMatchRange = null;
    visibleShortcodes = [];
  };

  const highlightOption = (index: number) => {
    Array.from(panel.children).forEach((child, childIndex) => {
      child.classList.toggle('is-highlighted', childIndex === index);
    });
  };

  const acceptShortcode = (value: string) => {
    if (!activeMatchRange) {
      return;
    }
    editor.selection.setRng(activeMatchRange);
    editor.execCommand('mceInsertContent', false, value);
    onChange(editor.getContent());
    closePanel();
  };

  const positionPanel = (matchRange: Range) => {
    const rects = matchRange.getClientRects();
    const rect = rects[rects.length - 1];
    if (!rect) {
      return;
    }

    const frameRect = editor.iframeElement.getBoundingClientRect();
    const containerRect = editor.getContainer().getBoundingClientRect();
    const frameOffsetTop = frameRect.top - containerRect.top;
    const frameOffsetLeft = frameRect.left - containerRect.left;

    const caretTop = frameOffsetTop + rect.top;
    const caretBottom = frameOffsetTop + rect.bottom;
    const caretLeft = frameOffsetLeft + rect.right;

    const panelHeight = panel.offsetHeight;
    const panelWidth = panel.offsetWidth;

    const fitsBelow = caretBottom + panelHeight <= containerRect.height;
    panel.style.top = fitsBelow ? `${caretBottom + 20}px` : `${caretTop - panelHeight - 20}px`;

    const maxLeft = containerRect.width - panelWidth;
    panel.style.left = `${Math.max(0, Math.min(caretLeft, maxLeft)) + 20}px`;
  };

  editor.on('keyup', () => {
    const range = editor.selection.getRng();
    if (!range.collapsed || range.startContainer.nodeType !== Node.TEXT_NODE) {
      closePanel();
      return;
    }

    const textBeforeCursor = (range.startContainer.textContent ?? '').slice(0, range.startOffset);
    const openBraceIndex = textBeforeCursor.lastIndexOf('{');

    if (openBraceIndex === -1) {
      closePanel();
      return;
    }

    const query = textBeforeCursor.slice(openBraceIndex + 1);

    if (query.includes('}')) {
      closePanel();
      return;
    }

    const textAfterCursor = (range.startContainer.textContent ?? '').slice(range.startOffset);
    const nextCloseIndex = textAfterCursor.indexOf('}');
    const nextOpenIndex = textAfterCursor.indexOf('{');
    const isInsideClosedShortcode =
      nextCloseIndex !== -1 && (nextOpenIndex === -1 || nextCloseIndex < nextOpenIndex);

    if (isInsideClosedShortcode) {
      closePanel();
      return;
    }

    const lowerQuery = query.toLowerCase();
    visibleShortcodes = shortcodes.filter(
      ({ label, value }) =>
        label.toLowerCase().includes(lowerQuery) || value.toLowerCase().includes(lowerQuery),
    );

    if (visibleShortcodes.length === 0) {
      closePanel();
      return;
    }

    const matchRange = editor.getWin().document.createRange();
    matchRange.setStart(range.startContainer, openBraceIndex);
    matchRange.setEnd(range.startContainer, range.startOffset);
    activeMatchRange = matchRange;

    renderShortcodeOptions(panel, visibleShortcodes, acceptShortcode);
    highlightOption(0);
    panel.classList.add('is-open');
    positionPanel(matchRange);
  });

  editor.on('keydown', (event) => {
    if (!panel.classList.contains('is-open')) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closePanel();
    }
  });

  const closeOnOutsideClick = (event: MouseEvent) => {
    if (event.target instanceof Node && !panel.contains(event.target)) {
      closePanel();
    }
  };
  document.addEventListener('mousedown', closeOnOutsideClick);

  editor.on('remove', () => {
    document.removeEventListener('mousedown', closeOnOutsideClick);
    panel.remove();
  });
};

const RichText = ({
  id = 'my-wp-editor',
  value = '',
  onChange = noop,
  placeholder = __('Type something...', 'kirki-ecommerce'),
  label = false,
  helpText,
  error,
  css: cssProp,
  shortcodes = [],
  rootBlockElement = 'p',
}: RichTextProps) => {
  const editorRef = useRef<TinyMceEditorInstance | null>(null);
  const valueRef = useRef(value);

  const shortcodeOptions = useMemo(() => {
    return shortcodes.map(({ label, value }) => ({
      label,
      value,
    }));
  }, [shortcodes]);

  useEffect(() => {
    valueRef.current = value;

    const editor = editorRef.current;
    if (editor && editor.getContent() !== (value || '')) {
      editor.setContent(value || '');
    }
  }, [value]);

  useEffect(() => {
    if (!isDefined(window.tinymce) || !isDefined(window.wp) || !isDefined(window.wp.editor)) {
      console.warn('TinyMCE or wp.editor not found. Did you enqueue wp-tinymce and wp-editor?');
      return;
    }

    const existingEditor = window.tinymce.get(id);
    if (existingEditor) {
      existingEditor.remove();
    }

    window.tinymce.init({
      selector: `#${id}`,
      menubar: false,
      branding: false,
      height: 200,
      placeholder,
      forced_root_block: rootBlockElement,
      content_style: rootBlockElement === 'div' ? 'body > div { margin: 1em 0; }' : undefined,
      plugins: 'link lists paste textcolor',
      toolbar:
        'bold italic underline blockquote customfontsize forecolor alignleft aligncenter alignright alignjustify bullist numlist shortcodes undo redo',
      setup: (editor: TinyMceEditorInstance) => {
        editor.addButton('customfontsize', getCustomFontSizeSettings(editor, onChange));
        setupTextColorSelectionFix(editor);

        if (rootBlockElement !== 'p') {
          setupNewBlockRootElement(editor, rootBlockElement);
        }

        if (shortcodeOptions.length > 0) {
          editor.addButton(
            'shortcodes',
            getShortcodesButtonSettings(editor, onChange, shortcodeOptions),
          );
          setupShortcodeAutocomplete(editor, onChange, shortcodeOptions);
        }

        editor.on('init', () => {
          editor.setContent(valueRef.current || '');
          editorRef.current = editor;
        });

        editor.on('change keyup paste', () => {
          const content = editor.getContent();
          onChange(content);
        });
      },
    });

    return () => {
      const editorToRemove = window.tinymce?.get(id);
      if (editorToRemove) {
        editorToRemove.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinitializes when shortcodes or rootBlockElement changes so the toolbar button/autocomplete pick up fresh data and TinyMCE re-inits with the new root block config; value/placeholder/onChange are read through the live editor instance and intentionally excluded, since re-running on those would tear down in-progress content
  }, [id, shortcodeOptions, rootBlockElement]);

  return (
    <div css={scopedMerge(styles.root, cssProp)}>
      <Field data-invalid={error ? true : undefined} cssOverride={styles.controller}>
        {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
        <textarea
          id={id}
          defaultValue={value}
          placeholder={placeholder}
          style={{ width: '100%', minHeight: '200px' }}
          aria-invalid={Boolean(error) || undefined}
        />
        {helpText && !error && <FieldDescription>{helpText}</FieldDescription>}
        {typeof error === 'string' && <FieldError>{error}</FieldError>}
      </Field>
    </div>
  );
};

RichText.displayName = 'RichText';

export default RichText;

const styles = defineStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    columnGap: theme.spacing[4],
    width: '100%',
    '.mce-tinymce': {
      position: 'relative',
      border: `0.63px solid ${theme.colors.border.default}`,
      boxShadow: 'none',
      borderRadius: theme.radius.sm,
    },
    '.mce-statusbar': {
      display: 'none',
    },
    '.mce-top-part::before': {
      boxShadow: 'none',
    },
    '.kirki-ecommerce-rich-text-fontsize-control': {
      width: 'max-content',
      position: 'relative',
      marginTop: 0,
    },
    '.kirki-ecommerce-rich-text-fontsize-field': {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
    },
    '.kirki-ecommerce-rich-text-fontsize-input': {
      maxWidth: '48px',
      height: '24px',
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.radius.sm,
      padding: `${theme.spacing[0]} ${theme.spacing[1]}`,
      fontSize: '12px',
    },
    '.kirki-ecommerce-rich-text-fontsize-unit': {
      position: 'absolute',
      right: theme.spacing[1],
      top: '50%',
      transform: 'translateY(-50%)',
      fontSize: '12px',
      color: theme.colors.text.subdued,
      pointerEvents: 'none',
    },
    'kirki-ecommerce-rich-text-fontsize-input:placeholder': {
      fontSize: '8px',
    },
    '.kirki-ecommerce-rich-text-fontsize-input:placeholder-shown + .kirki-ecommerce-rich-text-fontsize-unit':
      {
        display: 'none',
      },
    '.kirki-ecommerce-rich-text-fontsize-options-panel': {
      display: 'none',
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1,
      flexDirection: 'column',
      maxHeight: '200px',
      overflowY: 'auto',
      background: theme.colors.background.surface,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.radius.sm,
      '&.is-open': {
        display: 'flex',
      },
      button: {
        border: 'none',
        borderBottom: `1px solid ${theme.colors.border.secondary}`,
        background: 'transparent',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
        cursor: 'pointer',
        fontSize: '12px',
        '&:hover': {
          background: theme.colors.border.default,
        },
        '&.is-selected': {
          background: theme.colors.background.fillSecondary,
        },
      },
    },
    '.kirki-ecommerce-rich-text-shortcodes-control': {
      position: 'relative',
    },
    '.kirki-ecommerce-rich-text-shortcodes-icon': {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontWeight: 700,
      lineHeight: 1.5,
    },
    '.kirki-ecommerce-rich-text-shortcodes-options-panel': {
      display: 'none',
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 1,
      flexDirection: 'column',
      maxHeight: '200px',
      minWidth: '160px',
      overflowY: 'auto',
      background: theme.colors.background.surface,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.radius.sm,
      '&.is-open': {
        display: 'flex',
      },
      button: {
        border: 'none',
        borderBottom: `1px solid ${theme.colors.border.secondary}`,
        background: 'transparent',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
        cursor: 'pointer',
        fontSize: '12px',
        '&:hover': {
          background: theme.colors.border.default,
        },
      },
    },
    '.kirki-ecommerce-rich-text-shortcodes-autocomplete-panel': {
      display: 'none',
      position: 'absolute',
      zIndex: 1000,
      flexDirection: 'column',
      maxHeight: '200px',
      minWidth: '160px',
      overflowY: 'auto',
      background: theme.colors.background.surface,
      border: `1px solid ${theme.colors.border.default}`,
      borderRadius: theme.radius.sm,
      '&.is-open': {
        display: 'flex',
      },
      button: {
        border: 'none',
        borderBottom: `1px solid ${theme.colors.border.secondary}`,
        background: 'transparent',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
        cursor: 'pointer',
        fontSize: '12px',
        '&:hover, &.is-highlighted': {
          background: theme.colors.border.default,
        },
      },
    },
  },
  controller: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    rowGap: theme.spacing[2],
    position: 'relative',
  },
});
