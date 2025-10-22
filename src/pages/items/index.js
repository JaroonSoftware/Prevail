import Items from "./MyPage";
import ItemsAccess from "./MyAccess";
import ItemsManage from "./MyManage";
import UIOrder from "./../soft-order/MyOrder";

export { Items, ItemsAccess, ItemsManage };

export const ItemsOrder = () => <UIOrder source="items" />;