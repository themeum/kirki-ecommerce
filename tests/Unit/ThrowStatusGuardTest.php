<?php

namespace Kirki\Ecommerce\Tests\Unit;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Fails when a request-layer failure is thrown without an explicit HTTP status.
 *
 * `throw_if()`, `throw_unless()` and `throw_anyway()` build the exception from the class and
 * arguments they are given. With no class the exception is a plain `Exception` with code 0, which
 * the REST handler answers with HTTP 500. A class the handler does not map (for example
 * `NotFoundException`) needs a status code too. Failures the user cannot fix may stay at 500,
 * but they must be listed in {@see static::SERVER_FAULTS} so a reviewer has chosen that.
 */
class ThrowStatusGuardTest extends TestCase
{
    /**
     * Folders that handle requests, relative to the plugin root.
     */
    protected const SCOPE = ['app/Actions', 'app/Services', 'app/Concerns', 'app/Http'];

    /**
     * Classes the API handler maps to a status by type, so they need no status code argument.
     */
    protected const SELF_MAPPING = ['ValidationException', 'ModelNotFoundException', 'ThrottleRequestsException'];

    /**
     * Calls that stay at HTTP 500 on purpose: file => [number of calls, reason].
     */
    protected const SERVER_FAULTS = [
        'app/Actions/Collection/CreateCollectionAction.php' => [1, 'The database write returned nothing.'],
        'app/Actions/Collection/UpdateCollectionAction.php' => [1, 'The database write returned nothing.'],
        'app/Actions/Coupon/CreateCouponAction.php' => [1, 'The database write returned nothing.'],
        'app/Actions/Coupon/UpdateCouponAction.php' => [1, 'The database write returned nothing.'],
        'app/Actions/Customer/CreateCustomerAction.php' => [4, 'Database writes returned nothing, or WordPress failed to insert the user after the request passed validation.'],
        'app/Actions/Customer/UpdateCustomerAction.php' => [1, 'The database write returned nothing.'],
        'app/Actions/Product/CreateProductAction.php' => [2, 'The database write returned nothing.'],
        'app/Actions/Product/UpdateProductAction.php' => [2, 'The database write returned nothing.'],
        'app/Concerns/PersistsOrderCoupons.php' => [3, 'Order totals do not match their coupon lines: a calculation bug, not user input.'],
        'app/Concerns/PersistsOrderTaxes.php' => [1, 'Order totals do not match their tax lines: a calculation bug, not user input.'],
        'app/Services/UserService.php' => [5, 'WordPress update or mail failures. The verification-email checks are answered with 422 by AccountController, which catches every Exception.'],
    ];

    public function test_every_request_layer_failure_has_an_explicit_status(): void
    {
        $unlisted = [];
        $counts = [];

        foreach ($this->php_files() as $relative => $path) {
            foreach ($this->calls_without_status(file_get_contents($path)) as $line) {
                $counts[$relative][] = $line;
            }
        }

        foreach ($counts as $relative => $lines) {
            $allowed = static::SERVER_FAULTS[$relative][0] ?? 0;

            if (count($lines) > $allowed) {
                $unlisted[] = $relative . ' (line ' . implode(', ', $lines) . ')';
            }
        }

        $this->assertSame(
            [],
            $unlisted,
            "These calls throw without an HTTP status, so they answer 500.\n"
            . "Pass ValidationException::class, Response::UNPROCESSABLE_ENTITY (or another class and 4xx status),\n"
            . "or list the file in SERVER_FAULTS with a reason if it is a server fault:\n"
        );
    }

    public function test_server_fault_list_has_no_stale_entries(): void
    {
        foreach (static::SERVER_FAULTS as $relative => [$expected]) {
            $path = $this->root() . '/' . $relative;

            $this->assertFileExists($path, $relative . ' is in SERVER_FAULTS but no longer exists.');
            $this->assertCount($expected, $this->calls_without_status(file_get_contents($path)), $relative . ' no longer has the listed number of calls without a status.');
        }
    }

