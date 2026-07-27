<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Post(
 *     path="/onboarding",
 *     tags={"Settings"},
 *     summary="Complete onboarding",
 *     operationId="Onboarding_store",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\RequestBody(required=true, @OA\JsonContent(type="object")),
 *     @OA\Response(response=200, description="Onboarding result", @OA\JsonContent(type="object", @OA\Property(property="data"), @OA\Property(property="message", type="string"))),
 *     @OA\Response(response=422, description="Validation error", @OA\JsonContent(ref="#/components/schemas/ErrorResponse"))
 * )
 *
 * @since 1.0.0
 */
class OnboardingPaths
{
}
