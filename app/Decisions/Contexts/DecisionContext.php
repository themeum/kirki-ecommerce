<?php
namespace Kirki\Ecommerce\App\Decisions\Contexts;

/**
 * Mutable bag of shipping and tax values that decision conditions read and decision actions change.
 *
 * @since 1.0.0
 */
class DecisionContext
{
    /** @var array<string, mixed> */
    public $data;

    /**
     * Create a context from initial values.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Initial context values keyed by name.
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Create a context from initial values.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Initial context values keyed by name.
     * @return static
     */
    public static function from(array $data)
    {
        return new static($data);
    }

    /**
     * Get a context value.
     *
     * @since 1.0.0
     *
     * @param string $key Value name.
     * @return mixed Null when the key is not set.
     */
    public function get($key)
    {
        return $this->data[$key] ?? null;
    }

    /**
     * Set a context value.
     *
     * @since 1.0.0
     *
     * @param string $key   Value name.
     * @param mixed  $value Value to store.
     * @return void
     */
    public function set($key, $value)
    {
        $this->data[$key] = $value;
    }

    /**
     * Get every context value.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> All values keyed by name.
     */
    public function all()
    {
        return $this->data;
    }

    /**
     * Get the shipping cost.
     *
     * @since 1.0.0
     *
     * @return int|float|null Shipping cost in base currency minor units, or null when not set.
     */
    public function get_shipping_cost()
    {
        return $this->get('base_shipping_cost');
    }

    /**
     * Set the shipping cost.
     *
     * @since 1.0.0
     *
     * @param int|float $value Shipping cost in base currency minor units.
     * @return void
     */
    public function set_shipping_cost($value)
    {
        $this->set('base_shipping_cost', $value);
    }

    /**
     * Get the product category IDs of the cart items.
     *
     * @since 1.0.0
     *
     * @return array<int, mixed> Category IDs; empty when none are set.
     */
    public function get_product_categories()
    {
        return $this->get('product_categories') ?: [];
    }

    /**
     * Set the product category IDs of the cart items.
     *
     * @since 1.0.0
     *
     * @param array<int, mixed> $value Category IDs.
     * @return void
     */
    public function set_product_categories(array $value)
    {
        $this->set('product_categories', $value);
    }

    /**
     * Set the product tax rate.
     *
     * @since 1.0.0
     *
     * @param int|float $value Tax rate as a percentage.
     * @return void
     */
    public function set_product_tax($value)
    {
        $this->set('product_tax', $value);
    }

    /**
     * Get the product tax rate.
     *
     * @since 1.0.0
     *
     * @return int|float|null Tax rate as a percentage, or null when not set.
     */
    public function get_product_tax()
    {
        return $this->get('product_tax');
    }

    /**
     * Set the shipping tax rate.
     *
     * @since 1.0.0
     *
     * @param int|float $value Tax rate as a percentage.
     * @return void
     */
    public function set_shipping_tax($value)
    {
        $this->set('shipping_tax', $value);
    }

    /**
     * Get the shipping tax rate.
     *
     * @since 1.0.0
     *
     * @return int|float|null Tax rate as a percentage, or null when not set.
     */
    public function get_shipping_tax()
    {
        return $this->get('shipping_tax');
    }

    /**
     * Check whether the shipping method has been disabled.
     *
     * @since 1.0.0
     *
     * @return bool|null Null when the disabled flag was never set.
     */
    public function is_disabled()
    {
        return $this->get('is_disabled');
    }

    /**
     * Set whether the shipping method is disabled.
     *
     * @since 1.0.0
     *
     * @param bool $value True to disable the shipping method.
     * @return void
     */
    public function set_disabled($value)
    {
        $this->set('is_disabled', $value);
    }
}