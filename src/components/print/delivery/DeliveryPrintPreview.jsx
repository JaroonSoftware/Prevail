/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
import "./delivery.css";
import { Authenticate } from "../../../service/Authenticate.service";
// import logo from "../../../assets/images/QRCODEDN.jpg";
import { Button, Flex, Table, Typography, message } from "antd";
import { column } from "./delivery.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
// import { comma } from "../../../utils/util";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import DeliveryService from "../../../service/DeliveryNote.service";

const dnservice = DeliveryService();

export default function DeliveryPrintPreview(props) {
  const { code } = useParams();
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);

  const columnDesc = column;

  const [loading] = useState(false);

  const handleAfterPrint = () => {
    // setNewPageContent([]);
  };
  const handleBeforePrint = (e) => {
    // console.log("before printing...")
  };

  useEffect(() => {
    const init = () => {
      dnservice
        .get(code)
        .then(async (res) => {
          const {
            data: { header, detail },
          } = res;
          console.log(header, detail);

          setHData(header);
          setDetails(detail);
        })
        .catch((err) => {
          console.log(err);
          message.error("Error getting infomation Estimation.");
        });
    };

    init();
    return () => {};
  }, []);
  useEffect(() => {
    const users = authService.getUserInfo();
    setUserInfo(users);

    return () => {};
  }, []);
  const ContentHead = ({ page }) => {
    return (
      <div className="content-head in-sample flex flex-col">
        <div className="print-title flex pb-2">
          <div className="flex ps-3 grow-0" style={{ width: "80%" }}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text
                className="tx-title min-w-80 weight600"
                strong
                style={{ fontSize: 24 }}
              >
                บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
                TEL: 076 641 117, 098 192 9391
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
                เลขประจำตัวผู้เสียภาษี 083556101164 สำนักงานใหญ่
              </Typography.Text>
            </Flex>
          </div>

          <div className="flex ps-3 grow" style={{ float: "right" }}>
            <Flex className="mb-1.5" vertical style={{ paddingLeft: 0 }}>
              <Typography.Text
                className="tx-title min-w-48"
                style={{ textAlign: "right", fontSize: 17 }}
                strong
              >
                ใบส่งสินค้า/ใบแจ้งหนี้
              </Typography.Text>
            </Flex>
          </div>
        </div>
      </div>
    );
  };

  const ContentHead2 = () => {
    return (
      <div className="content-head in-sample flex flex-col">
        <div className="print-title flex pb-2">
          <Flex className="flex ps-3 grow-0" style={{ width: "60%" }}>
            <Flex vertical>
              <Typography.Text className="tx-info">
                ลูกค้า
                <span style={{ paddingLeft: 22 }}>{hData?.cuscode}</span>
              </Typography.Text>
              <Typography.Text className="tx-info">
                <span>
                  {hData?.prename} {hData?.cusname}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                <span>{hData?.address}</span>
              </Typography.Text>
              <Typography.Text className="tx-info">
                <span>
                  <br></br>
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เลขประตัวผู้เสียภาษี
                <span style={{ paddingLeft: 20 }}>{hData?.remark}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                ขนส่งโดย ส่งให้ลูกค้า
                {/* <span style={{ paddingLeft: 20 }}>{hData?.remark}</span> */}
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex className="flex ps-3 grow-0" style={{ width: "40%" }}>
            <Flex vertical>
              <Typography.Text className="tx-info">
                เลขที่
                <span style={{ paddingLeft: 22 }}>{hData?.dncode}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                วันที่
                <span style={{ paddingLeft: 70 }}>
                  {dayjs(hData?.ivdate).format("DD/MM/YYYY")}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                อ้างอิง
                <span style={{ paddingLeft: 20 }}>{hData?.payment}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เครดิต
                <span style={{ paddingLeft: 20 }}>{hData?.payment}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เขตการขาย
                <span style={{ paddingLeft: 20 }}>{hData?.county_name}</span>
              </Typography.Text>
            </Flex>
          </Flex>
        </div>
      </div>
    );
  };

  const ReceiptSummary = (rec) => {
    return (
      <>
        <Table.Summary.Row style={{}}>
          <Table.Summary.Cell
            colSpan={3}
            className="!align-top !ps-0   !pe-0"
            style={{ height: 20 }}
          >
            <Flex
              style={{
                borderTop: "1px dashed",

                // borderRight: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 18, marginLeft: 10 }}
                strong
              >
                ({thaiBahtText(hData?.total_price || 0, 2, 2)}).
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0   !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
                // borderLeft: "1px solid",
                // borderRight: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                รวมเป็นเงิน
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0   !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                {hData?.total_price}
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={8} className="!align-top !ps-0   !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
                padding: 3,
                height: 70,
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{
                  fontSize: 15,
                  paddingLeft: 5,
                  lineHeight: "1em",
                  paddingTop: 7,
                }}
              >
                <p>ได้รับสินค้าตามรายการข้างบนนี้ไว้ถูกต้อง</p>
                <p>
                  Received by/ผู้รับสินค้า _____________________ วันที่
                  ____/____/____
                </p>
              </Typography.Text>
            </Flex>
            <Flex
              style={{
                borderTop: "1px dashed",
                padding: 3,
                height: 70,
              }}
            >
              {" "}
              <Typography.Text
                className="tx-info"
                style={{
                  fontSize: 15,
                  paddingLeft: 5,
                  lineHeight: "1em",
                  paddingTop: 7,
                }}
              >
                <p>
                  พิมพ์โดย
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  วันที่ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  {dayjs(hData?.ivdate).format("DD/MM/YYYY  HH:mm:ss")}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; บันทึกโดย{" "}
                  {userInfo?.firstname} {userInfo?.lastname}
                </p>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  const pageBodyRef = useRef(null);
  const [rowsPerPage, setRowsPerPage] = useState(0);
  const [rowPixel, setRowPixel] = useState(22); // pixel per row (dynamic for empty rows)
  const ROW_HEIGHT = 22; // base px per row (used as fallback)

  useEffect(() => {
    // คำนวณจำนวนแถวที่แสดงได้จากความสูงของ container
    const calc = () => {
      const el = pageBodyRef.current?.querySelector(".ant-table-body");
      const height = el ? el.clientHeight : pageBodyRef.current?.clientHeight;
      if (height && ROW_HEIGHT) {
        const n = Math.floor(height / ROW_HEIGHT) || 1;
        setRowsPerPage(n);
        // คำนวณความสูงแถวจริงเพื่อใช้ขยายแถวว่างให้เต็มพื้นที่
        const pixel = Math.floor(height / n);
        setRowPixel(pixel > 8 ? pixel : ROW_HEIGHT);
      }
    };
    // รันเมื่อ mount และบน resize และเมื่อ details เปลี่ยน
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [details]);

  // เตรียม padded list (ไม่แก้ details ต้นฉบับ)
  const padded = useMemo(() => {
    if (!Array.isArray(details)) return [];
    if (!rowsPerPage || details.length >= rowsPerPage) return details;
    const out = [...details];
    for (let i = out.length; i < rowsPerPage; i++) {
      out.push({ _empty: true, key: `empty-${i}` });
    }
    return out;
  }, [details, rowsPerPage]);

  // map columnDesc เพื่อไม่ให้แสดงข้อมูลและหมายเลขเมื่อเป็นแถวว่าง
  const renderedColumns = useMemo(() => {
    return (columnDesc || []).map((col, colIndex) => {
      const originalRender = col.render;
      return {
        ...col,
        render: (text, record, idx) => {
          if (record && record._empty) return ""; // blank for empty row
          return originalRender ? originalRender(text, record, idx) : text;
        },
      };
    });
  }, [columnDesc]);

  const ContentBody = () => {
    return (
      // ใส่ CSS variable เพื่อกำหนดความสูงแถวว่างแบบไดนามิก
      <div
        className="dnpv-table-wrap"
        ref={pageBodyRef}
        style={{ ["--dnpv-empty-row-height"]: `${rowPixel}px` }}
      >
        <Table
          className="dnpv-table"
          size="small"
          dataSource={padded}
          columns={renderedColumns}
          pagination={false}
          rowKey={(rec) => rec.key || rec.stcode || Math.random()}
          bordered={false}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          onRow={(record, index) => {
            return { className: record._empty ? "dnpv-empty-row" : "r-sub" };
          }}
          summary={ReceiptSummary}
        />
      </div>
    );
  };

  const Pages = ({ pageNum = 1, total = 1 }) => (
    <div ref={componentRef}>
      <ContentData>
        <ContentHead page={`${pageNum} of ${total}`} />
        <ContentHead2 />
        <ContentBody />
      </ContentData>
    </div>
  );

  const ContentData = ({ children, pageNum = 1, total = 1 }) => {
    return (
      <div className="dnpv-pages flex flex-col">
        <div className="print-content">{children}</div>
      </div>
    );
  };

  return (
    <>
      {/* <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24, }} spin />} fullscreen /> */}
      <div className="page-show" id="quo">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="title-preview">
          <Button
            className="bn-center bg-blue-400"
            // onClick={() => { handleCheckMultiPages() }}
            onClick={() => {
              handlePrint(null, () => componentRef.current);
            }}
            icon={<PiPrinterFill style={{ fontSize: "1.1rem" }} />}
          >
            PRINT
          </Button>
        </div>
        <div className="layout-preview">
          <Pages />
        </div>
        {/* <div className='hidden'>
                    <div ref={printRef}>
                        {newPageContent?.map( (page, i) => ( 
                        <div key={i}>
                            <ContentData pageNum={i+1} total={(newPageContent.length)} > 
                                {page?.map( (eml, ind) => (<div key={ind} dangerouslySetInnerHTML={{ __html: eml.outerHTML }} ></div>) )}
                            </ContentData>
                            {i < (newPageContent.length-1) && <div className='page-break'></div>}
                        </div> 
                        ))}
                    </div>
                </div> */}
      </div>
    </>
  );
}
