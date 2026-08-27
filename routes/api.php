<?php

use Kirki\Ecommerce\App\Http\Controllers\Api\AppConfigController;
use Kirki\Ecommerce\App\Http\Controllers\Api\AttributeController;
use Kirki\Ecommerce\App\Http\Controllers\Api\AttributeValueController;
use Kirki\Ecommerce\App\Http\Controllers\Api\BrandController;
use Kirki\Ecommerce\App\Http\Controllers\Api\OrderCalculationController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CategoryController;
use Kirki\Ecommerce\App\Http\Controllers\Api\OfflinePaymentController;
use Kirki\Ecommerce\App\Http\Controllers\Api\OnboardingController;
use Kirki\Ecommerce\App\Http\Controllers\Api\OnlinePaymentController;
use Kirki\Ecommerce\App\Http\Controllers\Api\VariantController;
use Kirki\Ecommerce\App\Http\Controllers\Api\ProductController;
use Kirki\Ecommerce\App\Http\Controllers\Api\TagController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CollectionController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CouponController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CurrencyController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CurrencyExchangeController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CustomerController;
use Kirki\Ecommerce\App\Http\Controllers\Api\TestController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CountryController;
use Kirki\Ecommerce\App\Http\Controllers\Api\TaxProfileController;
use Kirki\Ecommerce\App\Http\Controllers\Api\ShippingBoxController;
use Kirki\Ecommerce\App\Http\Controllers\Api\SettingsController;
use Kirki\Ecommerce\App\Http\Controllers\Api\ProductSchemaController;
use Kirki\Ecommerce\App\Http\Controllers\Api\ShippingProfileController;
use Kirki\Ecommerce\App\Http\Controllers\Api\CartController;
use Kirki\Ecommerce\App\Http\Controllers\Api\OrderController;
use Kirki\Ecommerce\App\Http\Controllers\Api\OrderActivityController;
use Kirki\Ecommerce\App\Http\Controllers\Api\PageController;
use Kirki\Ecommerce\App\Http\Controllers\Api\Site\AccountController;
use Kirki\Ecommerce\App\Http\Controllers\Site\CheckoutController;
use Kirki\Ecommerce\App\Http\Controllers\Site\OrderActivityController as SiteOrderActivityController;
use Kirki\Ecommerce\App\Http\Controllers\Api\Site\SiteController;
use Kirki\Ecommerce\App\Models\Post;
use Kirki\Ecommerce\App\Payment\WebhookController;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Route;
use Kirki\Ecommerce\Framework\Middlewares\AuthMiddleware;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;

use function Kirki\Ecommerce\Framework\response;

Route::set_namespace('kirki/ecommerce/v1');

Route::post('/payment/webhook/{provider_id}', [WebhookController::class, 'handle']);

