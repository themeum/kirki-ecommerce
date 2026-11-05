<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Models\Wishlist;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

class WishlistApiTest extends RestTestCase
{
    use CreatesTestProducts;

    /**
     * Log in as a fresh customer.
     *
     * @return int The created user ID.
     * @since 1.0.0
     */
    protected function login_as_new_customer(): int
    {
        $user_id = static::factory()->user->create(['role' => 'subscriber']);
        wp_set_current_user($user_id);

        return $user_id;
    }

    /**
     * Add a product to the wishlist through the API.
     *
     * @param int      $product_id Product ID.
     * @param int|null $variant_id Variant ID, or null to send none.
     * @return \WP_REST_Response
     * @since 1.0.0
     */
    protected function wishlist_add(int $product_id, ?int $variant_id = null): \WP_REST_Response
    {
        $params = ['product_id' => $product_id];

        if ($variant_id) {
            $params['variant_id'] = $variant_id;
        }

        return $this->request('POST', 'account/wishlist', $params);
    }

    /**
     * Get the wishlist cards of the current user.
     *
     * @return array
     * @since 1.0.0
     */
    protected function wishlist_items(): array
    {
        $response = $this->request('GET', 'account/wishlist');

        return $this->assert_api_success($response)['data']['items'];
    }

    public function test_add_without_variant_stores_the_product_only(): void
    {
        $product = $this->create_product();
        $user_id = $this->login_as_new_customer();

        $payload = $this->assert_api_success($this->wishlist_add($product['id']), 201);

        $this->assertEquals($product['id'], $payload['data']['product_id']);
        $entry = Wishlist::where('user_id', $user_id)->first();
        $this->assertEquals($product['id'], $entry->product_id);
        $this->assertNull($entry->variant_id);
    }

    public function test_add_with_variant_stores_the_variant(): void
    {
        $product = $this->create_two_variant_product();
        $second_variant_id = (int) $product['variants'][1]['id'];
        $user_id = $this->login_as_new_customer();

        $this->assert_api_success($this->wishlist_add($product['id'], $second_variant_id), 201);

        $this->assertEquals($second_variant_id, Wishlist::where('user_id', $user_id)->first()->variant_id);
    }

    public function test_saving_a_product_twice_keeps_one_entry(): void
    {
        $product = $this->create_product();
        $user_id = $this->login_as_new_customer();

        $this->assert_api_success($this->wishlist_add($product['id']), 201);
        $this->assert_api_success($this->wishlist_add($product['id']), 201);

        $this->assertEquals(1, Wishlist::where('user_id', $user_id)->count());
    }

    public function test_saving_two_variants_of_one_product_keeps_one_entry_with_the_last_variant(): void
    {
        $product = $this->create_two_variant_product();
        $first_variant_id = (int) $product['variants'][0]['id'];
        $second_variant_id = (int) $product['variants'][1]['id'];
        $user_id = $this->login_as_new_customer();

        $this->assert_api_success($this->wishlist_add($product['id'], $first_variant_id), 201);
        $this->assert_api_success($this->wishlist_add($product['id'], $second_variant_id), 201);

        $entries = Wishlist::where('user_id', $user_id)->get();
        $this->assertCount(1, $entries);
        $this->assertEquals($second_variant_id, $entries->first()->variant_id);
    }

    public function test_re_adding_without_a_variant_keeps_the_saved_variant(): void
    {
        $product = $this->create_two_variant_product();
        $second_variant_id = (int) $product['variants'][1]['id'];
        $user_id = $this->login_as_new_customer();

        $this->assert_api_success($this->wishlist_add($product['id'], $second_variant_id), 201);
        $this->assert_api_success($this->wishlist_add($product['id']), 201);

        $this->assertEquals($second_variant_id, Wishlist::where('user_id', $user_id)->first()->variant_id);
    }

    public function test_table_has_no_unique_key_on_user_and_product(): void
    {
        global $wpdb;

        $indexes = $wpdb->get_results('SHOW INDEX FROM `' . $wpdb->prefix . 'kirki_ecommerce_wishlist`', ARRAY_A);

        $columns    = [];
        $is_unique  = [];
        foreach ($indexes as $index) {
            $columns[$index['Key_name']][(int) $index['Seq_in_index']] = $index['Column_name'];
            $is_unique[$index['Key_name']] = 0 === (int) $index['Non_unique'];
        }

        $plain_index = 'idx_kecom_wishlist_user_id_product_id';

        $this->assertSame(['user_id', 'product_id'], array_values($columns[$plain_index] ?? []));
        $this->assertFalse($is_unique[$plain_index]);

        foreach ($columns as $key_name => $key_columns) {
            if ($is_unique[$key_name]) {
                $this->assertNotSame(['user_id', 'product_id'], array_values($key_columns), "Key {$key_name} must not be unique on user_id and product_id.");
            }
        }
    }

    public function test_adding_an_unknown_product_returns_404(): void
    {
        $this->login_as_new_customer();

        $this->assert_api_error($this->wishlist_add(999999), 404);
        $this->assertEquals(0, Wishlist::query()->count());
    }

