import React from "react";
import { Button } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
export const documentRoutes = {
  socode: "/sales-order/view", dncode: "/delivery-note/view",
  blcode: "/billing/view", billing_blcode: "/billing/view", recode: "/receipt/view",
  pocode: "/purchase-order/view", qtcode: "/quotation/view",
  grcode: "/goods-receipt/manage/edit", catalog_code: "/catalog/manage/edit",
};
export default function DocumentLink({ type, code, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const value = code == null ? "" : String(code).trim();
  if (!value || value === "-" || !documentRoutes[type]) return children ?? value;
  return <Button type="link" style={{ padding: 0, height: "auto", whiteSpace: "normal", fontSize: "inherit", fontFamily: "inherit", fontWeight: "inherit", lineHeight: "inherit" }}
    title={"เปิดเอกสาร " + value} onClick={(event) => {
      event.stopPropagation();
      navigate(documentRoutes[type], { state: {
        config: { code: value, action: documentRoutes[type].endsWith("/edit") ? "edit" : "view", title: value },
        documentReturn: { pathname: location.pathname, search: location.search, hash: location.hash },
      } });
    }}>{children ?? value}</Button>;
}
// Remount document pages on each navigation, including two documents on the same route.
export function DocumentPage({ children }) {
  const location = useLocation();
  return React.cloneElement(children, { key: location.key });
}
