<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Category\CreateCategoryDTO;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\SkipItemException;
use Kirki\Ecommerce\App\Services\CategoryService;
use Kirki\Ecommerce\Framework\Supports\Str;
use Kirki\Ecommerce\App\Models\Category;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce product categories, parents first.
 *
 * @since 1.0.0
 */
class CategoriesGroup extends TermsGroup
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'categories';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Categories', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Product categories with their parents and images.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'category';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function taxonomy()
    {
        return 'product_cat';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return new CreateCategoryDTO([
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'] !== '' ? $row['description'] : null,
            'image' => $row['image_id'],
            'parent_id' => $this->resolve_parent((int) $row['parent'], $ledger),
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $category = app(CategoryService::class)->create($mapped);

        $this->note_slug_change(__('Category', 'kirki-ecommerce'), $row['name'], Str::slug($row['slug']), $category->slug);

        return (int) $category->id;
    }

    /**
     * Get the Kirki id of a parent category, creating the parent first when it is not migrated yet.
     *
     * A parent can have a higher term id than its child, so the child cannot wait for the cursor to reach it.
     *
     * @since 1.0.0
     *
     * @param int   $parent_term_id The parent term id in WooCommerce; 0 for a top level category.
     * @param RecordLedger $ledger         The links between source and Kirki records.
     * @return int|null The Kirki id, or null for a top level category.
     * @throws SkipItemException When the parent cannot be found in WooCommerce.
     */
    protected function resolve_parent(int $parent_term_id, RecordLedger $ledger)
    {
        if ($parent_term_id <= 0) {
            return null;
        }

        $existing = $ledger->resolve($this->entity(), $parent_term_id);

        if ($existing !== null) {
            return $existing;
        }

        $parent_row = $this->database->term($this->taxonomy(), $parent_term_id);

        if ($parent_row === null) {
            throw new SkipItemException(esc_html__('The parent category does not exist in WooCommerce.', 'kirki-ecommerce'));
        }

        $parent_id = $this->persist($this->map($parent_row, $ledger), $parent_row, $ledger);
        $ledger->link($this->entity(), $parent_term_id, $parent_id, $this->run_id);

        return $parent_id;
    }
}
