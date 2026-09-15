<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\Services\LegalConsentService;
use Kirki\Ecommerce\App\Services\PageService;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class LegalConsentServiceTest extends TestCase
{
    protected function make_service(array $pages_by_slug = []): LegalConsentService
    {
        return new class ($pages_by_slug) extends LegalConsentService {
            /**
             * @var array<string, object>
             */
            protected $stub_pages;

            /**
             * @var int
             */
            public $resolve_calls = 0;

            public function __construct(array $stub_pages)
            {
                parent::__construct(new PageService());

                $this->stub_pages = $stub_pages;
            }

            protected function resolve_pages(array $slugs)
            {
                if (empty($slugs)) {
                    return [];
                }

                $this->resolve_calls++;

                $resolved = [];

                foreach ($slugs as $slug) {
                    if (isset($this->stub_pages[$slug])) {
                        $resolved[$slug] = $this->stub_pages[$slug];
                    }
                }

                return $resolved;
            }
        };
    }

    protected function make_page(int $id, string $slug, string $title): object
    {
        return (object) [
            'ID' => $id,
            'post_name' => $slug,
            'post_title' => $title,
        ];
    }

    public function test_token_renders_as_a_link_to_the_page(): void
    {
        $service = $this->make_service([
            'privacy-policy' => $this->make_page(12, 'privacy-policy', 'Privacy Policy'),
        ]);

        $html = $service->render_message('You agree to our {privacy_policy}.');

        $this->assertStringContainsString('<a href="https://example.test/?p=12"', $html);
        $this->assertStringContainsString('>Privacy Policy</a>', $html);
        $this->assertStringNotContainsString('{privacy_policy}', $html);
    }

    public function test_unresolved_token_renders_as_readable_text(): void
    {
        $service = $this->make_service();

        $html = $service->render_message('You agree to our {privacy_policy}.');

        $this->assertStringContainsString('Privacy Policy', $html);
        $this->assertStringNotContainsString('{privacy_policy}', $html);
        $this->assertStringNotContainsString('<a', $html);
    }

    public function test_merchant_markup_is_escaped(): void
    {
        $service = $this->make_service();

        $html = $service->render_message('<script>alert(1)</script> and <b>bold</b>');

        $this->assertStringNotContainsString('<script>', $html);
        $this->assertStringNotContainsString('<b>', $html);
        $this->assertStringContainsString('&lt;script&gt;', $html);
    }

    public function test_markup_typed_around_a_token_stays_escaped(): void
    {
        $service = $this->make_service([
            'terms' => $this->make_page(3, 'terms', 'Terms'),
        ]);

        $html = $service->render_message('<i>{terms}</i>');

        $this->assertStringContainsString('&lt;i&gt;', $html);
        $this->assertStringContainsString('<a href="https://example.test/?p=3"', $html);
    }

    public function test_repeated_and_adjacent_tokens_all_resolve(): void
    {
        $service = $this->make_service([
            'terms' => $this->make_page(3, 'terms', 'Terms'),
            'privacy-policy' => $this->make_page(12, 'privacy-policy', 'Privacy Policy'),
        ]);

        $html = $service->render_message('{terms}{privacy_policy} and {terms} again');

        $this->assertSame(2, substr_count($html, '>Terms</a>'));
        $this->assertStringContainsString('>Privacy Policy</a>', $html);
        $this->assertStringNotContainsString('{', $html);
    }

    public function test_newlines_become_line_breaks(): void
    {
        $service = $this->make_service();

        $html = $service->render_message("first\nsecond");

        $this->assertStringContainsString('<br', $html);
    }

    public function test_message_without_tokens_performs_no_page_lookup(): void
    {
        $service = $this->make_service();

        $html = $service->render_message('Plain text with no tokens.');

        $this->assertSame('Plain text with no tokens.', $html);
        $this->assertSame(0, $service->resolve_calls);
    }

    public function test_page_title_is_escaped_in_the_link(): void
    {
        $service = $this->make_service([
            'terms' => $this->make_page(4, 'terms', 'Terms & "Conditions"'),
        ]);

        $html = $service->render_message('{terms}');

        $this->assertStringContainsString('&amp;', $html);
        $this->assertStringNotContainsString('"Conditions"', $html);
    }
}
