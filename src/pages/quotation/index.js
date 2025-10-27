import Quotation from "./MyPage";
import QuotationAccess from "./MyAccess";
import QuotationManage from "./MyManage";
import UIOrder from "./../soft-order/MyOrder";
import QuotationView from "./MyPageView";

export { 
    Quotation,
    QuotationAccess,
    QuotationManage,
    QuotationView
}

export const QuotationOrder = () => <UIOrder source="quotation" />;