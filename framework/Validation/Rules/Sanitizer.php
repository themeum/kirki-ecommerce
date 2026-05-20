<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Rule to ensure the minium value.
 *
 * @since 1.0.0
 */
class Sanitizer extends BaseRule
{
    /**
     * Check if the value is valid.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $this->sanitize_data();
        return true;
    }

    /**
     * Get the error message if the value is less than the min value.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The %s field must be sanitized.', 'kirki-ecommerce'), $this->last_key_segment());
    }

    /**
     * Sanitize the data.
     *
     * @return void
     */
    public function sanitize_data()
    {
        switch ($this->rule_value) {
            case 'trim':
                $this->value = trim($this->value);
                break;
            case 'text':
                $this->value = sanitize_text_field($this->value);
                break;
            case 'textarea':
                $this->value = sanitize_textarea_field($this->value);
                break;
            case 'email':
                $this->value = sanitize_email($this->value);
                break;
            case 'url':
                $this->value = sanitize_url($this->value);
                break;
            case 'key':
                $this->value = sanitize_key($this->value);
                break;
            case 'title':
                $this->value = sanitize_title($this->value);
            case 'file-name':
                $this->value = sanitize_file_name($this->value);
                break;
            case 'mime-type':
                $this->value = sanitize_mime_type($this->value);
                break;
        }
    }
}
