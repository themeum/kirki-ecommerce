import { useEffect, useRef } from 'react';

import Label from '@/molecules/label';
import { CLASS_PREFIX } from '@/conf';
import { __ } from '@/wpi18n';

/**
 * Must ensure these are enqueued in PHP:
 * wp_enqueue_script('wp-tinymce');
 * wp_enqueue_editor();
 *
 */
type CustomRichTextProps = {
  id?: string;
  value?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  label?: string | false;
  helpText?: string;
  error?: string | boolean;
};

type TinyMceEditorInstance = {
  on: (event: string, callback: () => void) => void;
  setContent: (content: string) => void;
  getContent: () => string;
  remove: () => void;
};

const CustomRichText = ({
  id = 'my-wp-editor',
  value = '',
  onChange = () => {},
  placeholder = __('Type something...', 'kirki-ecommerce'),
  className = '',
  label = false,
  helpText,
  error,
}: CustomRichTextProps) => {
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
    <div
      className={`${CLASS_PREFIX}-richtext ${CLASS_PREFIX}-input-wrapper ${className}`}
    >
      <div className={`${CLASS_PREFIX}-input-controller`}>
        {label && (
          <Label
            text={label}
            type={error ? 'error' : ''}
            helpText={error ? error : helpText}
          />
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

export default CustomRichText;
