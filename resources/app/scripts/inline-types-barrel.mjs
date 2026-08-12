// One-off codemod for restructure-app-features stage 2: deletes the
// `types/index.ts` god-barrel by rewriting every importer to pull each
// symbol from the module that actually defines it. Skips the
// `types/entities/*` re-export shims entirely — those are deleted in the
// same commit, so importers are pointed straight at their final source.
//
// Usage: node scripts/inline-types-barrel.mjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXCLUDE_DIRS = new Set(['node_modules', '.vite']);

// symbol -> { module, isType }. Traced from types/index.ts through the
// types/entities/* shims to each symbol's real defining module; the two
// corrected destinations (UnitPriceValue/UpdateVariantsPayload,
// ToastVariant) point at where stage 2 relocates them.
const BARREL_MAP = {
  Currency: { module: '@/schemas/catalog/currency', isType: true },
  OfflinePayment: { module: '@/schemas/catalog/payment', isType: true },
  OnlinePayment: { module: '@/schemas/catalog/payment', isType: true },
  SettingsSectionKey: { module: '@/schemas/catalog/settings', isType: true },
  ShippingBox: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingCarrier: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingMethod: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingProfile: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingRegion: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingRule: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingRuleAction: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingRuleCondition: { module: '@/schemas/catalog/shipping', isType: true },
  ShippingZone: { module: '@/schemas/catalog/shipping', isType: true },
  TaxProfile: { module: '@/schemas/catalog/tax', isType: true },
  ApiError: { module: '@/types/api/response', isType: true },
  ApiErrorPayload: { module: '@/types/api/response', isType: true },
  ApiResponse: { module: '@/types/api/response', isType: true },
  ApiResponseMeta: { module: '@/types/api/response', isType: true },
  PaginatedData: { module: '@/types/api/response', isType: true },
  PaginatedResponse: { module: '@/types/api/response', isType: true },
  ApiCallResult: { module: '@/types/api/result', isType: true },
  AxiosErrorLike: { module: '@/types/api/result', isType: true },
  BulkActionParams: { module: '@/types/api/result', isType: true },
  SetKeyValuePayload: { module: '@/types/common-actions', isType: true },
  AlertType: { module: '@/types/components/common', isType: true },
  ButtonSize: { module: '@/types/components/common', isType: true },
  ButtonState: { module: '@/types/components/common', isType: true },
  ButtonType: { module: '@/types/components/common', isType: true },
  ConfirmationVariant: { module: '@/types/components/common', isType: true },
  ContainerSize: { module: '@/types/components/common', isType: true },
  DropdownItemState: { module: '@/types/components/common', isType: true },
  DropdownPosition: { module: '@/types/components/common', isType: true },
  DropdownSize: { module: '@/types/components/common', isType: true },
  FlexAlign: { module: '@/types/components/common', isType: true },
  FlexBasis: { module: '@/types/components/common', isType: true },
  FlexDirection: { module: '@/types/components/common', isType: true },
  FlexGrow: { module: '@/types/components/common', isType: true },
  FlexJustify: { module: '@/types/components/common', isType: true },
  FlexShrink: { module: '@/types/components/common', isType: true },
  FlexWrap: { module: '@/types/components/common', isType: true },
  GapValue: { module: '@/types/components/common', isType: true },
  HeadingType: { module: '@/types/components/common', isType: true },
  InputState: { module: '@/types/components/common', isType: true },
  LabelFieldProps: { module: '@/types/components/common', isType: true },
  LabelType: { module: '@/types/components/common', isType: true },
  PaginationData: { module: '@/types/components/common', isType: true },
  SelectOption: { module: '@/types/components/common', isType: true },
  SelectState: { module: '@/types/components/common', isType: true },
  StyleProps: { module: '@/types/components/common', isType: true },
  TableAlignment: { module: '@/types/components/common', isType: true },
  TableType: { module: '@/types/components/common', isType: true },
  ThumbnailSize: { module: '@/types/components/common', isType: true },
  ThumbnailType: { module: '@/types/components/common', isType: true },
  TooltipPosition: { module: '@/types/components/common', isType: true },
  ArrowDownUpFilledProps: { module: '@/types/components/icon', isType: true },
  IconColorProps: { module: '@/types/components/icon', isType: true },
  IconDimensionProps: { module: '@/types/components/icon', isType: true },
  IconProps: { module: '@/types/components/icon', isType: true },
  IconStyleProps: { module: '@/types/components/icon', isType: true },
  Attribute: { module: '@/schemas/catalog/attribute', isType: true },
  AttributeType: { module: '@/schemas/catalog/attribute', isType: true },
  AttributeValue: { module: '@/schemas/catalog/attribute', isType: true },
  Brand: { module: '@/schemas/catalog/brand', isType: true },
  Category: { module: '@/schemas/catalog/category', isType: true },
  Collection: { module: '@/schemas/catalog/collection', isType: true },
  Country: { module: '@/schemas/reference/country', isType: true },
  Coupon: { module: '@/schemas/catalog/coupon', isType: true },
  CouponFormPayload: { module: '@/schemas/forms/coupon-form', isType: true },
  Customer: { module: '@/schemas/catalog/customer', isType: true },
  CustomerAddress: { module: '@/schemas/catalog/customer', isType: true },
  CustomerListItem: { module: '@/schemas/catalog/customer', isType: true },
  MediaRef: { module: '@/schemas/shared/media', isType: true },
  MediaSize: { module: '@/schemas/shared/media', isType: true },
  FulfillmentStatus: { module: '@/schemas/catalog/order', isType: true },
  OrderCalculation: { module: '@/schemas/catalog/order', isType: true },
  OrderItem: { module: '@/schemas/catalog/order', isType: true },
  OrderListItem: { module: '@/schemas/catalog/order', isType: true },
  OrderStatus: { module: '@/schemas/catalog/order', isType: true },
  OrderTracking: { module: '@/schemas/catalog/order', isType: true },
  PaymentStatus: { module: '@/schemas/catalog/order', isType: true },
  Refund: { module: '@/schemas/catalog/order', isType: true },
  FulfillmentStatusSchema: { module: '@/schemas/catalog/order', isType: false },
  OrderCalculationSchema: { module: '@/schemas/catalog/order', isType: false },
  OrderItemSchema: { module: '@/schemas/catalog/order', isType: false },
  OrderListItemSchema: { module: '@/schemas/catalog/order', isType: false },
  OrderCalculationRequestPayload: { module: '@/schemas/forms/order-form', isType: true },
  OrderFormInput: { module: '@/schemas/forms/order-form', isType: true },
  OrderFormPayload: { module: '@/schemas/forms/order-form', isType: true },
  OrderCalculationRequestSchema: { module: '@/schemas/forms/order-form', isType: false },
  OrderFormSchema: { module: '@/schemas/forms/order-form', isType: false },
  PageItem: { module: '@/schemas/catalog/page', isType: true },
  AdditionalInfoItem: { module: '@/schemas/catalog/product', isType: true },
  Product: { module: '@/schemas/catalog/product', isType: true },
  ProductAttribute: { module: '@/schemas/catalog/product', isType: true },
  ProductBrand: { module: '@/schemas/catalog/product', isType: true },
  ProductCategoryRef: { module: '@/schemas/catalog/product', isType: true },
  ProductCollectionRef: { module: '@/schemas/catalog/product', isType: true },
  ProductCurrency: { module: '@/schemas/catalog/product', isType: true },
  ProductListItem: { module: '@/schemas/catalog/product', isType: true },
  ProductStatus: { module: '@/schemas/catalog/product', isType: true },
  ProductTagRef: { module: '@/schemas/catalog/product', isType: true },
  InventoryVariant: { module: '@/schemas/catalog/variant', isType: true },
  ProductVariant: { module: '@/schemas/catalog/variant', isType: true },
  UnitPriceValue: { module: '@/features/products', isType: true },
  UpdateVariantsPayload: { module: '@/features/products', isType: true },
  SchemaProfile: { module: '@/schemas/catalog/schema-profile', isType: true },
  Tag: { module: '@/schemas/catalog/tag', isType: true },
  ToastVariant: { module: '@/types/pages/common', isType: true },
  ListFilterConfig: { module: '@/types/list-state', isType: true },
  ListParams: { module: '@/types/list-state', isType: true },
  ListQueryParams: { module: '@/types/list-state', isType: true },
  ListState: { module: '@/types/list-state', isType: true },
  SortOrder: { module: '@/types/list-state', isType: true },
  isApiSuccess: { module: '@/types/pages/api-guards', isType: false },
  DateFormatType: { module: '@/types/pages/common', isType: true },
  FormErrors: { module: '@/types/pages/common', isType: true },
  MarkListHandlers: { module: '@/types/pages/common', isType: true },
  MediaChangePayload: { module: '@/types/pages/common', isType: true },
  ProfitData: { module: '@/types/pages/common', isType: true },
  SuggestionItem: { module: '@/types/pages/common', isType: true },
  SuggestionOption: { module: '@/types/pages/common', isType: true },
  TaxonomyTableHeader: { module: '@/types/pages/common', isType: true },
  ToastMessageConfig: { module: '@/types/pages/common', isType: true },
};

function listFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

const IMPORT_RE = /import\s+(type\s+)?\{([^}]*)\}\s+from\s+(['"])@\/types\3;?\n?/g;

function processFile(fileAbs) {
  const content = fs.readFileSync(fileAbs, 'utf8');
  if (!/from\s+['"]@\/types['"]/.test(content)) {
    return false;
  }

  const groups = new Map();
  const unresolved = [];

  const stripped = content.replace(IMPORT_RE, (_full, typeKw, body) => {
    const entries = body.split(',').map((s) => s.trim()).filter(Boolean);
    for (const entry of entries) {
      let e = entry;
      let entryIsType = Boolean(typeKw);
      if (e.startsWith('type ')) {
        entryIsType = true;
        e = e.slice(5).trim();
      }
      const [importedRaw, localRaw] = e.split(/\s+as\s+/).map((s) => s.trim());
      const info = BARREL_MAP[importedRaw];
      if (!info) {
        unresolved.push(importedRaw);
        continue;
      }
      const key = `${info.module}|${entryIsType || info.isType}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push({ imported: importedRaw, local: localRaw || importedRaw });
    }
    return '';
  });

  if (unresolved.length > 0) {
    console.error(`  UNRESOLVED in ${path.relative(APP_ROOT, fileAbs)}: ${unresolved.join(', ')}`);
  }

  if (groups.size === 0) {
    return false;
  }

  const newLines = [...groups.entries()].map(([key, entries]) => {
    const [module, isTypeStr] = key.split('|');
    const isType = isTypeStr === 'true';
    const specifiers = entries
      .map(({ imported, local }) => (imported === local ? imported : `${imported} as ${local}`))
      .join(', ');
    return `import ${isType ? 'type ' : ''}{ ${specifiers} } from '${module}';`;
  });

  const importInsertRe = /^import\s/m;
  const insertAt = stripped.search(importInsertRe);
  const finalContent = insertAt === -1
    ? `${newLines.join('\n')}\n${stripped.replace(/^\n+/, '')}`
    : stripped.slice(0, insertAt) + newLines.join('\n') + '\n' + stripped.slice(insertAt);

  fs.writeFileSync(fileAbs, finalContent.replace(/\n{3,}/g, '\n\n'));
  return true;
}

const changed = [];
for (const fileAbs of listFiles(APP_ROOT)) {
  if (!/\.(ts|tsx)$/.test(fileAbs)) {
    continue;
  }
  if (fileAbs === path.join(APP_ROOT, 'types/index.ts')) {
    continue;
  }
  if (processFile(fileAbs)) {
    changed.push(fileAbs);
  }
}

console.log(`Rewrote ${changed.length} file(s).`);

if (changed.length > 0) {
  const rel = changed.map((f) => JSON.stringify(path.relative(APP_ROOT, f))).join(' ');
  execSync(`npx eslint --fix ${rel}`, { cwd: APP_ROOT, stdio: 'inherit' });
}
