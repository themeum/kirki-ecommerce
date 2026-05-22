import React, { useEffect, useRef } from "react";
import Label from "../Label";
import { CLASS_PREFIX } from "@/conf";
import { __ } from "@/wpi18n";

/**
 * Must ensure these are enqueued in PHP:
 * wp_enqueue_script('wp-tinymce');
 * wp_enqueue_editor();
 *
 */
const CustomRichText = ({
  id = "my-wp-editor",
  value = "",
  onChange = () => {},
  placeholder = __("Type something...", "kirki-ecommerce"),
  className = "",
  label = false,
  helpText,
  error,
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    // Wait until TinyMCE is loaded globally
    if (!window.tinymce || !window.wp?.editor) {
      console.warn(
        "TinyMCE or wp.editor not found. Did you enqueue wp-tinymce and wp-editor?",
      );
      return;
    }

    // Remove old instance if any
    if (window.tinymce.get(id)) {
      window.tinymce.get(id).remove();
    }

    // Create new editor instance
    window.tinymce.init({
      selector: `#${id}`,
      menubar: false,
      branding: false,
      height: 200,
      placeholder,
      plugins: "link lists paste",
      toolbar:
        "bold italic underline blockquote fontselect fontsizeselect alignleft aligncenter alignright alignjustify bullist numlist shortcode_button wp_more wp_adv undo redo",
      setup: (editor) => {
        editor.on("init", () => {
          editor.setContent(value || "");
          editorRef.current = editor;
        });

        editor.on("change keyup paste", () => {
          const content = editor.getContent();
          onChange(content);
        });
      },
    });

    // Cleanup
    return () => {
      if (window.tinymce.get(id)) {
        window.tinymce.get(id).remove();
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
            type={error ? "error" : ""}
            helpText={error ? error : helpText}
          />
        )}
        <textarea
          id={id}
          defaultValue={value}
          placeholder={placeholder}
          style={{ width: "100%", minHeight: "200px" }}
        />
      </div>
    </div>
  );
};

export default CustomRichText;
