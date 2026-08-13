import React from "react";
import { Modal, Button } from "antd";
import { PrinterFilled } from "@ant-design/icons";
import FormPKBarcode, { PK_LABEL_STYLE } from "./FormPKBarcode";
import { useReactToPrint } from "react-to-print";

export default function ModalPreviewPKBarcode({ show, close, printRef, printData }) {
  const handlePrint = () => {
       printProcess();
  };

  const printProcess = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page {
        size: 100mm 50mm;
        margin: 0;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
      }
      #pk-print-root {
        display: block !important;
        width: 100mm;
        margin: 0;
        padding: 0;
      }
      ${PK_LABEL_STYLE}
      .pk-label { box-shadow: none !important; }
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
      <FormPKBarcode ref={printRef} printData={printData} />
    </Modal>
  </>
);
}

