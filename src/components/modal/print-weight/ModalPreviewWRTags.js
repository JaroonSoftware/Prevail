import React from "react";
import { Modal, Button, message } from "antd";
import { PrinterFilled } from "@ant-design/icons";
import DocWRTag from "../../report/packing/DocWRTag";
import PackageService from "../../../service/Package.service";
import { useReactToPrint } from "react-to-print";

export default function ModalPreviewWRTags({ show, close, printRef, printData,isReprint,reFetchAfterPrint }) {
// const ModalPreviewWRTags = ({
//   isOpen,
//   handleClose,
//   // printRef,
//   // printData,
//   // isReprint,
//   // reFetchAfterPrint,
// }) => {
  const handlePrint = () => {
    // if (isReprint) {
       printProcess();
    // } else {
    //   PackageService.printAddTagsDate(printData)
    //     .then(() => {
    //       message.success("Process on going!");
    //       printProcess();
    //       reFetchAfterPrint();
    //     })
    //     .catch(() => message.error("Something went wrong !"));
    // }
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
      <DocWRTag ref={printRef} printData={printData} />
    </Modal>
  </>
);
}

