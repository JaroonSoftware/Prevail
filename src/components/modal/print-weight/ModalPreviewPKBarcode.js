import React, { useEffect, useState } from "react";
import {
  Modal,
  Button,
  InputNumber,
  Space,
  Typography,
  Tooltip,
  Segmented,
} from "antd";
import { PrinterFilled, ReloadOutlined } from "@ant-design/icons";
import FormPKBarcode, {
  PK_LABEL_STYLE,
  getPageSize,
} from "./FormPKBarcode";
import { useReactToPrint } from "react-to-print";

/** อัตราย่อ "เฉพาะตอนดูบนจอ" — ปรับตัวเลขนี้ถ้าอยากให้ preview เล็ก/ใหญ่กว่านี้
 *  ไม่กระทบงานปริ้นจริง เพราะอยู่บน element ที่ครอบ #pk-print-root อีกที
 *  ซึ่ง react-to-print ไม่ได้โคลนไปด้วย */
const PREVIEW_SCALE = 0.55;

/** คีย์เก็บค่าชดเชยตำแหน่งพิมพ์ ตั้งครั้งเดียวแล้วจำไว้ในเครื่องนี้ตลอด */
const OFFSET_KEY = "pk-label-print-offset";

const loadOffset = () => {
  try {
    const raw = localStorage.getItem(OFFSET_KEY);
    if (!raw) return { x: 0, y: 0, r: 0 };
    const v = JSON.parse(raw);
    return {
      x: Number(v?.x) || 0,
      y: Number(v?.y) || 0,
      r: Number(v?.r) === 90 ? 90 : 0,
    };
  } catch {
    return { x: 0, y: 0, r: 0 };
  }
};