Route::group(['middleware' => AuthMiddleware::class], function () {
    // Test route
    Route::get('/test', [TestController::class, 'test']);

    // Onboarding
    Route::post('/onboarding', [OnboardingController::class, 'store']);

    // App Config
    Route::get('/app-config', [AppConfigController::class, 'get']);

    // Tags
    Route::get('/tags', [TagController::class, 'get']);
    Route::get('/tags/{id}', [TagController::class, 'show']);
    Route::post('/tags', [TagController::class, 'create']);
    Route::put('/tags/{id}', [TagController::class, 'update']);
    Route::delete('/tags/{id}', [TagController::class, 'delete']);
    Route::post('/tags/bulk', [TagController::class, 'bulk_actions']);

    // Brands
    Route::get('/brands', [BrandController::class, 'get']);
    Route::get('/brands/{id}', [BrandController::class, 'show']);
    Route::post('/brands', [BrandController::class, 'create']);
    Route::put('/brands/{id}', [BrandController::class, 'update']);
    Route::delete('/brands/{id}', [BrandController::class, 'delete']);
    Route::post('/brands/bulk', [BrandController::class, 'bulk_actions']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'get']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
    Route::post('/categories', [CategoryController::class, 'create']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'delete']);
    Route::post('/categories/bulk', [CategoryController::class, 'bulk_actions']);

    // Collections
    Route::get('/collections', [CollectionController::class, 'get']);
    Route::get('/collections/{id}', [CollectionController::class, 'show']);
    Route::post('/collections', [CollectionController::class, 'create']);
    Route::put('/collections/{id}', [CollectionController::class, 'update']);
    Route::delete('/collections/{id}', [CollectionController::class, 'delete']);
    Route::post('/collections/bulk', [CollectionController::class, 'bulk_actions']);

    // Attributes
    Route::get('/attributes', [AttributeController::class, 'get']);
    Route::get('/attributes/{id}', [AttributeController::class, 'show']);
    Route::post('/attributes', [AttributeController::class, 'create']);
    Route::put('/attributes/{id}', [AttributeController::class, 'update']);
    Route::delete('/attributes/{id}', [AttributeController::class, 'delete']);
    Route::post('/attributes/bulk', [AttributeController::class, 'bulk_actions']);

    // Attribute Values
    Route::get('/attributes/{attribute_id}/values', [AttributeValueController::class, 'get']);
    Route::get('/attributes/{attribute_id}/values/{id}', [AttributeValueController::class, 'show']);
    Route::post('/attributes/{attribute_id}/values', [AttributeValueController::class, 'create']);
    Route::put('/attributes/{attribute_id}/values/{id}', [AttributeValueController::class, 'update']);
    Route::delete('/attributes/{attribute_id}/values/{id}', [AttributeValueController::class, 'delete']);
    Route::post('/attributes/{attribute_id}/values/bulk', [AttributeValueController::class, 'bulk_actions']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'get']);
    Route::get('/customers/{id}', [CustomerController::class, 'show']);
    Route::post('/customers', [CustomerController::class, 'create']);
    Route::put('/customers/{id}', [CustomerController::class, 'update']);
    Route::delete('/customers/{id}', [CustomerController::class, 'delete']);
    Route::post('/customers/bulk', [CustomerController::class, 'bulk_actions']);

    // Currencies
    Route::get('/currencies', [CurrencyController::class, 'get']);
    Route::get('/currencies/list', [CurrencyController::class, 'list']);
    Route::get('/currencies/{id}', [CurrencyController::class, 'show']);
    Route::post('/currencies', [CurrencyController::class, 'create']);
    Route::put('/currencies', [CurrencyController::class, 'update']);
    Route::delete('/currencies/{id}', [CurrencyController::class, 'delete']);
    Route::post('/currencies/bulk', [CurrencyController::class, 'bulk_actions']);

    // Currency Exchange
    Route::get('/currency-exchange/providers', [CurrencyExchangeController::class, 'get_providers']);


    // Coupons
    Route::get('/coupons', [CouponController::class, 'get']);
    Route::get('/coupons/{id}', [CouponController::class, 'show'])->where('id', '[\d]+');
    Route::post('/coupons', [CouponController::class, 'create']);
    Route::put('/coupons/{id}', [CouponController::class, 'update'])->where('id', '[\d]+');
    Route::delete('/coupons/{id}', [CouponController::class, 'delete'])->where('id', '[\d]+');
    Route::post('/coupons/bulk', [CouponController::class, 'bulk_actions']);
    Route::get('/coupons/generate-new-code', [CouponController::class, 'generate_new_code']);
    Route::get('/coupons/validate', [CouponController::class, 'validate_code']);
    Route::patch('/coupons/{id}/action', [CouponController::class, 'action'])->where('id', '[\d]+');

    // Products
    Route::get('/product-variants', [ProductController::class, 'get_products_with_variants']);
    Route::get('/products', [ProductController::class, 'get']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::post('/products', [ProductController::class, 'create']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'delete']);
    Route::post('/products/bulk', [ProductController::class, 'bulk_actions']);
    Route::post('/products/{id}/duplicate', [ProductController::class, 'duplicate'])->where('id', '[\d]+');

    Route::get('/variants/bulk/{ids}', [VariantController::class, 'get_by_ids']);
    Route::put('/variants/bulk', [VariantController::class, 'bulk_update']);
    Route::get('/variants', [VariantController::class, 'get']);

    // Countries
    Route::get('/countries', [CountryController::class, 'get']);
    Route::get('/countries/{code}', [CountryController::class, 'show']);

    // Tax Profiles
    Route::get('/tax-profiles', [TaxProfileController::class, 'get']);
    Route::get('/tax-profiles/{id}', [TaxProfileController::class, 'show']);
    Route::post('/tax-profiles', [TaxProfileController::class, 'create']);
    Route::put('/tax-profiles/{id}', [TaxProfileController::class, 'update']);
    Route::delete('/tax-profiles/{id}', [TaxProfileController::class, 'delete']);
    Route::post('/tax-profiles/bulk', [TaxProfileController::class, 'bulk_actions']);

    // Shipping Boxes
    Route::get('/shipping-boxes', [ShippingBoxController::class, 'get']);
    Route::get('/shipping-boxes/{id}', [ShippingBoxController::class, 'show']);
    Route::post('/shipping-boxes', [ShippingBoxController::class, 'create']);
    Route::put('/shipping-boxes/{id}', [ShippingBoxController::class, 'update']);
    Route::delete('/shipping-boxes/{id}', [ShippingBoxController::class, 'delete']);
    Route::post('/shipping-boxes/bulk', [ShippingBoxController::class, 'bulk_actions']);

    // Settings
    Route::get('/settings/{key}', [SettingsController::class, 'get']);
    Route::put('/settings', [SettingsController::class, 'update']);

    // Product Schemas
    Route::get('/product-schemas', [ProductSchemaController::class, 'get']);
    Route::get('/product-schemas/{id}', [ProductSchemaController::class, 'show']);
    Route::post('/product-schemas', [ProductSchemaController::class, 'create']);
    Route::put('/product-schemas/{id}', [ProductSchemaController::class, 'update']);
    Route::delete('/product-schemas/{id}', [ProductSchemaController::class, 'delete']);
    Route::post('/product-schemas/bulk', [ProductSchemaController::class, 'bulk_actions']);

    // Shipping Profiles
    Route::get('/shipping-profiles', [ShippingProfileController::class, 'get']);
    Route::get('/shipping-profiles/{id}', [ShippingProfileController::class, 'show']);
    Route::post('/shipping-profiles', [ShippingProfileController::class, 'create']);
    Route::put('/shipping-profiles/{id}', [ShippingProfileController::class, 'update']);
    Route::delete('/shipping-profiles/{id}', [ShippingProfileController::class, 'delete']);
    Route::post('/shipping-profiles/bulk', [ShippingProfileController::class, 'bulk_actions']);

    // Cart
    Route::post('/cart/coupon', [CartController::class, 'apply_coupon']);
    Route::delete('/cart/coupon', [CartController::class, 'remove_coupon']);


    // Orders
    Route::get('/orders', [OrderController::class, 'get']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{order_id}/refunds', [OrderController::class, 'create_refund']);
    Route::put('/orders/{order_id}/refunds/{id}', [OrderController::class, 'update_refund']);
    Route::delete('/orders/{order_id}/refunds/{id}', [OrderController::class, 'delete_refund']);
    Route::get('/orders/{order_id}/activities', [OrderActivityController::class, 'get']);
    Route::post('/orders/{order_id}/activities', [OrderActivityController::class, 'store']);
    Route::delete('/orders/{order_id}/activities/{id}', [OrderActivityController::class, 'delete']);
    Route::patch('/orders/{id}/action', [OrderController::class, 'action'])->where('id', '[\d]+');
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id}', [OrderController::class, 'delete']);
    Route::post('/orders/bulk', [OrderController::class, 'bulk_actions']);
    Route::post('/calculate/order', [OrderCalculationController::class, 'get']);

    // Pages
    Route::get('/pages', [PageController::class, 'get']);

    // Online Payments
    Route::get('/online-payments/installable', [OnlinePaymentController::class, 'all']);
    Route::post('/online-payments/install', [OnlinePaymentController::class, 'install']);
    Route::get('/online-payments', [OnlinePaymentController::class, 'get']);
    Route::get('/online-payments/{id}', [OnlinePaymentController::class, 'show']);
    Route::put('/online-payments/{id}', [OnlinePaymentController::class, 'update']);
    Route::patch('/online-payments/{id}', [OnlinePaymentController::class, 'set_enabled']);

    // Offline Payments
    Route::get('/offline-payments', [OfflinePaymentController::class, 'get']);
    Route::get('/offline-payments/{id}', [OfflinePaymentController::class, 'show']);
    Route::post('/offline-payments', [OfflinePaymentController::class, 'create']);
    Route::put('/offline-payments/{id}', [OfflinePaymentController::class, 'update']);
    Route::delete('/offline-payments/{id}', [OfflinePaymentController::class, 'delete']);
});

