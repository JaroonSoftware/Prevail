import Quotation from "./MyPage";
import QuotationAccess from "./MyAccess";
import QuotationManage from "./MyManage";
import UIOrder from "./../soft-order/MyOrder";

export { 
    Quotation,
    QuotationAccess,
    QuotationManage
}

export const QuotationOrder = () => <UIOrder source="quotation" />;