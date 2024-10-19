/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Modal, Spin,Space,Button } from "antd";
import { Html5QrcodeScanner } from "html5-qrcode";

// import ItemService from "../../service/ItemService";
import OptionService from "../../../service/Options.service";

const opnService = OptionService();
export default function ModalScan({
  show,
  close,
}) {
  const [scanResult, setScanResult] = useState(null);
  const [manualSerialNumber, setManualSerialNumber] = useState("");
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
    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 300,
      },
      fps: 5,
    });

    let isScanning = true;

    scanner.render(success, error);

    function success(result) {
      if (isScanning) {
        scanner.clear();
        setScanResult(result);
        isScanning = false; // Set isScanning to false to stop further scanning
      }
    }

    function error(err) {
      console.warn(err);
    }
  }, []);

  function handleManualSerialNumberChange(event) {
    setManualSerialNumber(event.target.value);
  }

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
          {scanResult ? (
            <div>
              <p>
                Success: <a href={scanResult}>{scanResult}</a>
              </p>
              <p>Serial Number: {scanResult.slice(-16)}</p>
            </div>
          ) : (
            <div>
              <div id="reader"></div>
              {/* <p className="center-text">
                Or enter the serial number manually:
              </p> */}
              <div className="center-input">
                <input
                  type="text"
                  value={manualSerialNumber}
                  onChange={handleManualSerialNumberChange}
                />
                {manualSerialNumber && (
                  <p>Serial Number: {manualSerialNumber.slice(-16)}</p>
                )}
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </>
  );
}
