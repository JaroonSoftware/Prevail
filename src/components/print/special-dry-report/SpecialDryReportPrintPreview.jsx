import ReportService from "../../../service/Report.service";
import PurchaseReportPrintPreview from "../purchase-report/PurchaseReportPrintPreview";
import { createPurchaseReportPrintColumns } from "../purchase-report/model";

const reportService = ReportService();

const printColumns = createPurchaseReportPrintColumns({
  quantityTitle: "จำนวนที่สั่ง",
  quantityDataIndex: "qty",
});

export default function SpecialDryReportPrintPreview() {
  return (
    <PurchaseReportPrintPreview
      documentTitle="Special Dry Report"
      toolbarTitle="Special Dry Report Print Preview"
      reportTitle="รายงานของแห้งพิเศษ"
      reportBadge="Special Dry Goods Purchase Report"
      reportSubtitle="เอกสารสรุปรายการของแห้งพิเศษสำหรับฝ่ายจัดซื้อ"
      emptyDescription="ไม่พบข้อมูลรายงานของแห้งพิเศษจากเงื่อนไขล่าสุด"
      pageCookieKey="special-dry-report"
      fetchReport={(payload, config) => reportService.getSpecialDry(payload, config)}
      printColumns={printColumns}
      quantityDataIndex="qty"
      quantitySummaryLabel="รวมจำนวนที่สั่ง"
      itemSummaryLabel="รวมรายการรายงานของแห้งพิเศษทั้งหมด"
    />
  );
}