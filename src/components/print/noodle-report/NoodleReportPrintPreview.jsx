import ReportService from "../../../service/Report.service";
import PurchaseReportPrintPreview from "../purchase-report/PurchaseReportPrintPreview";
import { createPurchaseReportPrintColumns } from "../purchase-report/model";

const reportService = ReportService();

const printColumns = createPurchaseReportPrintColumns({
  quantityTitle: "จำนวนที่สั่ง",
  quantityDataIndex: "qty",
});

export default function NoodleReportPrintPreview() {
  return (
    <PurchaseReportPrintPreview
      documentTitle="Noodle Report"
      toolbarTitle="Noodle Report Print Preview"
      reportTitle="รายงานเส้น เต้าหู้"
      reportBadge="Noodle and Tofu Purchase Report"
      reportSubtitle="เอกสารสรุปรายการเส้นและเต้าหู้ สำหรับฝ่ายจัดซื้อ"
      emptyDescription="ไม่พบข้อมูลรายงานเส้นจากเงื่อนไขล่าสุด"
      pageCookieKey="noodle-report"
      fetchReport={(payload, config) => reportService.getNoodle(payload, config)}
      printColumns={printColumns}
      quantityDataIndex="qty"
      quantitySummaryLabel="รวมจำนวนที่สั่ง"
      itemSummaryLabel="รวมรายการรายงานเส้นทั้งหมด"
    />
  );
}