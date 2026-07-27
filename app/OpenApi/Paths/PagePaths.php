<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/pages",
 *     tags={"Content"},
 *     summary="List pages",
 *     operationId="Page_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Page list",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/PageResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @since 1.0.0
 */
class PagePaths
{
}
