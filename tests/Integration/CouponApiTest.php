<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\BulkActions;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class CouponApiTest extends RestTestCase
{
    private $coupon_id;

    public function test_create_coupon_returns_201_and_persists(): void
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload([
            'title' => 'Summer Sale',
            'code' => 'SUMMER-' . wp_generate_password(6, false),
        ]));

        $payload = $this->assert_api_success($response, 201);
        $this->assertArrayHasKey('id', $payload['data']);
        $this->assertEquals('Summer Sale', $payload['data']['title']);
        $this->assertEquals(CouponMethod::CODE, $payload['data']['method']);
        $this->assertEquals(DiscountType::AMOUNT_OFF, $payload['data']['discount_type']);
        $this->assertTrue($payload['data']['is_active']);

        $this->coupon_id = $payload['data']['id'];
    }

    public function test_show_coupon_returns_resource(): void
    {
        $coupon = $this->create_coupon(['title' => 'Show Coupon']);
        $this->coupon_id = $coupon['id'];

        $response = $this->request('GET', 'coupons/' . $this->coupon_id);
        $payload = $this->assert_api_success($response);

        $this->assertEquals($this->coupon_id, $payload['data']['id']);
        $this->assertEquals('Show Coupon', $payload['data']['title']);
    }

    public function test_update_coupon_changes_fields(): void
    {
        $coupon = $this->create_coupon();
        $this->coupon_id = $coupon['id'];

        $response = $this->request('PUT', 'coupons/' . $this->coupon_id, $this->coupon_payload([
            'id' => $this->coupon_id,
            'title' => 'Updated Coupon',
            'code' => $coupon['code'],
            'is_active' => false,
        ]));

        $payload = $this->assert_api_success($response);
        $this->assertEquals('Updated Coupon', $payload['data']['title']);
        $this->assertFalse($payload['data']['is_active']);
    }

    public function test_delete_coupon_removes_record(): void
    {
        $this->coupon_id = $this->create_coupon()['id'];

        $response = $this->request('DELETE', 'coupons/' . $this->coupon_id);
        $payload = $this->assert_api_success($response);

        $this->assertTrue($payload['data']);
    }

    public function test_show_deleted_coupon_returns_404(): void
    {
        $this->coupon_id = $this->create_coupon()['id'];
        $this->request('DELETE', 'coupons/' . $this->coupon_id);

        $response = $this->request('GET', 'coupons/' . $this->coupon_id);
        $this->assert_api_error($response, 404);
    }

    public function test_create_coupon_validation_fails_without_title(): void
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload([
            'title' => '',
        ]));

        $this->assert_validation_error($response);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->logout();

        $response = $this->request('GET', 'coupons');
        $this->assert_api_error($response, 401);
    }

    public function test_list_coupons_returns_paginated_results(): void
    {
        $this->create_coupon(['title' => 'Coupon Alpha']);
        $this->create_coupon(['title' => 'Coupon Beta']);

        $response = $this->request('GET', 'coupons', [
            'page' => 1,
            'limit' => 10,
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertArrayHasKey('results', $payload['data']);
        $this->assertArrayHasKey('total', $payload['data']);
        $this->assertGreaterThanOrEqual(2, $payload['data']['total']);
        $this->assertNotEmpty($payload['data']['results']);
    }

    public function test_bulk_action_on_coupons(): void
    {
        $first = $this->create_coupon(['title' => 'Bulk One']);
        $second = $this->create_coupon(['title' => 'Bulk Two']);

        $response = $this->request('POST', 'coupons/bulk', [
            'action' => BulkActions::DELETE,
            'ids' => [$first['id'], $second['id']],
        ]);

        $payload = $this->assert_api_success($response);
        $this->assertTrue($payload['data']);

        $check = $this->request('GET', 'coupons/' . $first['id']);
        $this->assert_api_error($check, 404);
    }

    private function create_coupon(array $overrides = []): array
    {
        $response = $this->request('POST', 'coupons', $this->coupon_payload($overrides));
        $payload = $this->assert_api_success($response, 201);

        return $payload['data'];
    }

    private function coupon_payload(array $overrides = []): array
    {
        $payload = [
            'method' => CouponMethod::CODE,
            'title' => 'Test Coupon',
            'code' => 'TEST-' . wp_generate_password(6, false),
            'discount_type' => DiscountType::AMOUNT_OFF,
            'discount_target' => DiscountTarget::ORDER,
            'discount_value_type' => DiscountValueType::PERCENTAGE,
            'discount_amount' => 10,
            'start_date' => '2025-01-01',
            'has_end_date' => false,
            'customer_eligibility' => CustomerEligibility::ALL,
            'is_active' => true,
        ];

        return array_merge($payload, $overrides);
    }
}
