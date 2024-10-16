import React from "react";
import { Route } from "react-router-dom";
import {
  Shipping,
  ShippingAccess,
} from "../pages/shipping";

export const HeaderShipping = (
  <>
    <Route path="/shipping/" exact element={<Shipping />}>
      <Route index element={<ShippingAccess />} />
    </Route>
  </>
);
