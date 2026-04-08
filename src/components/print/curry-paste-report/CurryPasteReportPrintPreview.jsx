import ReportService from "../../../service/Report.service";
import PurchaseReportPrintPreview from "../purchase-report/PurchaseReportPrintPreview";
import { createPurchaseReportPrintColumns } from "../purchase-report/model";

const reportService = ReportService();

const printColumns = createPurchaseReportPrintColumns({
  quantityTitle: "จำนวนที่สั่ง",
  quantityDataIndex: "qty",
});

export default function CurryPasteReportPrintPreview() {
  return (
    <PurchaseReportPrintPreview
      documentTitle="Curry Paste Report"
      toolbarTitle="Curry Paste Report Print Preview"
      reportTitle="รายงานเครื่องแกง"
      reportBadge="Curry Paste Purchase Report"
      reportSubtitle="เอกสารสรุปรายการเครื่องแกงสำหรับฝ่ายจัดซื้อ"
      emptyDescription="ไม่พบข้อมูลรายงานเครื่องแกงจากเงื่อนไขล่าสุด"
      pageCookieKey="curry-paste-report"
      fetchReport={(payload, config) => reportService.getCurry(payload, config)}
      printColumns={printColumns}
      quantityDataIndex="qty"
      quantitySummaryLabel="รวมจำนวนที่สั่ง"
      itemSummaryLabel="รวมรายการรายงานเครื่องแกงทั้งหมด"
    />
  );
}