import ReportService from "../../../service/Report.service";
import PurchaseReportPrintPreview from "../purchase-report/PurchaseReportPrintPreview";
import { createPurchaseReportPrintColumns } from "../purchase-report/model";

const reportService = ReportService();

const printColumns = createPurchaseReportPrintColumns({
  quantityTitle: "จำนวนที่ต้องซื้อ",
  quantityDataIndex: "qty_result",
});

export default function DryReportPrintPreview() {
  return (
    <PurchaseReportPrintPreview
      documentTitle="Dry Goods Report"
      toolbarTitle="Dry Report Print Preview"
      reportTitle="รายงานของแห้ง"
      reportBadge="Dry Goods Purchase Report"
      reportSubtitle="เอกสารสรุปรายการสินค้าที่ต้องซื้อสำหรับฝ่ายจัดซื้อ"
      emptyDescription="ไม่พบข้อมูลรายงานของแห้งจากเงื่อนไขล่าสุด"
      pageCookieKey="dry-report"
      fetchReport={(payload, config) => reportService.getDryGoods(payload, config)}
      printColumns={printColumns}
      quantityDataIndex="qty_result"
      quantitySummaryLabel="รวมจำนวนที่ต้องซื้อ"
      itemSummaryLabel="รวมรายการรายงานของแห้งทั้งหมด"
    />
  );
}