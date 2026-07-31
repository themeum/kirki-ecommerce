<?php

namespace Kirki\Ecommerce\App\DTO\Product;

use Kirki\Ecommerce\Framework\DTO;

class UpdateProductDTO extends DTO
{
    /** @var int */
    public $id;

    /** @var string */
    public $title;

    /** @var string|null */
    public $slug;

    /** @var string|null */
    public $status;

    /** @var string|null */
    public $ribbon;

    /** @var int|null */
    public $currency_id;

    /** @var int|null */
    public $brand_id;

    /** @var string|null */
    public $short_description;

    /** @var string|null */
    public $description;

    /** @var string|null */
    public $additional_info;

    /** @var bool|null */
    public $allow_back_order = false;

    /** @var string|null */
    public $seo_title;

    /** @var string|null */
    public $seo_description;

    /** @var string[]|null */
    public $seo_keywords = [];

    /** @var string|null */
    public $og_title;

    /** @var string|null */
    public $og_description;

    /** @var int|null */
    public $og_image;

    /** @var int|null */
    public $schema_id;

    /** @var string|null */
    public $llm_instructions;

    /** @var bool|null */
    public $has_variants = false;

    /** @var int[]|null */
    public $media = [];

    /** @var int[]|null */
    public $categories = [];

    /** @var int[]|null */
    public $tags = [];

    /** @var int[]|null */
    public $collections = [];

    /** @var int[]|null */
    public $attributes = [];

    /** @var int|null */
    public $tax_profile_id;

    /** @var int|null */
    public $shipping_profile_id;

    /** @var int|null */
    public $shipping_box_id;
}