//@todo remove this later as its just to mock the zip download
Route::get('/online-payments/download/{id}', [OnlinePaymentController::class, 'download']);

Route::get('/test-public', function (Request $request) {
    DB::enable_query_log();
    $posts = Post::with(['categories.term', 'tags.term'])->find(1);
    $query = DB::get_query_log();

    return response()->json([
        'message' => 'Hello World',
        'data' => $posts,
        'query' => $query,
    ]);
});

// Site api endpoints.
Route::get('/shop/products', [SiteController::class, 'products']);

// Cart api endpoints for guest card.
Route::get('/cart', [CartController::class, 'get']);
Route::post('/cart/items', [CartController::class, 'add_item']);
Route::put('/cart/items/{id}', [CartController::class, 'update_item']);
Route::delete('/cart/items/{id}', [CartController::class, 'remove_item']);
Route::delete('/cart', [CartController::class, 'empty_cart']);
Route::put('/cart', [CartController::class, 'update']);
Route::post('/checkout', [CheckoutController::class, 'store']);

// Account api endpoints (self-service, logged-in customer only).
Route::group(['middleware' => AuthMiddleware::class], function () {
    Route::get('/account/orders', [AccountController::class, 'customer_orders']);
    Route::get('/account/orders/{id}/activities', [SiteOrderActivityController::class, 'get']);
    Route::put('/account/profile', [AccountController::class, 'update_profile']);
    Route::put('/account/password-change', [AccountController::class, 'change_password']);
    Route::put('/account/addresses', [AccountController::class, 'update_addresses']);

    //TODO: this should have rate limit. Currently framework has no rate limit option.
    Route::post('/account/resend-verification-email', [AccountController::class, 'resend_verification_email']);
});
