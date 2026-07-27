<?php

namespace Kirki\Ecommerce\App\OpenApi;

use OpenApi\Annotations as OA;

/**
 * OpenAPI root definition for Kirki Ecommerce REST API.
 *
 * @OA\Info(
 *     version="1.0.0",
 *     title="Kirki Ecommerce API",
 *     description="REST API documentation for the Kirki Ecommerce WordPress plugin."
 * )
 *
 * @OA\Server(
 *     url="/wp-json/kirki/ecommerce/v1",
 *     description="WordPress REST API base"
 * )
 *
 * @OA\SecurityScheme(
 *     securityScheme="wpCookieAuth",
 *     type="apiKey",
 *     in="header",
 *     name="X-WP-Nonce",
 *     description="WordPress REST nonce. Requires a logged-in admin session cookie."
 * )
 *
 * @OA\Tag(name="Catalog", description="Products, variants, brands, categories, tags, collections, attributes")
 * @OA\Tag(name="Customers", description="Customer management")
 * @OA\Tag(name="Pricing", description="Currencies, coupons, tax profiles")
 * @OA\Tag(name="Shipping", description="Shipping boxes, profiles, and countries")
 * @OA\Tag(name="Cart", description="Cart operations")
 * @OA\Tag(name="Orders", description="Order and refund management")
 * @OA\Tag(name="Content", description="Pages and content")
 * @OA\Tag(name="Settings", description="App config, settings, and onboarding")
 * @OA\Tag(name="Payments", description="Payment gateways and manual payment methods")
 * @OA\Tag(name="Webhooks", description="Payment gateway webhooks")
 * @OA\Tag(name="Storefront", description="Public storefront endpoints")
 *
 * @since 1.0.0
 */
class OpenApi
{
}
