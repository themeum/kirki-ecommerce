<?php

namespace Kirki\Ecommerce\Tests\Unit;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Storefront markup uses the long Alpine attribute form (`x-on:`, `x-bind:`).
 *
 * `wp_kses()` drops any attribute name that starts with `@` or `:`, so the
 * shorthand breaks a view that prints inside a block theme header or footer.
 * See openspec/specs/alpine-attribute-standard.
 */
class AlpineAttributeConventionTest extends TestCase
{
    public function test_markup_uses_long_form_alpine_attributes(): void
    {
        $root = dirname(__DIR__, 2);
        $hits = [];

        foreach (['resources/views', 'app'] as $directory) {
            $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $directory, RecursiveDirectoryIterator::SKIP_DOTS));

            foreach ($files as $file) {
                if ($file->getExtension() !== 'php') {
                    continue;
                }

                foreach ($this->find_shorthand((string) file_get_contents($file->getPathname())) as $line => $token) {
                    $hits[] = substr($file->getPathname(), strlen($root) + 1) . ':' . $line . ' ' . $token;
                }
            }
        }

        $this->assertSame(
            [],
            $hits,
            "Use x-on:<event> and x-bind:<attribute> instead of the @ and : shorthand:\n" . implode("\n", $hits)
        );
    }

    public function test_shorthand_attributes_are_found(): void
    {
        $source = "<button\n    @click.outside=\"close()\"\n    :class=\"{ a: b }\">\n<a @kecom:cart-updated.document=\"x()\">";

        $this->assertSame([2 => '@click.outside', 3 => ':class', 4 => '@kecom:cart-updated.document'], $this->find_shorthand($source));
    }

    public function test_long_form_and_docblock_tags_are_not_flagged(): void
    {
        $source = "/**\n * @since 1.0.0\n * @param array \$a Value.\n */\n<button x-on:click=\"a()\" x-bind:class=\"b\" x-data=\"c\">";

        $this->assertSame([], $this->find_shorthand($source));
    }

    /**
     * Find shorthand Alpine attributes in markup.
     *
     * @param string $source File contents.
     * @return array<int, string> Attribute tokens by line number.
     */
    protected function find_shorthand(string $source): array
    {
        $found = [];

        foreach (explode("\n", $source) as $index => $line) {
            if (preg_match_all('/(?<![^\s])(@[a-z][\w:.\-]*|:[a-z][\w\-]*)=/', $line, $matches)) {
                $found[$index + 1] = implode(', ', $matches[1]);
            }
        }

        return $found;
    }
}
