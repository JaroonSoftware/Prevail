import React from "react";
import { Route } from "react-router-dom";

import { Users, UsersAccess, UsersManage } from "../pages/users";
import { Items, ItemsAccess, ItemsManage } from "../pages/items";
import { Itemtype, ItemtypeAccess, ItemtypeManage } from "../pages/itemtype";
import { Unit, UnitAccess, UnitManage } from "../pages/unit";
import { Customer, CustomerAccess, CustomerManage } from "../pages/customers";
import { Supplier, SupplierAccess, SupplierManage } from "../pages/supplier";
import { Catalog, CatalogAccess ,CatalogManage } from "../pages/catalog";

export const DataRouter = (
  <>
    <Route path="/users/" exact element={<Users />}>
      <Route index element={<UsersAccess />} />
      <Route path="manage/:action" element={<UsersManage />} />
    </Route>

    <Route path="/items/" exact element={<Items />}>
      <Route index element={<ItemsAccess />} />
      <Route path="manage/:action" element={<ItemsManage />} />
    </Route>

    <Route path="/itemtype/" exact element={<Itemtype />}>
      <Route index element={<ItemtypeAccess />} />
      <Route path="manage/:action" element={<ItemtypeManage />} />
    </Route>

    <Route path="/unit/" exact element={<Unit />}>
      <Route index element={<UnitAccess />} />
      <Route path="manage/:action" element={<UnitManage />} />
    </Route>

    <Route path="/customers/" exact element={<Customer />}>
      <Route index element={<CustomerAccess />} />
      <Route path="manage/:action" element={<CustomerManage />} />
    </Route>

    <Route path="/supplier/" exact element={<Supplier />}>
      <Route index element={<SupplierAccess />} />
      <Route path="manage/:action" element={<SupplierManage />} />
    </Route>
    
    <Route path="/catalog/" exact element={<Catalog />}>
      <Route index element={<CatalogAccess />} />
      <Route path="manage/:action" element={<CatalogManage />} />
    </Route>
  </>
);
