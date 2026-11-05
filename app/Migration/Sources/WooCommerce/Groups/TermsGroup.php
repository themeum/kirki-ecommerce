<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

/**
 * Base class for the groups that read WooCommerce taxonomy terms.
 *
 * @since 1.0.0
 */
abstract class TermsGroup extends WooCommerceGroup
{
    /**
     * Get the WooCommerce taxonomy the group reads, for example "product_cat".
     *
     * @since 1.0.0
     *
     * @return string
     */
    abstract protected function taxonomy();

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return $this->database->count_terms($this->taxonomy());
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        return $this->database->terms($this->taxonomy(), $cursor, $limit);
    }

    /**
     * Record a note when the saved slug differs from the source slug because it was already taken.
     *
     * @since 1.0.0
     *
     * @param string $label The kind of record, for example "Category".
     * @param string $name  The record name.
     * @param string $wanted The slug in WooCommerce.
     * @param string $saved The slug that was saved.
     * @return void
     */
    protected function note_slug_change(string $label, string $name, string $wanted, string $saved)
    {
        if ($wanted !== $saved) {
            $this->note(sprintf(
                /* translators: 1: kind of record, 2: record name, 3: new slug */
                __('%1$s "%2$s" was saved with the slug "%3$s" because its slug was already used.', 'kirki-ecommerce'),
                $label,
                $name,
                $saved
            ));
        }
    }
}
