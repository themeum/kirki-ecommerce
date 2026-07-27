<?php

namespace Kirki\Ecommerce\App\OpenApi\Schemas;

use OpenApi\Annotations as OA;

/**
 * Shared API response envelope schemas.
 *
 * @OA\Schema(
 *     schema="ApiResponse",
 *     type="object",
 *     required={"data", "message"},
 *     @OA\Property(property="data", description="Response payload"),
 *     @OA\Property(property="message", type="string", description="Human-readable status message")
 * )
 *
 * @OA\Schema(
 *     schema="PaginationMeta",
 *     type="object",
 *     required={"results", "total", "count", "per_page", "current_page", "last_page", "has_more_pages"},
 *     @OA\Property(
 *         property="results",
 *         type="array",
 *         @OA\Items(type="object"),
 *         description="Items for the current page"
 *     ),
 *     @OA\Property(property="total", type="integer", description="Total matching records"),
 *     @OA\Property(property="count", type="integer", description="Items on the current page"),
 *     @OA\Property(property="per_page", type="integer", description="Page size"),
 *     @OA\Property(property="current_page", type="integer", description="Current page (1-based)"),
 *     @OA\Property(property="last_page", type="integer", description="Last available page"),
 *     @OA\Property(property="from", type="integer", nullable=true, description="First item index on this page"),
 *     @OA\Property(property="to", type="integer", nullable=true, description="Last item index on this page"),
 *     @OA\Property(property="has_more_pages", type="boolean", description="Whether more pages exist")
 * )
 *
 * @OA\Schema(
 *     schema="PaginatedResponse",
 *     type="object",
 *     required={"data", "message"},
 *     @OA\Property(property="data", ref="#/components/schemas/PaginationMeta"),
 *     @OA\Property(property="message", type="string")
 * )
 *
 * @OA\Schema(
 *     schema="ErrorResponse",
 *     type="object",
 *     required={"message"},
 *     @OA\Property(property="message", type="string", description="Error message"),
 *     @OA\Property(
 *         property="errors",
 *         type="object",
 *         additionalProperties={
 *             "type": "array",
 *             "items": {"type": "string"}
 *         },
 *         description="Field-level validation errors"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="BulkActionRequest",
 *     type="object",
 *     required={"action"},
 *     @OA\Property(
 *         property="action",
 *         type="string",
 *         description="Bulk action to perform",
 *         enum={"delete", "delete-all"}
 *     ),
 *     @OA\Property(
 *         property="ids",
 *         type="array",
 *         @OA\Items(type="integer"),
 *         description="Target record IDs (required for delete)"
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="ListFilterQuery",
 *     type="object",
 *     @OA\Property(property="search", type="string", nullable=true),
 *     @OA\Property(property="page", type="integer", default=1),
 *     @OA\Property(property="limit", type="integer", default=10),
 *     @OA\Property(property="sort_by", type="string", default="id"),
 *     @OA\Property(property="sort_order", type="string", enum={"asc", "desc"}, default="desc")
 * )
 *
 * @since 1.0.0
 */
class Responses
{
}
