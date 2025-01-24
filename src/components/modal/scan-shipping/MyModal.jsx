/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Modal, Spin,Space,Button } from "antd";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

// import ItemService from "../../service/ItemService";
import OptionService from "../../../service/Options.service";

const opnService = OptionService();
export default function ModalScan({
  show,
  close,
  values
}) {
  const [loading, setLoading] = useState(true);
  /** handle logic component */
  const handleClose = () => {
    setTimeout(() => {
      close(false);
    }, 140);

    //setTimeout( () => close(false), 200 );
  };

  useEffect(() => {
    setTimeout( () => setLoading(false), 500 );
  }, []);

  /** setting child component */
  const ButtonModal = (
    <Space direction="horizontal" size="middle">
      <Button onClick={() => handleClose()}>ปิด</Button>
      {/* <Button type="primary" onClick={() => handleConfirm()}>
        ยืนยันการเลือกสินค้า
      </Button> */}
    </Space>
  );

  return (
    <>
      <Modal
        open={show}
        title="QR Scanning Code"
        onCancel={() => handleClose()}
        footer={ButtonModal}
        maskClosable={false}
        style={{ top: 20 }}
        width={"100%"}
      >
        <Spin spinning={loading}>
        <BarcodeScannerComponent
        width={500}
        height={500}
        onUpdate={(err, result) => {
          if (result)
            {
              values(result.text)
              handleClose(false)
            } 
        }}
      />
        </Spin>
      </Modal>
    </>
  );
}
