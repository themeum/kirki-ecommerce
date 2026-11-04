const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'resources', 'data', 'preconfigured-data');
const DEFAULT_BUCKET = 'kirki-ecommerce';
const DEFAULT_PREFIX = 'preconfigured-data';
const OTHER = 'other';
const MIN_PRODUCTS = 5;

const DECIMAL = /^\d+(\.\d{1,2})?$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// The unit values of App\Constants\Unit.
const UNITS = new Set(['mg', 'g', 'kg', 'ml', 'cl', 'l', 'm3', 'mm', 'cm', 'm', 'sqft']);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/**
 * Read `presets.json` and every `<set>/products.json` from the source folder.
 */
const readPresetData = (dir = DATA_DIR) => {
  const productSets = {};

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name, 'products.json');

    if (entry.isDirectory() && fs.existsSync(file)) {
      productSets[entry.name] = readJson(file);
    }
  }

  return { presets: readJson(path.join(dir, 'presets.json')), productSets };
};

/**
 * The path of a product image in the source folder: `<set>/images/<filename>`.
 */
const imagePath = (dir, set, filename) => path.join(dir, set, 'images', filename);

const findDuplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

/**
 * The common and the industry attributes merged by slug, with the values of both.
 *
 * @returns {Map<string, Set<string>>} Attribute slug → value names.
 */
const attributeMap = (...lists) => {
  const map = new Map();

  for (const attribute of lists.flat()) {
    const values = map.get(attribute.slug) || new Set();
    (attribute.values || []).forEach((value) => values.add(value.value));
    map.set(attribute.slug, values);
  }

  return map;
};

const checkTaxonomies = (set, file, errors) => {
  const categories = set.categories || [];
  const tags = set.tags || [];
  const listed = new Set();

  for (const [kind, items] of [['category', categories], ['tag', tags]]) {
    if (items.some((item) => !SLUG.test(item.slug || '') || typeof item.name !== 'string' || item.name === '')) {
      errors.push(`${file}: every ${kind} needs a lowercase slug and a name`);
    }

    for (const slug of findDuplicates(items.map((item) => item.slug))) {
      errors.push(`${file}: duplicate ${kind} slug "${slug}"`);
    }
  }

  for (const category of categories) {
    if (category.parent !== null && category.parent !== undefined && !listed.has(category.parent)) {
      errors.push(`${file}: category "${category.slug}" has the parent "${category.parent}", which is not listed before it`);
    }

    listed.add(category.slug);
  }

  return { categorySlugs: listed, tagSlugs: new Set(tags.map((tag) => tag.slug)) };
};

const checkUnitPrice = (unitPrice, at, errors) => {
  const { base_amount: base, base_unit: baseUnit, total_amount: total, total_unit: totalUnit } = unitPrice;

  if (!(base > 0) || !(total > 0) || !UNITS.has(baseUnit) || !UNITS.has(totalUnit)) {
    errors.push(`${at}: "unit_price" needs a positive base_amount and total_amount, and a known unit for each`);
  }
};

const checkVariant = (variant, where, product, attributes, errors) => {
  const at = `${where} variant ${variant.sku || '(no sku)'}`;

  if (typeof variant.sku !== 'string' || variant.sku === '') {
    errors.push(`${at}: missing sku`);
  }

  for (const [slug, value] of Object.entries(variant.options || {})) {
    if (!attributes.has(slug)) {
      errors.push(`${at}: unknown attribute "${slug}"`);
    } else if (!attributes.get(slug).has(value)) {
      errors.push(`${at}: attribute "${slug}" has no value "${value}"`);
    }
  }

  if (!DECIMAL.test(String(variant.price))) {
    errors.push(`${at}: "price" must be a decimal string such as "38.00"`);
  }

  for (const field of ['sale_price', 'cost']) {
    if (variant[field] !== null && !DECIMAL.test(String(variant[field]))) {
      errors.push(`${at}: "${field}" must be null or a decimal string`);
    }
  }

  if (!Number.isInteger(variant.weight_g) || variant.weight_g < 0) {
    errors.push(`${at}: "weight_g" must be a whole number of grams`);
  }

  if (variant.image !== null && !product.images.includes(variant.image)) {
    errors.push(`${at}: image "${variant.image}" is not in the product images`);
  }

  if (variant.unit_price !== undefined) {
    checkUnitPrice(variant.unit_price || {}, at, errors);
  }
};

