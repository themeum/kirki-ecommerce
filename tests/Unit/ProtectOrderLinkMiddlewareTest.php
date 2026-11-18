<?php

namespace Kirki\Ecommerce\App\Http\Middlewares {
    /**
     * Record header() calls. The middleware calls these without a leading backslash, so PHP uses
     * the functions in its own namespace first. The CLI does not keep real headers.
     */
    function header($header)
    {
        $GLOBALS['kirki_test_headers'][] = $header;
    }

    function headers_sent()
    {
        return false;
    }

    function nocache_headers()
    {
        $GLOBALS['kirki_test_headers'][] = 'nocache_headers()';
    }
}

namespace Kirki\Ecommerce\Tests\Unit {
    use Kirki\Ecommerce\App\Http\Middlewares\ProtectOrderLinkMiddleware;
    use Kirki\Ecommerce\Framework\Contracts\Request;

    class ProtectOrderLinkMiddlewareTest extends TestCase
    {
        protected function setUp(): void
        {
            parent::setUp();

            $GLOBALS['kirki_test_headers'] = [];
        }

        public function test_sends_privacy_headers_when_the_request_has_no_uuid(): void
        {
            $request = $this->createMock(Request::class);
            $request->method('string')->willReturn('');
            $next_called = false;

            $result = (new ProtectOrderLinkMiddleware())->handle($request, function () use (&$next_called) {
                $next_called = true;

                return 'next';
            });

            $this->assertSame('next', $result);
            $this->assertTrue($next_called);
            $this->assertContains('nocache_headers()', $GLOBALS['kirki_test_headers']);
            $this->assertContains('Referrer-Policy: no-referrer', $GLOBALS['kirki_test_headers']);
            $this->assertContains('X-Robots-Tag: noindex, nofollow', $GLOBALS['kirki_test_headers']);
        }
    }
}
