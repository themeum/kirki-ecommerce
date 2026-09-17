import { type SerializedStyles } from '@emotion/react';
import { useEffect, useRef } from 'react';

import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { noop } from '@/utils/function';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

type RichTextProps = {
  id?: string;
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  label?: string | false;
  helpText?: string;
  error?: string | boolean;
  css?: SerializedStyles;
};

type TinyMceEditorInstance = {
  on: (event: string, callback: () => void) => void;
  setContent: (content: string) => void;
  getContent: () => string;
  remove: () => void;
  addButton: (name: string, settings: Record<string, unknown>) => void;
  focus: () => void;
  formatter: {
    apply: (name: string, vars?: Record<string, unknown>) => void;
  };
  selection: {
    getBookmark: (type?: number, normalized?: boolean) => unknown;
    moveToBookmark: (bookmark: unknown) => void;
    getNode: () => HTMLElement;
    isCollapsed: () => boolean;
  };
  dom: {
    getStyle: (elm: HTMLElement, name: string, computed?: boolean) => string;
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
      input.title = __('Font size', 'kirki-ecommerce');
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

const RichText = ({
  id = 'my-wp-editor',
  value = '',
  onChange = noop,
  placeholder = __('Type something...', 'kirki-ecommerce'),
  label = false,
  helpText,
  error,
  css: cssProp,
}: RichTextProps) => {
  const editorRef = useRef<TinyMceEditorInstance | null>(null);
  const valueRef = useRef(value);

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
      plugins: 'link lists paste textcolor',
      toolbar:
        'bold italic underline blockquote customfontsize forecolor alignleft aligncenter alignright alignjustify bullist numlist undo redo',
      setup: (editor: TinyMceEditorInstance) => {
        editor.addButton('customfontsize', getCustomFontSizeSettings(editor, onChange));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialises the editor once per id; value/placeholder/onChange are read through the live editor instance, and re-running would tear down in-progress content
  }, [id]);

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
      border: `0.63px solid ${theme.colors.border.default}`,
      boxShadow: 'none',
      borderRadius: theme.radius.sm,
      overflow: 'hidden',
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
