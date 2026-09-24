<?php

namespace Kirki\Ecommerce\App\Http\Requests\AttributeValue;

use Kirki\Ecommerce\App\Http\Requests\Attribute\AttributeCreateRequest;
use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\AttributeValue;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Validates and sanitizes a batch of value creations and recolors for one attribute.
 *
 * @since 1.0.0
 */
class AttributeValueBatchRequest extends Request
{
    /**
     * Reject the request with a 404 before validating when the route's attribute does not exist.
     *
     * @since 1.0.0
     *
     * @return void
     * @throws NotFoundException When the attribute does not exist.
     */
    protected function prepare_for_validation()
    {
        $attribute = Attribute::find((int) $this->input('attribute_id'));

        throw_if(empty($attribute), __('Attribute not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'attribute_id' => ['required', 'integer', function ($attribute_id, $key, $data) {
                return empty($data['create']) && empty($data['update'])
                    ? __('Provide at least one value to create or update.', 'kirki-ecommerce')
                    : true;
            }],
            'create' => ['array', 'nullable', function ($rows, $key, $data) {
                return $this->has_duplicate_or_existing_names($rows, (int) ($data['attribute_id'] ?? 0))
                    ? __('Each value name must be unique for this attribute.', 'kirki-ecommerce')
                    : true;
            }],
            'create.*.value' => 'required|string',
            'create.*.color' => 'string|nullable|regex:' . AttributeCreateRequest::HEX_COLOR_PATTERN,
            'update' => ['array', 'nullable', function ($rows, $key, $data) {
                return $this->has_foreign_value_ids($rows, (int) ($data['attribute_id'] ?? 0))
                    ? __('Every updated value must belong to this attribute.', 'kirki-ecommerce')
                    : true;
            }],
            'update.*.id' => 'required|integer',
            'update.*.color' => 'string|nullable|regex:' . AttributeCreateRequest::HEX_COLOR_PATTERN,
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'attribute_id' => Sanitizer::INT,
            'create.*.value' => Sanitizer::TEXT,
            'create.*.color' => Sanitizer::TEXT,
            'update.*.id' => Sanitizer::INT,
            'update.*.color' => Sanitizer::TEXT,
        ];
    }

    /**
     * Determine whether the rows to create repeat a name among themselves or reuse one the attribute already has.
     *
     * @since 1.0.0
     *
     * @param mixed $rows         List of `['value' => string]` rows.
     * @param int   $attribute_id Attribute the rows are created under.
     * @return bool
     */
    protected function has_duplicate_or_existing_names($rows, int $attribute_id)
    {
        if (!is_array($rows)) {
            return false;
        }

        if (AttributeCreateRequest::has_duplicate_value_names($rows)) {
            return true;
        }

        $existing = array_map(function ($name) {
            return strtolower(trim((string) $name));
        }, array_column(AttributeValue::select('value')->where('attribute_id', $attribute_id)->get()->to_array(), 'value'));

        foreach ($rows as $row) {
            if (in_array(strtolower(trim((string) ($row['value'] ?? ''))), $existing, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine whether any row to update points at a value of another attribute, or at no value at all.
     *
     * @since 1.0.0
     *
     * @param mixed $rows         List of `['id' => int]` rows.
     * @param int   $attribute_id Attribute the rows must belong to.
     * @return bool
     */
    protected function has_foreign_value_ids($rows, int $attribute_id)
    {
        if (!is_array($rows) || empty($rows)) {
            return false;
        }

        $owned_ids = array_map('intval', array_column(AttributeValue::select('id')->where('attribute_id', $attribute_id)->get()->to_array(), 'id'));

        foreach ($rows as $row) {
            if (!in_array((int) ($row['id'] ?? 0), $owned_ids, true)) {
                return true;
            }
        }

        return false;
    }
}
