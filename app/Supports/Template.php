<?php

/**
 * Template related helpers
 *
 * @package Kirki\Ecommerce\App\Supports
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Models\Attribute;
use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;

/**
 * Class Template
 *
 * @since 1.0.0
 */
class Template
{
    /**
     * Store block theme header.
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected static string $block_header = '';

    /**
     * Store block theme footer.
     *
     * @since 1.0.0
     *
     * @var string
     */
    protected static string $block_footer = '';

    /**
     * Check if the current theme is a block theme.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_block_theme(): bool
    {
        return function_exists('wp_is_block_theme') && wp_is_block_theme();
    }

    /**
     * Load the header template.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function get_header()
    {
        if (static::is_block_theme()) {
            static::$block_header = do_blocks(
                sprintf(
                    '<!-- wp:template-part {"slug":"header","theme":"%s","tagName":"header","layout":{"inherit":true}} /-->',
                    esc_attr(get_stylesheet())
                )
            );
            static::$block_footer = do_blocks(
                sprintf(
                    '<!-- wp:template-part {"slug":"footer","theme":"%s","tagName":"footer","className":"site-footer","layout":{"inherit":true}} /-->',
                    esc_attr(get_stylesheet())
                )
            );
?>
            <!doctype html>
            <html <?php language_attributes(); ?>>

            <head>
                <meta charset="<?php bloginfo('charset'); ?>">
                <?php wp_head(); ?>
            </head>

            <body <?php body_class(); ?>>
                <?php wp_body_open(); ?>
                <div class="wp-site-blocks">
                <?php
                echo static::$block_header; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_blocks() output for the site's block template; escaping would corrupt the markup.
            } else {
                get_header();
            }
        }

        /**
         * Load the footer template.
         *
         * @since 1.0.0
         *
         * @return void
         */
        public static function get_footer()
        {
            if (static::is_block_theme()) {
                echo static::$block_footer; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_blocks() output for the site's block template; escaping would corrupt the markup.

                // End of wp-site-blocks div.
                echo '</div>';

                wp_footer();

                echo '</body>';
                echo '</html>';
            } else {
                get_footer();
            }
        }

        /**
         * Render category filter.
         *
         * @since 1.0.0
         *
         * @param string $title The title of the category filter.
         * @param string $css_class The CSS class of the category filter.
         * @param int $max_level The maximum level of the category filter.
         *
         * @return void
         */
        public static function render_category_filter($title = 'Categories', $css_class = '', $max_level = 0)
        {
            $selected_category_ids = array_map(
                'intval',
                (array)($_GET['category_ids'] ?? [])
            );

            // Load categories
            $categories = Category::where('is_active', 1)
                // ->orderBy('level')
                // ->orderBy('ordering')
                // ->orderBy('name')
                ->get();

            if ($categories->count() <= 0) {
                return;
            }

            // Build tree
            $tree = [];

            foreach ($categories as $category) {
                $parent = $category->parent_id ?: 0;
                $tree[$parent][] = $category;
            }

                ?>
                <div class="<?php echo esc_attr($css_class); ?>">

                    <?php if ($title) : ?>
                        <h3><?php echo esc_html($title); ?></h3>
                    <?php endif; ?>

                    <?php static::render_category_nodes(
                        $tree,
                        0,
                        1,
                        $max_level,
                        $selected_category_ids
                    ); ?>

                </div>
                <?php
            }

            /**
             * Render category nodes.
             *
             * @since 1.0.0
             *
             * @param array $tree The category tree.
             * @param int $parent_id The parent ID.
             * @param int $level The level.
             * @param int $max_level The maximum level.
             * @param array $selected The selected categories.
             *
             * @return void
             */
            protected static function render_category_nodes(
                array $tree,
                int $parent_id,
                int $level,
                int $max_level,
                array $selected
            ) {
                if (!isset($tree[$parent_id])) {
                    return;
                }

                if ($max_level > 0 && $level > $max_level) {
                    return;
                }

                echo '<ul class="category-level category-level-' . esc_attr($level) . '">';

                foreach ($tree[$parent_id] as $category) {
                    $hasChildren = isset($tree[$category->id]);

                ?>
                    <li class="category-item level-<?php echo esc_attr($level); ?>">

                        <div class="category-row">

                            <label>
                                <input
                                    type="checkbox"
                                    name="category_ids[]"
                                    value="<?php echo esc_attr($category->id); ?>"
                                    <?php checked(in_array($category->id, $selected, true)); ?>>

                                <span><?php echo esc_html($category->name); ?></span>

                            </label>

                            <?php if ($hasChildren) : ?>
                                <span class="category-toggle"></span>
                            <?php endif; ?>

                        </div>

                        <?php
                        if ($hasChildren) {
                            static::render_category_nodes(
                                $tree,
                                $category->id,
                                $level + 1,
                                $max_level,
                                $selected
                            );
                        }
                        ?>

                    </li>
                <?php
                }

                echo '</ul>';
            }