const checkProduct = (product, where, context, errors) => {
  const { categorySlugs, tagSlugs, attributes } = context;

  if (!SLUG.test(product.slug || '')) {
    errors.push(`${where}: "slug" must be a lowercase slug`);
  }

  for (const slug of product.categories || []) {
    if (!categorySlugs.has(slug)) {
      errors.push(`${where}: unknown category slug "${slug}"`);
    }
  }

  for (const slug of product.tags || []) {
    if (!tagSlugs.has(slug)) {
      errors.push(`${where}: unknown tag slug "${slug}"`);
    }
  }

  if (!Array.isArray(product.images) || product.images.length === 0) {
    errors.push(`${where}: needs at least one image`);
    product.images = [];
  }

  for (const filename of product.images) {
    if (!context.hasImage(filename)) {
      errors.push(`${where}: image "${filename}" is not in the images folder`);
    }
  }

  const variants = product.variants || [];

  if (variants.length === 0) {
    errors.push(`${where}: needs at least one variant`);
  }

  if (variants.filter((variant) => variant.is_default).length !== 1) {
    errors.push(`${where}: needs exactly one default variant`);
  }

  const axes = new Set(variants.map((variant) => Object.keys(variant.options || {}).sort().join(',')));

  if (axes.size > 1) {
    errors.push(`${where}: every variant must use the same attributes`);
  }

  for (const variant of variants) {
    checkVariant(variant, where, product, attributes, errors);
  }
};

/**
 * Check the preset and product data.
 *
 * @returns {string[]} One message per problem; empty when the data is valid.
 */
const checkPresetData = ({ presets, productSets }, { dir = DATA_DIR } = {}) => {
  const errors = [];
  const industries = presets.industries || {};
  const commonAttributes = presets.common?.attributes || [];
  const skus = new Map();

  if (!Number.isInteger(presets.version)) {
    errors.push('presets.json: "version" must be an integer');
  }

  for (const industry of new Set([...Object.keys(industries), OTHER])) {
    if (!productSets[industry]) {
      errors.push(`${industry}/products.json: file is missing`);
    }
  }

  for (const [industry, set] of Object.entries(productSets)) {
    const file = `${industry}/products.json`;
    const entry = industries[industry];

    if (!entry && industry !== OTHER) {
      errors.push(`${file}: "${industry}" is not an industry in presets.json`);
      continue;
    }

    if (!Number.isInteger(set.version)) {
      errors.push(`${file}: "version" must be an integer`);
    }

    const products = set.products || [];

    if (products.length < MIN_PRODUCTS) {
      errors.push(`${file}: has ${products.length} products, needs at least ${MIN_PRODUCTS}`);
    }

    for (const slug of findDuplicates(products.map((product) => product.slug))) {
      errors.push(`${file}: duplicate product slug "${slug}"`);
    }

    const context = {
      ...checkTaxonomies(set, file, errors),
      attributes: attributeMap(commonAttributes, entry?.attributes || []),
      hasImage: (filename) => fs.existsSync(imagePath(dir, industry, filename)),
    };

    for (const product of products) {
      const where = `${file} "${product.title}"`;

      checkProduct(product, where, context, errors);

      for (const variant of product.variants || []) {
        if (skus.has(variant.sku)) {
          errors.push(`${where}: SKU "${variant.sku}" is also used by ${skus.get(variant.sku)}`);
        } else {
          skus.set(variant.sku, where);
        }
      }
    }
  }

  return errors;
};

/**
 * Copy the data into the upload layout: presets.json, `<set>/products.json` and the
 * `<set>/images/<image>` files that the products name.
 */
const stagePresetData = ({ productSets }, stageDir, { dir = DATA_DIR } = {}) => {
  fs.copyFileSync(path.join(dir, 'presets.json'), path.join(stageDir, 'presets.json'));

  for (const [set, data] of Object.entries(productSets)) {
    const images = path.join(stageDir, set, 'images');
    fs.mkdirSync(images, { recursive: true });
    fs.copyFileSync(path.join(dir, set, 'products.json'), path.join(stageDir, set, 'products.json'));

    for (const filename of new Set(data.products.flatMap((product) => product.images))) {
      fs.copyFileSync(imagePath(dir, set, filename), path.join(images, filename));
    }
  }
};

module.exports = {
  DATA_DIR,
  DEFAULT_BUCKET,
  DEFAULT_PREFIX,
  readPresetData,
  checkPresetData,
  stagePresetData,
};
