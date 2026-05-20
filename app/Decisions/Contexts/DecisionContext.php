<?php
namespace Kirki\Ecommerce\App\Decisions\Contexts;

class DecisionContext
{
    public $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public static function from(array $data)
    {
        return new static($data);
    }

    public function get($key)
    {
        return $this->data[$key] ?? null;
    }

    public function set($key, $value)
    {
        $this->data[$key] = $value;
    }

    public function all()
    {
        return $this->data;
    }

    public function get_shipping_cost()
    {
        return $this->get('shipping_cost');
    }

    public function set_shipping_cost($value)
    {
        $this->set('shipping_cost', $value);
    }

    public function get_product_categories()
    {
        return $this->get('product_categories') ?: [];
    }

    public function set_product_categories(array $value)
    {
        $this->set('product_categories', $value);
    }

    public function set_product_tax($value)
    {
        $this->set('product_tax', $value);
    }

    public function get_product_tax()
    {
        return $this->get('product_tax');
    }

    public function set_shipping_tax($value)
    {
        $this->set('shipping_tax', $value);
    }

    public function get_shipping_tax()
    {
        return $this->get('shipping_tax');
    }

    public function is_disabled()
    {
        return $this->get('is_disabled');
    }

    public function set_disabled($value)
    {
        $this->set('is_disabled', $value);
    }
}