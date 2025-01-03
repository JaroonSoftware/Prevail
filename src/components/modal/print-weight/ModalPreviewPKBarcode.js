import React from "react";
import { Modal, Button } from "antd";
import { PrinterFilled } from "@ant-design/icons";
import FormPKBarcode from "./FormPKBarcode";
import { useReactToPrint } from "react-to-print";

export default function ModalPreviewPKBarcode({ show, close, printRef, printData }) {
  const handlePrint = () => {
       printProcess();
  };

  const printProcess = useReactToPrint({
    content: () => printRef.current,
  });

return (
  <>
    <Modal
      title="Preview"
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

