<?php

namespace Kirki\Ecommerce\App\Rules;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Validation\ValidationRule;

/**
 * Validates that an attachment ID points at an attachment of an accepted type.
 *
 * Each accepted type is either a bare type (`image`, matching `image/*`) or a
 * full MIME type (`application/pdf`, matching exactly).
 *
 * @since 1.0.0
 */
class AttachmentRule extends ValidationRule
{
    /**
     * The rule name.
     *
     * @var string
     */
    protected string $rule = 'attachment';

    /**
     * Create a rule that accepts the given attachment types.
     *
     * @since 1.0.0
     *
     * @param string[] $types Accepted types, bare (`image`) or full MIME (`application/pdf`).
     *
     * @return static
     */
    public static function of(array $types)
    {
        return new static($types);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function validate(): bool
    {
        $mime_type = $this->attachment_mime_type((int) $this->value);

        if ($mime_type === null) {
            return $this->fails(__('The selected file does not exist.', 'kirki-ecommerce'));
        }

        foreach ((array) $this->args as $type) {
            if ($this->matches($mime_type, (string) $type)) {
                return true;
            }
        }

        return $this->fails(__('The selected file must be of type: {args}.', 'kirki-ecommerce'));
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function messages()
    {
        return $this->process_messages($this->messages);
    }

    /**
     * Get the MIME type of an attachment.
     *
     * @since 1.0.0
     *
     * @param int $attachment_id The attachment ID.
     *
     * @return string|null Null when the ID is not an attachment.
     */
    protected function attachment_mime_type(int $attachment_id)
    {
        if ($attachment_id < 1 || get_post_type($attachment_id) !== 'attachment') {
            return null;
        }

        return (string) get_post_mime_type($attachment_id);
    }

    /**
     * Check a MIME type against an accepted type.
     *
     * @since 1.0.0
     *
     * @param string $mime_type The attachment MIME type.
     * @param string $type      The accepted type.
     *
     * @return bool
     */
    protected function matches(string $mime_type, string $type): bool
    {
        if (strpos($type, '/') === false) {
            return strpos($mime_type, $type . '/') === 0;
        }

        return $mime_type === $type;
    }
}
