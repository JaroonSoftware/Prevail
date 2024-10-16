import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Home from "../pages/Home";
import Login from "../pages/Login";
import PageNotFound from "../pages/404";
import PrivateRoute from "../components/auth/PrivateRoutes";
import { DashBoard } from "../pages/dashboard";
import { ROLES } from "../constant/constant";
import ShippingRoutes from "../components/auth/ShippingRoutes";
import { HeaderShipping } from "./shipping.router";
import { WarehouseRouter } from "./warehouse.router";
import { DataRouter } from "./data.router";
import { PrintRouter } from "./print.route";
const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />

        <Route
          element={<ShippingRoutes allowdRole={[ROLES.ADMIN, ROLES.USER]} />}
        >
          {HeaderShipping}
        </Route>
        <Route
          element={<PrivateRoute allowdRole={[ROLES.ADMIN, ROLES.USER]} />}
        >
          <Route path="/dashboard" element={<DashBoard />} />
        </Route>

        <Route element={<PrivateRoute allowdRole={[ROLES.ADMIN]} />}>
          {DataRouter}
          {WarehouseRouter}
        </Route>

        <Route
          element={
            <PrivateRoute allowdRole={[ROLES.ADMIN, ROLES.USER]} mode="print" />
          }
        >
          {PrintRouter}
        </Route>

        <Route path="/*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
