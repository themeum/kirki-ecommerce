<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Tag\CreateTagDTO;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Services\TagService;
use Kirki\Ecommerce\Framework\Supports\Str;
use Kirki\Ecommerce\App\Models\Tag;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce product tags.
 *
 * @since 1.0.0
 */
class TagsGroup extends TermsGroup
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'tags';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Tags', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Product tags with their names and slugs.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'tag';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function taxonomy()
    {
        return 'product_tag';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return new CreateTagDTO([
            'name' => $row['name'],
            'slug' => $row['slug'],
            'description' => $row['description'] !== '' ? $row['description'] : null,
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $tag = app(TagService::class)->create($mapped);

        $this->note_slug_change(__('Tag', 'kirki-ecommerce'), $row['name'], Str::slug($row['slug']), $tag->slug);

        return (int) $tag->id;
    }
}