            /**
             * Render attribute filters.
             *
             * @since 1.0.0
             *
             * @param string $title The title of the attribute filters.
             * @param string $css_class The CSS class of the attribute filters.
             *
             * @return void
             */
            public static function render_attribute_filters($title = 'Filter by', $css_class = '')
            {
                $selected_values = array_map(
                    'intval',
                    (array) ($_GET['attribute_value_ids'] ?? [])
                );

                $attributes = Attribute::all();

                if ($attributes->count() <= 0) {
                    return;
                }

                ?>
                <div class="attribute-filters <?php echo esc_attr($css_class); ?>">

                    <?php if ($title) : ?>
                        <h4 class="filter-title"><?php echo esc_html($title); ?></h4>
                    <?php endif; ?>

                    <?php foreach ($attributes as $attribute) : ?>
                        <?php
                        $values = $attribute->values()
                            // ->orderBy('value')
                            ->get();

                        if ($values->count() <= 0) {
                            continue;
                        }
                        ?>

                        <div class="attribute-filter attribute-<?php echo esc_attr($attribute->slug); ?>">

                            <div class="attribute-title">
                                <h3><?php echo esc_html($attribute->name); ?></h3>
                            </div>

                            <ul class="kirki-ecom-sidebar-list">
                                <?php foreach ($values as $value) : ?>
                                    <li>
                                        <label>
                                            <input
                                                type="checkbox"
                                                name="attribute_value_ids[]"
                                                value="<?php echo esc_attr($value->id); ?>"
                                                <?php checked(in_array($value->id, $selected_values, true)); ?>>

                                            <?php if ($attribute->type === 'color') : ?>
                                                <span class="color-swatch"
                                                    style="background:<?php echo esc_attr($value->color); ?>"></span>

                                            <?php endif; ?>

                                            <span><?php echo esc_html($value->value); ?></span>
                                        </label>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endforeach; ?>
                </div>
                <?php
            }

            /**
             * Render pagination.
             *
             * @since 1.0.0
             *
             * @param Paginator $paginator The paginator.
             * @param array $options Options for rendering pagination.
             *
             * @return void
             */
            public static function render_pagination(Paginator $paginator, array $options = [])
            {
                $last_page = $paginator->get_last_page();

                if ($last_page <= 1) {
                    return;
                }

                $current_page = $paginator->get_current_page();
                $base_url     = $options['base_url'] ?? strtok($_SERVER['REQUEST_URI'], '?');
                $page_param   = $options['page_param'] ?? 'current_page';
                $class        = $options['class'] ?? 'kecom-pagination';
                $page_window = $options['page_window'] ?? 5;

                $url = static function (int $page) use ($base_url, $page_param) {
                    $params = $_GET;
                    $params[$page_param] = $page;

                    return $base_url . '?' . http_build_query($params);
                };

                echo '<div class="' . esc_attr($class) . '">';

                // Previous
                if (!$paginator->on_first_page()) {
                ?>
                    <a href="<?php echo esc_url($url($current_page - 1)); ?>" class="kecom-page-link">
                        <?php Icon::render('chevron-left'); ?>
                    </a>
                <?php
                }

                // Pages
                if ($last_page <= $page_window) {
                    for ($page = 1; $page <= $last_page; $page++) {
                        static::render_page_link($page, $current_page, $url);
                    }
                } else {
                    $pages = [1];

                    $start = max(2, $current_page - 1);
                    $end   = min($last_page - 1, $current_page + 1);

                    if ($start > 2) {
                        $pages[] = '...';
                    }

                    for ($i = $start; $i <= $end; $i++) {
                        $pages[] = $i;
                    }

                    if ($end < $last_page - 1) {
                        $pages[] = '...';
                    }

                    $pages[] = $last_page;

                    foreach ($pages as $page) {
                        if ($page === '...') {
                            echo '<span class="kecom-page-link dots">&hellip;</span>';
                            continue;
                        }

                        static::render_page_link($page, $current_page, $url);
                    }
                }

                // Next
                if ($paginator->has_more_page()) {
                ?>
                    <a href="<?php echo esc_url($url($current_page + 1)); ?>" class="kecom-page-link">
                        <?php Icon::render('chevron-right'); ?>
                    </a>
                <?php
                }

                echo '</div>';
            }

            /**
             * Render page link.
             *
             * @since 1.0.0
             *
             * @param int $page The page number.
             * @param int $current_page The current page number.
             * @param callable $url The URL callback.
             *
             * @return void
             */
            protected static function render_page_link(int $page, int $current_page, callable $url): void
            {
                if ($page === $current_page) {
                ?>
                    <span class="kecom-page-link active"><?php echo esc_html($page); ?></span>
                <?php
                } else {
                ?>
                    <a href="<?php echo esc_url($url($page)); ?>" class="kecom-page-link"> <?php echo esc_html($page); ?></a>
        <?php
                }
            }
        }
