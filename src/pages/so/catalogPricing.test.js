import { applyCatalogPrices } from './catalogPricing';

const catalog = [{ stcode: '001', catalog_code: 'CL0054-1', price: 45, unit: 'KG', packing_weight: 5 }];

test('reprices every duplicate line, retaining quantities, order, VAT and saved packing', () => {
  const rows = [
    { _rid: 1, code: '100', stcode: '001', qty: 8, price: 30, unit: 'KG', vat: 7, packing_weight: 1 },
    { _rid: 2, stcode: '001', qty: 20, price: 35, unit: 'KG', vat: 0, packing_weight: 1 },
  ];
  const result = applyCatalogPrices(rows, catalog);
  expect(result.map((r) => r.price)).toEqual([45, 45]);
  expect(result.map((r) => r.qty)).toEqual([8, 20]);
  expect(result.map((r) => r._rid)).toEqual([1, 2]);
  expect(result.map((r) => r.vat)).toEqual([7, 0]);
  expect(result.map((r) => r.packing_weight)).toEqual([1, 5]);
  expect(result.map((r) => r.catalog_code)).toEqual(['CL0054-1', 'CL0054-1']);
  expect(rows[0].price).toBe(30);
});

test('missing prices and incompatible units preserve entered values and flag review', () => {
  const rows = [
    { stcode: '002', price: 12, qty: 3, unit: 'KG', catalog_code: 'OLD' },
    { stcode: '001', price: 70, qty: 2, unit: 'BOX', catalog_code: 'OLD' },
  ];
  const result = applyCatalogPrices(rows, catalog);
  expect(result.map((r) => r.price)).toEqual([12, 70]);
  expect(result.every((r) => r._catalogPriceMissing && !r.catalog_code)).toBe(true);
  expect(result.map((r) => r.unit)).toEqual(['KG', 'BOX']);
});

test('returning to a valid date clears warnings and accepts a zero price', () => {
  const rows = [{ stcode: '001', qty: 2, price: 12, unit: 'KG' }, { stcode: '', qty: 1 }];
  const missing = applyCatalogPrices(rows, []);
  expect(missing[0]._catalogPriceMissing).toBe(true);
  const restored = applyCatalogPrices(missing, [{ ...catalog[0], price: 0 }]);
  expect(restored[0].price).toBe(0);
  expect(restored[0]._catalogPriceMissing).toBe(false);
  expect(restored[1]).toBe(rows[1]);
});
