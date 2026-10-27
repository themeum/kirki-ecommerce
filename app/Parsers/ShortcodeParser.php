<?php

namespace Kirki\Ecommerce\App\Parsers;

defined('ABSPATH') || exit;

use InvalidArgumentException;
use Kirki\Ecommerce\App\Contracts\Parsable;

/**
 * Replaces `{tag}` placeholders in a string with values from a variables map.
 *
 * @since 1.0.0
 */
class ShortcodeParser implements Parsable
{
    /**
     * Replacement values keyed by placeholder tag.
     *
     * @var array<string, mixed>
     */
    protected $variables = [];
    /**
     * Regular expression whose first capture group is the tag name of a placeholder.
     *
     * @var string
     */
    protected $pattern = '/\{([a-zA-Z0-9_]+)\}/';

    /**
     * Create a new parser instance.
     *
     * @since 1.0.0
     *
     * @return static
     */
    public static function create()
    {
        return new static();
    }

    /**
     * Set the variables the placeholders are replaced with.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $variables Replacement values keyed by placeholder tag.
     * @return static
     */
    public function with(array $variables)
    {
        $this->variables = $variables;

        return $this;
    }

    /**
     * Override the regular expression used to find placeholders.
     *
     * @since 1.0.0
     *
     * @param string $pattern Regular expression whose first capture group is the tag name.
     * @return static
     */
    public function pattern(string $pattern)
    {
        $this->pattern = $pattern;

        return $this;
    }

    /**
     * Replace each placeholder in the content that has a matching variable.
     *
     * Placeholders without a matching variable are left untouched.
     *
     * @since 1.0.0
     *
     * @param string $content Content containing placeholders.
     * @return string Content with known placeholders replaced.
     * @throws InvalidArgumentException When the placeholder pattern is empty.
     */
    public function parse(string $content)
    {
        if (empty($this->pattern)) {
            throw new InvalidArgumentException(esc_html__('The parser pattern is required.', 'kirki-ecommerce'));
        }

        if (empty($this->variables)) {
            return $content;
        }

        return preg_replace_callback($this->pattern, function ($matches) {
            $tag = $matches[1];

            if (isset($this->variables[$tag])) {
                return $this->variables[$tag];
            }

            return $matches[0];
        }, $content);
    }
}
