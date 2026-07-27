<?php

namespace Kirki\Ecommerce\App\OpenApi\Paths;

use OpenApi\Annotations as OA;

/**
 * OpenAPI path definitions.
 *
 * @OA\Get(
 *     path="/currency-exchange/providers",
 *     tags={"Pricing"},
 *     summary="List currency exchange providers",
 *     operationId="CurrencyExchange_get_providers",
 *     security={{"wpCookieAuth": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Provider list",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="data", type="array", @OA\Items(ref="#/components/schemas/CurrencyProviderResource")),
 *             @OA\Property(property="message", type="string")
 *         )
 *     )
 * )
 *
 * @since 1.0.0
 */
class CurrencyExchangePaths
{
}
