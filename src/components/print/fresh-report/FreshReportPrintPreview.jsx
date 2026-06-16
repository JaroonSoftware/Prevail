import ReportService from "../../../service/Report.service";
import PurchaseReportPrintPreview from "../purchase-report/PurchaseReportPrintPreview";
import { createPurchaseReportPrintColumns } from "../purchase-report/model";

const reportService = ReportService();

const printColumns = createPurchaseReportPrintColumns({
  quantityTitle: "จำนวนที่สั่ง",
  quantityDataIndex: "qty",
});

export default function FreshReportPrintPreview() {
  return (
    <PurchaseReportPrintPreview
      documentTitle="Fresh Report"
      toolbarTitle="Fresh Report Print Preview"
      reportTitle="รายงานของสด"
      reportBadge="Fresh Goods Purchase Report"
      reportSubtitle="เอกสารสรุปรายการของสด สำหรับฝ่ายจัดซื้อ"
      emptyDescription="ไม่พบข้อมูลรายงานของสดจากเงื่อนไขล่าสุด"
      pageCookieKey="fresh-report"
      fetchReport={(payload, config) => reportService.getFresh(payload, config)}
      printColumns={printColumns}
      quantityDataIndex="qty"
      quantitySummaryLabel="รวมจำนวนที่สั่ง"
      itemSummaryLabel="รวมรายการรายงานของสดทั้งหมด"
    />
  );
}
