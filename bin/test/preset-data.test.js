const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { describe, it, beforeEach } = require('node:test');

const { checkPresetData, stagePresetData } = require('../lib/preset-data');

const presets = () => ({
  version: 2,
  common: { attributes: [{ slug: 'color', values: [{ value: 'Red' }, { value: 'Blue' }] }] },
  industries: {
    fashion: {
      attributes: [
        { slug: 'size', values: [{ value: 'S' }, { value: 'M' }] },
        { slug: 'color', values: [{ value: 'Marigold', color: '#F0A433' }] },
      ],
    },
    other: { attributes: [] },
  },
});

const variant = (sku, options = {}, extra = {}) => ({
  sku,
  options,
  image: null,
  price: '10.00',
  sale_price: null,
  cost: '4.00',
  stock: 5,
  weight_g: 100,
  is_default: false,
  ...extra,
});

const product = (slug, extra = {}) => ({
  slug,
  title: slug,
  categories: [],
  tags: [],
  images: ['a.jpg'],
  variants: [variant(`SKU-${slug}`, {}, { is_default: true })],
  ...extra,
});

const set = (prefix) => ({
  version: 1,
  categories: [
    { slug: 'women', name: 'Women', parent: null },
    { slug: 'women-outerwear', name: 'Outerwear', parent: 'women' },
  ],
  tags: [{ slug: 'winter', name: 'Winter' }],
  products: ['p1', 'p2', 'p3', 'p4', 'p5'].map((name) => product(`${prefix}-${name}`)),
});

let dir;

const check = (data) => checkPresetData(data, { dir });

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'presets-'));

  for (const name of ['fashion', 'other']) {
    fs.mkdirSync(path.join(dir, name, 'images'), { recursive: true });
    fs.writeFileSync(path.join(dir, name, 'images', 'a.jpg'), 'a');
  }
});

describe('checkPresetData', () => {
  it('accepts valid data, with industry colors merged into the common color', () => {
    const data = { presets: presets(), productSets: { fashion: set('f'), other: set('o') } };
    data.productSets.fashion.products[0].categories = ['women-outerwear'];
    data.productSets.fashion.products[0].tags = ['winter'];
    data.productSets.fashion.products[1].variants = [
      variant('V-1', { color: 'Red', size: 'S' }, { is_default: true, image: 'a.jpg' }),
      variant('V-2', { color: 'Marigold', size: 'M' }, {
        unit_price: { base_amount: 100, base_unit: 'g', total_amount: 350, total_unit: 'g' },
      }),
    ];

    assert.deepStrictEqual(check(data), []);
  });

  it('reports duplicate slugs, a parent listed after its child, and unknown links', () => {
    const fashion = set('f');
    fashion.categories.push({ slug: 'women', name: 'Women again', parent: null });
    fashion.categories.unshift({ slug: 'coats', name: 'Coats', parent: 'women-outerwear' });
    fashion.products[0].categories = ['clothing-shirts'];
    fashion.products[0].tags = ['summer'];

    const errors = check({ presets: presets(), productSets: { fashion, other: set('o') } });

    assert.ok(errors.some((error) => error.includes('duplicate category slug "women"')));
    assert.ok(errors.some((error) => error.includes('category "coats" has the parent "women-outerwear", which is not listed before it')));
    assert.ok(errors.some((error) => error.includes('unknown category slug "clothing-shirts"')));
    assert.ok(errors.some((error) => error.includes('unknown tag slug "summer"')));
  });

  it('reports an unknown attribute value, an industry attribute on another set and a bad unit price', () => {
    const data = { presets: presets(), productSets: { fashion: set('f'), other: set('o') } };
    data.productSets.fashion.products[0].variants = [
      variant('V-1', { color: 'Sand' }, { is_default: true, unit_price: { base_amount: 0, base_unit: 'g', total_amount: 5, total_unit: 'oz' } }),
    ];
    data.productSets.other.products[0].variants = [variant('V-2', { size: 'S' }, { is_default: true })];

    const errors = check(data);

    assert.ok(errors.some((error) => error.includes('attribute "color" has no value "Sand"')));
    assert.ok(errors.some((error) => error.includes('other/products.json') && error.includes('unknown attribute "size"')));
    assert.ok(errors.some((error) => error.includes('"unit_price" needs a positive base_amount')));
  });

  it('reports too few products, duplicate SKUs, a missing file and a missing image', () => {
    const fashion = set('f');
    fashion.products.pop();
    fashion.products[0].images = ['missing.jpg'];
    const other = set('o');
    other.products[0].variants[0].sku = fashion.products[1].variants[0].sku;

    const errors = check({ presets: presets(), productSets: { fashion, other } });

    assert.ok(errors.some((error) => error.includes('has 4 products, needs at least 5')));
    assert.ok(errors.some((error) => error.includes(`SKU "${fashion.products[1].variants[0].sku}" is also used`)));
    assert.ok(errors.some((error) => error.includes('image "missing.jpg" is not in the images folder')));

    const withoutOther = check({ presets: presets(), productSets: { fashion: set('f') } });
    assert.ok(withoutOther.includes('other/products.json: file is missing'));
  });
});

describe('stagePresetData', () => {
  it('copies each set with the images that its products name', () => {
    const data = { presets: presets(), productSets: { fashion: set('f'), other: set('o') } };
    fs.writeFileSync(path.join(dir, 'presets.json'), '{}');
    fs.writeFileSync(path.join(dir, 'fashion', 'images', 'unused.jpg'), 'u');

    for (const [name, productSet] of Object.entries(data.productSets)) {
      fs.writeFileSync(path.join(dir, name, 'products.json'), JSON.stringify(productSet));
    }

    const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-'));
    stagePresetData(data, stageDir, { dir });

    assert.strictEqual(fs.readFileSync(path.join(stageDir, 'fashion', 'images', 'a.jpg'), 'utf8'), 'a');
    assert.ok(!fs.existsSync(path.join(stageDir, 'fashion', 'images', 'unused.jpg')));
    assert.ok(fs.existsSync(path.join(stageDir, 'presets.json')));
    assert.ok(fs.existsSync(path.join(stageDir, 'other', 'products.json')));
  });
});
