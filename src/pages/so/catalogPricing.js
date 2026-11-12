// Change prices only on an explicit delivery-date change, never just by opening an order.
export const applyCatalogPrices = (rows, catalog) => {
  const prices = new Map(catalog.map((item) => [String(item.stcode), item]));
  return rows.map((row) => {
    if (!row.stcode) return row;
    const item = prices.get(String(row.stcode));
    // Keep quantities/units and manually entered prices if no compatible price exists.
    if (!item || String(item.unit).trim() !== String(row.unit).trim()) {
      return { ...row, catalog_code: undefined, _catalogPriceMissing: true };
    }
    return {
      ...row,
      price: item.price,
      catalog_code: item.catalog_code,
      // Saved packing snapshots are retained by the server for existing order rows.
      packing_weight: row.code != null ? row.packing_weight : item.packing_weight,
      _catalogPriceMissing: false,
    };
  });
};