    public function test_adding_an_unpublished_product_returns_404(): void
    {
        $product = $this->create_product(['status' => ProductStatus::DRAFT]);
        $this->login_as_new_customer();

        $this->assert_api_error($this->wishlist_add($product['id']), 404);
        $this->assertEquals(0, Wishlist::query()->count());
    }

    public function test_adding_a_variant_of_another_product_returns_404(): void
    {
        $product = $this->create_product();
        $other_product = $this->create_product();
        $this->login_as_new_customer();

        $this->assert_api_error($this->wishlist_add($product['id'], $this->default_variant_id($other_product)), 404);
        $this->assertEquals(0, Wishlist::query()->count());
    }

    public function test_remove_deletes_the_entry_by_product_id(): void
    {
        $product = $this->create_two_variant_product();
        $user_id = $this->login_as_new_customer();
        $this->wishlist_add($product['id'], (int) $product['variants'][1]['id']);

        $payload = $this->assert_api_success($this->request('DELETE', 'account/wishlist/' . $product['id']));

        $this->assertTrue($payload['data']);
        $this->assertEquals(0, Wishlist::where('user_id', $user_id)->count());
    }

    public function test_removing_a_product_that_is_not_saved_returns_404(): void
    {
        $product = $this->create_product();
        $this->login_as_new_customer();

        $this->assert_api_error($this->request('DELETE', 'account/wishlist/' . $product['id']), 404);
    }

    public function test_removing_cannot_touch_another_customers_entry(): void
    {
        $product = $this->create_product();
        $owner_id = $this->login_as_new_customer();
        $this->wishlist_add($product['id']);

        $this->login_as_new_customer();

        $this->assert_api_error($this->request('DELETE', 'account/wishlist/' . $product['id']), 404);
        $this->assertEquals(1, Wishlist::where('user_id', $owner_id)->count());
    }

    public function test_visitor_cannot_use_the_wishlist(): void
    {
        $product = $this->create_product();
        $this->logout();

        $this->assert_api_error($this->wishlist_add($product['id']), 401);
    }

    public function test_entry_survives_deleting_its_saved_variant(): void
    {
        $product = $this->create_two_variant_product();
        $second_variant_id = (int) $product['variants'][1]['id'];
        $user_id = $this->login_as_new_customer();
        $this->wishlist_add($product['id'], $second_variant_id);

        Variant::query()->where('id', $second_variant_id)->delete();

        $entries = Wishlist::where('user_id', $user_id)->get();
        $this->assertCount(1, $entries);
        $this->assertNull($entries->first()->variant_id);
        $this->assertEquals($product['id'], $entries->first()->product_id);
    }

    public function test_entries_are_deleted_with_their_product(): void
    {
        $product = $this->create_product();
        $user_id = $this->login_as_new_customer();
        $this->wishlist_add($product['id']);

        Product::query()->where('id', $product['id'])->delete();

        $this->assertEquals(0, Wishlist::where('user_id', $user_id)->count());
    }

    public function test_list_shows_the_saved_variant_and_links_to_it(): void
    {
        $product = $this->create_two_variant_product();
        $second_variant_id = (int) $product['variants'][1]['id'];
        $this->login_as_new_customer();
        $this->wishlist_add($product['id'], $second_variant_id);

        $items = $this->wishlist_items();

        $this->assertCount(1, $items);
        $this->assertEquals($product['id'], $items[0]['product_id']);
        $this->assertEquals($second_variant_id, $items[0]['variant_id']);
        $this->assertStringContainsString('variant_id=' . $second_variant_id, $items[0]['product_url']);
        $this->assertStringContainsString('20', $items[0]['display_price']);
    }

    public function test_list_falls_back_to_the_default_variant_without_a_saved_variant(): void
    {
        $product = $this->create_two_variant_product();
        $default_variant_id = (int) $product['variants'][0]['id'];
        $this->login_as_new_customer();
        $this->wishlist_add($product['id']);

        $items = $this->wishlist_items();

        $this->assertCount(1, $items);
        $this->assertEquals($default_variant_id, $items[0]['variant_id']);
        $this->assertStringNotContainsString('variant_id=', $items[0]['product_url']);
        $this->assertStringContainsString('10', $items[0]['display_price']);
    }

    public function test_list_keeps_the_entry_after_its_saved_variant_is_deleted(): void
    {
        $product = $this->create_two_variant_product();
        $default_variant_id = (int) $product['variants'][0]['id'];
        $this->login_as_new_customer();
        $this->wishlist_add($product['id'], (int) $product['variants'][1]['id']);

        Variant::query()->where('id', $product['variants'][1]['id'])->delete();

        $items = $this->wishlist_items();
        $this->assertCount(1, $items);
        $this->assertEquals($default_variant_id, $items[0]['variant_id']);
    }

    public function test_shop_listing_marks_a_product_wishlisted_whatever_the_saved_variant(): void
    {
        $product = $this->create_two_variant_product();
        $this->login_as_new_customer();
        $this->wishlist_add($product['id'], (int) $product['variants'][1]['id']);

        $payload = $this->assert_api_success($this->request('GET', 'shop/products'));

        $cards = array_filter($payload['data']['items'], fn($card) => (int) $card['product_id'] === (int) $product['id']);
        $this->assertCount(1, $cards);
        $this->assertTrue(array_values($cards)[0]['is_wishlisted']);
    }
}
