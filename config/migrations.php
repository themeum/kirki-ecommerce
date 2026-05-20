<?php

use Kirki\Ecommerce\Database\Migrations\CreateAddressesTable;
use Kirki\Ecommerce\Database\Migrations\CreateLanguagesTable;
use Kirki\Ecommerce\Database\Migrations\CreateCurrenciesTable;
use Kirki\Ecommerce\Database\Migrations\CreateCustomersTable;
use Kirki\Ecommerce\Database\Migrations\CreateBrandsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCategoriesTable;
use Kirki\Ecommerce\Database\Migrations\CreateShippingBoxesTable;
use Kirki\Ecommerce\Database\Migrations\CreateShippingProfilesTable;
use Kirki\Ecommerce\Database\Migrations\CreateTagsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCollectionsTable;
use Kirki\Ecommerce\Database\Migrations\CreateAttributesTable;
use Kirki\Ecommerce\Database\Migrations\CreateAttributeValuesTable;
use Kirki\Ecommerce\Database\Migrations\CreateProductsTable;
use Kirki\Ecommerce\Database\Migrations\CreateProductTagsTable;
use Kirki\Ecommerce\Database\Migrations\CreateProductTranslationsTable;
use Kirki\Ecommerce\Database\Migrations\CreateTaxProfilesTable;
use Kirki\Ecommerce\Database\Migrations\CreateVariantsTable;
use Kirki\Ecommerce\Database\Migrations\CreateAttributeProductTable;
use Kirki\Ecommerce\Database\Migrations\CreateAttributeValueVariantTable;
use Kirki\Ecommerce\Database\Migrations\CreateOrdersTable;
use Kirki\Ecommerce\Database\Migrations\CreateOrderItemsTable;
use Kirki\Ecommerce\Database\Migrations\CreateOrderActivitiesTable;
use Kirki\Ecommerce\Database\Migrations\CreateRefundsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCouponsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCouponCategoriesTable;
use Kirki\Ecommerce\Database\Migrations\CreateCouponCustomersTable;
use Kirki\Ecommerce\Database\Migrations\CreateCouponProductsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCouponUsageTable;
use Kirki\Ecommerce\Database\Migrations\CreateCollectionTranslationsTable;
use Kirki\Ecommerce\Database\Migrations\CreateAttributeTranslationsTable;
use Kirki\Ecommerce\Database\Migrations\CreateAttributeValueProductTable;
use Kirki\Ecommerce\Database\Migrations\CreateCartItemsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCartsTable;
use Kirki\Ecommerce\Database\Migrations\CreateCategoryProductTable;
use Kirki\Ecommerce\Database\Migrations\CreateCollectionProductTable;
use Kirki\Ecommerce\Database\Migrations\CreateMediaProductTable;
use Kirki\Ecommerce\Database\Migrations\CreateProductSchemaTable;
use Kirki\Ecommerce\Database\Migrations\CreateSchedulerJobsTable;

return [
    CreateLanguagesTable::class,
    CreateCurrenciesTable::class,
    CreateCustomersTable::class,
    CreateAddressesTable::class,
    CreateBrandsTable::class,
    CreateCategoriesTable::class,
    CreateTagsTable::class,
    CreateCollectionsTable::class,
    CreateAttributesTable::class,
    CreateAttributeValuesTable::class,
    CreateProductSchemaTable::class,
    CreateProductsTable::class,
    CreateCategoryProductTable::class,
    CreateProductTagsTable::class,
    CreateCollectionProductTable::class,
    CreateMediaProductTable::class,
    CreateProductTranslationsTable::class,
    CreateVariantsTable::class,
    CreateAttributeValueVariantTable::class,
    CreateAttributeProductTable::class,
    CreateAttributeValueProductTable::class,
    CreateCartsTable::class,
    CreateCartItemsTable::class,
    CreateOrdersTable::class,
    CreateOrderItemsTable::class,
    CreateOrderActivitiesTable::class,
    CreateRefundsTable::class,
    CreateCouponsTable::class,
    CreateCouponCategoriesTable::class,
    CreateCouponCustomersTable::class,
    CreateCouponProductsTable::class,
    CreateCouponUsageTable::class,
    CreateCollectionTranslationsTable::class,
    CreateAttributeTranslationsTable::class,
    CreateShippingProfilesTable::class,
    CreateShippingBoxesTable::class,
    CreateTaxProfilesTable::class,
    CreateSchedulerJobsTable::class,
];
