<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/settings/{key}",
 *     tags={"Settings"},
 *     summary="Get a setting by key",
 *     operationId="Settings_get",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Parameter(name="key", in="path", required=true, @OA\Schema(type="string")),
 *     @OA\Response(
 *         response=200,
 *         description="Setting value",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", ref="#/components/schemas/SettingResource"),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @OA\Put(
 *     path="/settings",
 *     tags={"Settings"},
 *     summary="Update settings",
 *     operationId="Settings_update",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
 *     @OA\Response(response=200, description="Updated", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string")))
 * )
 *
 * @since 1.0.0
 */
class SettingsPaths
{
}