export default function ModalPreviewPKBarcode({ show, close, printRef, printData }) {
  const [offset, setOffset] = useState(loadOffset);

  /* จำค่าไว้ ครั้งหน้าเปิดมาก็ใช้ค่าเดิมเลย ไม่ต้องตั้งใหม่ */
  useEffect(() => {
    try {
      localStorage.setItem(OFFSET_KEY, JSON.stringify(offset));
    } catch {
      /* โหมดไม่ให้เขียน storage ก็ปล่อยผ่าน ใช้ค่าในหน่วยความจำแทน */
    }
  }, [offset]);

  const handlePrint = () => {
       printProcess();
  };

  const printProcess = useReactToPrint({
    content: () => printRef.current,
    /* ห้ามก๊อป stylesheet ของแอปเข้า iframe:
       ในโปรเจกต์มี @page { size: A4 } อยู่หลายไฟล์ (bl.css ใส่ !important ด้วย)
       ถ้าปล่อยให้ก๊อปมา A4 จะทับ @page ของฉลาก แล้วได้กระดาษ A4 ที่มีฉลาก
       อยู่มุมบนซ้ายกับพื้นที่ขาวยาวๆ ข้างล่าง
       ดีไซน์ฉลากใช้แค่คลาสใน PK_LABEL_STYLE จึงไม่ต้องพึ่ง CSS ของแอป */
    copyStyles: false,
    /* pageStyle มีแค่ @page + CSS ชุดเดียวกับ preview
       ห้ามเพิ่มกฎ override ที่นี่ ไม่งั้น preview จะไม่ตรงกับงานปริ้นจริง */
    pageStyle: `
      /* ห้ามใส่ !important ใน @page เด็ดขาด
         สเปก CSS ไม่อนุญาตให้ใช้กับ descriptor ใน @page
         Chrome จะทิ้งทั้งบรรทัดแล้วตกกลับไปใช้กระดาษเริ่มต้น (แนวตั้ง)
         ทำให้ฉลากแนวนอนโดนตัดด้านขวาหาย
         กัน @page อื่นมาทับด้วย copyStyles: false แทน */
      @page {
        size: ${getPageSize(offset.r).w}mm ${getPageSize(offset.r).h}mm;
        margin: 0;
      }
      html, body { margin: 0; padding: 0; }
      #pk-print-root { margin: 0; padding: 0; }
      ${PK_LABEL_STYLE}
    `,
  });

return (
  <>
    <Modal
      title={
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span>Preview</span>
      <Button
          icon={<PrinterFilled />}
          size="large"
          className="button-primary"
          onClick={handlePrint}
          style={{ marginRight: 30}}
        >
          พิมพ์
        </Button>
    </div>
  }
      width={800}
      /* ดันขึ้นไปชิดบน จะได้พื้นที่แนวตั้งเยอะที่สุด */
      style={{ top: 20 }}
      styles={{
        body: {
          minHeight: "72vh",
          maxHeight: "80vh",
          overflowY: "auto",
        },
      }}
      open={show}
      onCancel={close}
      destroyOnClose={true}
      maskClosable={false}
      footer={
        <Button
          icon={<PrinterFilled />}
          size="large"
          className="button-primary"
          onClick={handlePrint}
        >
          พิมพ์
        </Button>
      }
    >
      <style>{`
        .pk-preview-scale {
          zoom: ${PREVIEW_SCALE};
          display: flex;
          justify-content: center;
        }
        /* เผื่อเบราว์เซอร์ที่ไม่รองรับ zoom ให้ย่อด้วย transform แทน */
        @supports not (zoom: 1) {
          .pk-preview-scale {
            zoom: normal;
            transform: scale(${PREVIEW_SCALE});
            transform-origin: top center;
          }
        }
      `}</style>
      {/* แผงปรับตำแหน่งพิมพ์ อยู่นอก #pk-print-root จึงไม่ติดไปกับงานพิมพ์ */}
      <div
        style={{
          background: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: 6,
          padding: "8px 12px",
          marginBottom: 12,
        }}
      >
        <Space size="middle" wrap align="center">
          <Typography.Text strong>ปรับตำแหน่งพิมพ์</Typography.Text>

          <Space size={4}>
            <Typography.Text type="secondary">แนวนอน</Typography.Text>
            <Tooltip title="ค่าบวก = เลื่อนไปทางขวา, ค่าลบ = เลื่อนไปทางซ้าย">
              <InputNumber
                size="small"
                step={0.5}
                precision={1}
                style={{ width: 90 }}
                addonAfter="mm"
                value={offset.x}
                onChange={(v) => setOffset((s) => ({ ...s, x: Number(v) || 0 }))}
              />
            </Tooltip>
          </Space>

          <Space size={4}>
            <Typography.Text type="secondary">แนวตั้ง</Typography.Text>
            <Tooltip title="ค่าบวก = เลื่อนลง, ค่าลบ = เลื่อนขึ้น">
              <InputNumber
                size="small"
                step={0.5}
                precision={1}
                style={{ width: 90 }}
                addonAfter="mm"
                value={offset.y}
                onChange={(v) => setOffset((s) => ({ ...s, y: Number(v) || 0 }))}
              />
            </Tooltip>
          </Space>

          <Space size={4}>
            <Typography.Text type="secondary">หมุนฟอร์ม</Typography.Text>
            <Tooltip title="หมุนทั้งใบ พร้อมสลับด้านหน้ากระดาษให้อัตโนมัติ">
              <Segmented
                size="small"
                value={offset.r}
                onChange={(v) => setOffset((s) => ({ ...s, r: Number(v) }))}
                options={[
                  { label: "แนวนอน 0°", value: 0 },
                  { label: "แนวตั้ง 90°", value: 90 },
                ]}
              />
            </Tooltip>
          </Space>

          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => setOffset({ x: 0, y: 0, r: 0 })}
          >
            รีเซ็ต
          </Button>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            ตั้งครั้งเดียว ระบบจำให้เลย
          </Typography.Text>
        </Space>
      </div>

      <div className="pk-preview-scale">
        <FormPKBarcode
          ref={printRef}
          printData={printData}
          offsetX={offset.x}
          offsetY={offset.y}
          rotate={offset.r}
        />
      </div>
    </Modal>
  </>
);
}

