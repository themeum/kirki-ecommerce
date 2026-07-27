<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/app-config",
 *     tags={"Settings"},
 *     summary="Get application config",
 *     operationId="AppConfig_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(response=200, description="App config", @OA\JsonContent(type="object", @OA\Property(property="data", type="object"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class AppConfigPaths
{
}
