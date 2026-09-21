<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Framework\Concerns\HasConstants;

/**
 * Default style values for email templates: sizes, position and colors.
 *
 * @since 1.0.0
 */
class EmailDefaultTemplate
{
    use HasConstants;

    const HEIGHT = '30';
    const POSITION = 'center';

    const BACKGROUND_COLOR_EMAIL_BODY = '#FFFFFF';
    const BACKGROUND_COLOR_OUTER_AREA = '#DBDBE5';
    const BACKGROUND_COLOR_INFO_CADS = '#F5F5F5';
    const BACKGROUND_COLOR_DIVIDER = '#E0E0E0';

    const TYPOGRAPHY_COLOR_HEADINGS = '#000000';
    const TYPOGRAPHY_COLOR_BODY = '#000000';
    const TYPOGRAPHY_COLOR_MUTED = '#474747';
    const TYPOGRAPHY_COLOR_LINK = '#167BFF';
    const TYPOGRAPHY_COLOR_EXCEPTIONS = '#0078CE';

    const BUTTON_COLOR_BACKGROUND = '#167BFF';
    const BUTTON_COLOR_TEXT = '#FFFFFF';
}
