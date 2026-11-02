<?php

namespace KirkiEcommerce\Sniffs\Commenting;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Requires the docblock structure defined by the php-docblock-standard spec.
 *
 * @since 1.0.0
 */
class RequiredDocblockSniff implements Sniff
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        return [T_CLASS, T_INTERFACE, T_TRAIT, T_FUNCTION, T_VARIABLE];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function process(File $phpcs_file, $stack_ptr)
    {
        $tokens = $phpcs_file->getTokens();

        if ($tokens[$stack_ptr]['code'] === T_VARIABLE) {
            $this->process_property($phpcs_file, $stack_ptr);
            return;
        }

        if ($tokens[$stack_ptr]['code'] === T_FUNCTION) {
            $this->process_function($phpcs_file, $stack_ptr);
            return;
        }

        $this->process_class_like($phpcs_file, $stack_ptr);
    }

    /**
     * Check a class, interface or trait docblock.
     *
     * @since 1.0.0
     *
     * @param File $phpcs_file File being checked.
     * @param int  $stack_ptr  Position of the declaration keyword.
     * @return void
     */
    protected function process_class_like(File $phpcs_file, $stack_ptr)
    {
        $tokens = $phpcs_file->getTokens();
        $label = $tokens[$stack_ptr]['content'] . ' ' . $phpcs_file->getDeclarationName($stack_ptr);
        $opener = $this->find_docblock($phpcs_file, $stack_ptr, []);

        if ($opener === null) {
            $phpcs_file->addError('Missing docblock for %s.', $stack_ptr, 'MissingDocblock', [$label]);
            return;
        }

        $this->check_callable_docblock($phpcs_file, $stack_ptr, $opener, $label);
    }

    /**
     * Check a method or function docblock.
     *
     * @since 1.0.0
     *
     * @param File $phpcs_file File being checked.
     * @param int  $stack_ptr  Position of the function keyword.
     * @return void
     */
    protected function process_function(File $phpcs_file, $stack_ptr)
    {
        $name = $phpcs_file->getDeclarationName($stack_ptr);

        if ($name === null) {
            return;
        }

        $label = 'function ' . $name;
        $opener = $this->find_docblock($phpcs_file, $stack_ptr, []);

        if ($opener === null) {
            $phpcs_file->addError('Missing docblock for %s.', $stack_ptr, 'MissingDocblock', [$label]);
            return;
        }

        $details = $this->check_callable_docblock($phpcs_file, $stack_ptr, $opener, $label);

        if ($details['inherits']) {
            return;
        }

        $param_count = count($phpcs_file->getMethodParameters($stack_ptr));

        if ($details['counts']['@param'] !== $param_count) {
            $phpcs_file->addError(
                'Docblock for %s has %d @param tag(s) but the signature has %d parameter(s).',
                $stack_ptr,
                'ParamCount',
                [$label, $details['counts']['@param'], $param_count]
            );
        }

        $is_lifecycle = in_array(strtolower($name), ['__construct', '__destruct'], true);

        if (!$is_lifecycle && $details['counts']['@return'] === 0) {
            $phpcs_file->addError('Docblock for %s is missing @return.', $stack_ptr, 'MissingReturn', [$label]);
        }
    }

    /**
     * Check a property docblock.
     *
     * @since 1.0.0
     *
     * @param File $phpcs_file File being checked.
     * @param int  $stack_ptr  Position of the property variable.
     * @return void
     */
    protected function process_property(File $phpcs_file, $stack_ptr)
    {
        $tokens = $phpcs_file->getTokens();

        if (isset($tokens[$stack_ptr]['nested_parenthesis'])) {
            return;
        }

        $conditions = $tokens[$stack_ptr]['conditions'];
        $owner = end($conditions);

        if ($owner === false || !in_array($owner, [T_CLASS, T_TRAIT, T_ANON_CLASS], true)) {
            return;
        }

        $previous = $phpcs_file->findPrevious(Tokens::$emptyTokens, $stack_ptr - 1, null, true);

        if ($previous !== false && $tokens[$previous]['code'] === T_COMMA) {
            return;
        }

        $label = 'property ' . $tokens[$stack_ptr]['content'];
        $opener = $this->find_docblock($phpcs_file, $stack_ptr, $this->type_tokens());

        if ($opener === null) {
            $phpcs_file->addError('Missing docblock for %s.', $stack_ptr, 'MissingDocblock', [$label]);
            return;
        }

        $details = $this->describe($phpcs_file, $opener);

        if ($details['counts']['@since'] > 0) {
            $phpcs_file->addError('Docblock for %s must not have @since.', $opener, 'PropertySince', [$label]);
        }

        if (!$details['inherits'] && $details['counts']['@var'] === 0) {
            $phpcs_file->addError('Docblock for %s is missing @var.', $opener, 'MissingVar', [$label]);
        }
    }

    /**
     * Check the tags a class-like or callable docblock shares: summary, @since and tag order.
     *
     * @since 1.0.0
     *
     * @param File   $phpcs_file File being checked.
     * @param int    $stack_ptr  Position of the declaration.
     * @param int    $opener     Position of the docblock opening tag.
     * @param string $label      Human-readable name of the declaration.
     * @return array<string, mixed> The described docblock.
     */
    protected function check_callable_docblock(File $phpcs_file, $stack_ptr, $opener, $label)
    {
        $details = $this->describe($phpcs_file, $opener);

        if ($details['counts']['@since'] === 0) {
            $phpcs_file->addError('Docblock for %s is missing @since.', $opener, 'MissingSince', [$label]);
        }

        if (!$details['inherits'] && !$details['has_summary']) {
            $phpcs_file->addError('Docblock for %s is missing a summary line.', $opener, 'MissingSummary', [$label]);
        }

        if (!$this->tags_are_ordered($details['sequence'])) {
            $phpcs_file->addError(
                'Docblock for %s must order tags @since, @param, @return, @throws.',
                $opener,
                'TagOrder',
                [$label]
            );
        }

        return $details;
    }

    /**
     * Summarise a docblock's summary, tag counts and tag order.
     *
     * @since 1.0.0
     *
     * @param File $phpcs_file File being checked.
     * @param int  $opener     Position of the docblock opening tag.
     * @return array<string, mixed> Keys: has_summary, inherits, counts, sequence.
     */
    protected function describe(File $phpcs_file, $opener)
    {
        $tokens = $phpcs_file->getTokens();
        $closer = $tokens[$opener]['comment_closer'];
        $tag_ptrs = $tokens[$opener]['comment_tags'];
        $counts = ['@since' => 0, '@param' => 0, '@return' => 0, '@throws' => 0, '@var' => 0];
        $sequence = [];

        foreach ($tag_ptrs as $tag_ptr) {
            $name = strtolower($tokens[$tag_ptr]['content']);

            if (isset($counts[$name])) {
                $counts[$name]++;
                $sequence[] = $name;
            }
        }

        $summary_end = $tag_ptrs ? $tag_ptrs[0] : $closer;
        $has_summary = false;

        for ($i = $opener + 1; $i < $summary_end; $i++) {
            if ($tokens[$i]['code'] === T_DOC_COMMENT_STRING) {
                $has_summary = true;
                break;
            }
        }

        $text = $phpcs_file->getTokensAsString($opener, $closer - $opener + 1);

        return [
            'has_summary' => $has_summary,
            'inherits' => stripos($text, '@inheritdoc') !== false,
            'counts' => $counts,
            'sequence' => $sequence,
        ];
    }

    /**
     * Tell whether tags appear in the required order.
     *
     * @since 1.0.0
     *
     * @param string[] $sequence Tag names in document order.
     * @return bool
     */
    protected function tags_are_ordered(array $sequence)
    {
        $rank = ['@since' => 1, '@param' => 2, '@return' => 3, '@throws' => 4];
        $highest = 0;

        foreach ($sequence as $name) {
            if (!isset($rank[$name])) {
                continue;
            }

            if ($rank[$name] < $highest) {
                return false;
            }

            $highest = $rank[$name];
        }

        return true;
    }

    /**
     * Find the docblock attached to a declaration.
     *
     * @since 1.0.0
     *
     * @param File  $phpcs_file  File being checked.
     * @param int   $stack_ptr   Position of the declaration.
     * @param int[] $extra_skips Extra token types allowed between the docblock and the declaration.
     * @return int|null Position of the docblock opening tag, or null when there is none.
     */
    protected function find_docblock(File $phpcs_file, $stack_ptr, array $extra_skips)
    {
        $tokens = $phpcs_file->getTokens();
        $skips = array_merge(
            [
                T_WHITESPACE,
                T_COMMENT,
                T_PHPCS_IGNORE,
                T_PHPCS_ENABLE,
                T_PHPCS_DISABLE,
                T_PHPCS_SET,
                T_STATIC,
                T_ABSTRACT,
                T_FINAL,
                T_VAR,
            ],
            Tokens::$scopeModifiers,
            $extra_skips
        );

        for ($i = $stack_ptr - 1; $i >= 0; $i--) {
            $code = $tokens[$i]['code'];

            if ($code === T_DOC_COMMENT_CLOSE_TAG) {
                return $tokens[$i]['comment_opener'];
            }

            if (!in_array($code, $skips, true)) {
                return null;
            }
        }

        return null;
    }

    /**
     * Token types that can sit between a property's modifiers and its variable.
     *
     * @since 1.0.0
     *
     * @return int[]
     */
    protected function type_tokens()
    {
        return [T_STRING, T_NS_SEPARATOR, T_NULLABLE, T_ARRAY, T_CALLABLE, T_SELF, T_PARENT];
    }
}