    /**
     * Find calls that leave the HTTP status to the 500 fallback.
     *
     * @param string $source PHP source.
     * @return int[] Line numbers of the calls.
     */
    protected function calls_without_status(string $source): array
    {
        $tokens = token_get_all($source);
        $lines = [];

        foreach ($tokens as $index => $token) {
            if (!is_array($token) || $token[0] !== T_STRING || !in_array($token[1], ['throw_if', 'throw_unless', 'throw_anyway'], true)) {
                continue;
            }

            if ($this->previous_significant($tokens, $index) === T_FUNCTION || $this->previous_significant($tokens, $index) === T_CONST) {
                continue;
            }

            if (($tokens[$this->next_significant_index($tokens, $index)] ?? null) !== '(') {
                continue;
            }

            $arguments = $this->arguments($tokens, $this->next_significant_index($tokens, $index));
            $first_extra = $token[1] === 'throw_anyway' ? 1 : 2;
            $class = $arguments[$first_extra] ?? null;
            $code = $arguments[$first_extra + 1] ?? null;

            if ($class !== null && $this->is_self_mapping($class)) {
                continue;
            }

            if ($class !== null && $code !== null) {
                continue;
            }

            $lines[] = $token[2];
        }

        return $lines;
    }

    /**
     * Split a call into its top-level arguments, as source text.
     *
     * @param array $tokens Source tokens.
     * @param int   $open   Index of the opening parenthesis.
     * @return string[]
     */
    protected function arguments(array $tokens, int $open): array
    {
        $depth = 0;
        $arguments = [];
        $current = '';

        for ($i = $open, $count = count($tokens); $i < $count; $i++) {
            $text = is_array($tokens[$i]) ? $tokens[$i][1] : $tokens[$i];

            if (in_array($text, ['(', '[', '{'], true)) {
                $depth++;

                if ($depth === 1) {
                    continue;
                }
            } elseif (in_array($text, [')', ']', '}'], true)) {
                $depth--;

                if ($depth === 0) {
                    if (trim($current) !== '') {
                        $arguments[] = trim($current);
                    }

                    break;
                }
            } elseif ($text === ',' && $depth === 1) {
                $arguments[] = trim($current);
                $current = '';

                continue;
            }

            $current .= $text;
        }

        return $arguments;
    }

    protected function is_self_mapping(string $class_argument): bool
    {
        foreach (static::SELF_MAPPING as $class) {
            if (preg_match('/(^|\\\\)' . $class . '::class$/', $class_argument)) {
                return true;
            }
        }

        return false;
    }

    protected function previous_significant(array $tokens, int $index)
    {
        for ($i = $index - 1; $i >= 0; $i--) {
            if (is_array($tokens[$i]) && in_array($tokens[$i][0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }

            return is_array($tokens[$i]) ? $tokens[$i][0] : $tokens[$i];
        }

        return null;
    }

    protected function next_significant_index(array $tokens, int $index): int
    {
        for ($i = $index + 1, $count = count($tokens); $i < $count; $i++) {
            if (is_array($tokens[$i]) && in_array($tokens[$i][0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)) {
                continue;
            }

            return $i;
        }

        return $index;
    }

    /**
     * List the PHP files in scope.
     *
     * @return array<string, string> Relative path => absolute path.
     */
    protected function php_files(): array
    {
        $files = [];

        foreach (static::SCOPE as $folder) {
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($this->root() . '/' . $folder, RecursiveDirectoryIterator::SKIP_DOTS));

            foreach ($iterator as $file) {
                if ($file->getExtension() === 'php') {
                    $files[substr($file->getPathname(), strlen($this->root()) + 1)] = $file->getPathname();
                }
            }
        }

        ksort($files);

        return $files;
    }

    protected function root(): string
    {
        return dirname(__DIR__, 2);
    }
}
