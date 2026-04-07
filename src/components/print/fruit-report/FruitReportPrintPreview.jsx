import ReportService from "../../../service/Report.service";
import PurchaseReportPrintPreview from "../purchase-report/PurchaseReportPrintPreview";
import { createPurchaseReportPrintColumns } from "../purchase-report/model";

const reportService = ReportService();

const printColumns = createPurchaseReportPrintColumns({
  quantityTitle: "จำนวนที่สั่ง",
  quantityDataIndex: "qty",
});

export default function FruitReportPrintPreview() {
  return (
    <PurchaseReportPrintPreview
      documentTitle="Fruit Report"
      toolbarTitle="Fruit Report Print Preview"
      reportTitle="รายงานผลไม้"
      reportBadge="Fruit Purchase Report"
      reportSubtitle="เอกสารสรุปรายการผลไม้สำหรับฝ่ายจัดซื้อ"
      emptyDescription="ไม่พบข้อมูลรายงานผลไม้จากเงื่อนไขล่าสุด"
      pageCookieKey="fruit-report"
      fetchReport={(payload, config) => reportService.getFruit(payload, config)}
      printColumns={printColumns}
      quantityDataIndex="qty"
      quantitySummaryLabel="รวมจำนวนที่สั่ง"
      itemSummaryLabel="รวมรายการรายงานผลไม้ทั้งหมด"
    />
  );
}