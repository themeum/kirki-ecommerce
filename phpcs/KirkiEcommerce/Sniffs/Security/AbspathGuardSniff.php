<?php

namespace KirkiEcommerce\Sniffs\Security;

use PHP_CodeSniffer\Files\File;
use PHP_CodeSniffer\Sniffs\Sniff;
use PHP_CodeSniffer\Util\Tokens;

/**
 * Requires the direct-access guard `defined('ABSPATH') || exit;` before any executable code.
 *
 * Only `namespace`, `declare` and `use` statements may come before the guard.
 *
 * @since 1.0.0
 */
class AbspathGuardSniff implements Sniff
{
    /**
     * The guard statement, with whitespace and comments removed.
     *
     * @since 1.0.0
     */
    const GUARD = "defined('ABSPATH')||exit;";

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function register()
    {
        return [T_OPEN_TAG];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function process(File $phpcs_file, $stack_ptr)
    {
        if ($phpcs_file->findPrevious(T_OPEN_TAG, $stack_ptr - 1) !== false) {
            return;
        }

        $tokens = $phpcs_file->getTokens();
        $skips = array_merge(Tokens::$emptyTokens, [T_OPEN_TAG]);

        for ($i = $stack_ptr + 1; $i < count($tokens); $i++) {
            $code = $tokens[$i]['code'];

            if (in_array($code, $skips, true)) {
                continue;
            }

            if (in_array($code, [T_NAMESPACE, T_DECLARE, T_USE], true)) {
                $semicolon = $phpcs_file->findNext(T_SEMICOLON, $i);

                if ($semicolon === false) {
                    break;
                }

                $i = $semicolon;
                continue;
            }

            if ($this->is_guard($phpcs_file, $i)) {
                return;
            }

            break;
        }

        $phpcs_file->addError(
            'Missing direct-access guard. Add `defined(\'ABSPATH\') || exit;` before any executable code.',
            $stack_ptr,
            'Missing'
        );
    }

    /**
     * Tell whether the statement at a position is the guard.
     *
     * @since 1.0.0
     *
     * @param File $phpcs_file File being checked.
     * @param int  $stack_ptr  Position of the first token of the statement.
     * @return bool
     */
    protected function is_guard(File $phpcs_file, $stack_ptr)
    {
        $tokens = $phpcs_file->getTokens();
        $statement = '';

        for ($i = $stack_ptr; $i < count($tokens); $i++) {
            if (in_array($tokens[$i]['code'], Tokens::$emptyTokens, true)) {
                continue;
            }

            $statement .= $tokens[$i]['content'];

            if ($tokens[$i]['code'] === T_SEMICOLON) {
                break;
            }
        }

        return $statement === self::GUARD;
    }
}
