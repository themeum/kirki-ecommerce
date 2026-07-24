import { type SerializedStyles } from '@emotion/react';
import { useEffect, useRef } from 'react';

import Label from '@/components/ui/label';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
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
};

const RichText = ({
  id = 'my-wp-editor',
  value = '',
  onChange = () => {},
  placeholder = __('Type something...', 'kirki-ecommerce'),
  label = false,
  helpText,
  error,
  css: cssProp,
}: RichTextProps) => {
  const editorRef = useRef<TinyMceEditorInstance | null>(null);

  useEffect(() => {
    if (!window.tinymce || !window.wp?.editor) {
      console.warn(
        'TinyMCE or wp.editor not found. Did you enqueue wp-tinymce and wp-editor?',
      );
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
      plugins: 'link lists paste',
      toolbar:
        'bold italic underline blockquote fontselect fontsizeselect alignleft aligncenter alignright alignjustify bullist numlist shortcode_button wp_more wp_adv undo redo',
      setup: (editor: TinyMceEditorInstance) => {
        editor.on('init', () => {
          editor.setContent(value || '');
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
  }, [id]);

  return (
    <div css={[styles.root, cssProp]}>
      <div css={styles.controller}>
        {label && (
          <Label error={Boolean(error)} helpText={error ? error : helpText}>
            {label}
          </Label>
        )}
        <textarea
          id={id}
          defaultValue={value}
          placeholder={placeholder}
          style={{ width: '100%', minHeight: '200px' }}
        />
      </div>
    </div>
  );
};

RichText.displayName = 'RichText';

export default RichText;

const styles = {
  root: scoped({
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
  }),
  controller: scoped({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    rowGap: theme.spacing[2],
    position: 'relative',
  }),
};
