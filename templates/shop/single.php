<?php

/**
 * Shop Single Page Template.
 *
 * @package Kirki\Ecommerce\Templates
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Helpers\TemplateHelper;
use Kirki\Ecommerce\Wordpress\SiteRoute;

$slug = SiteRoute::route_param('slug');
TemplateHelper::get_header();
?>

<div class="kirki-ecom-page-wrapper">
    <h1>Single Page <?php echo $slug; ?></h1>
</div>
<?php TemplateHelper::get_footer(); ?>
