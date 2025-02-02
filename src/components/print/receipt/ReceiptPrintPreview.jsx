/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
import "./receipt.css";
import { Authenticate } from "../../../service/Authenticate.service";
// import logo from "../../../assets/images/QRCODEDN.jpg";
import { Button, Flex, Table, Typography, message, Row, Col } from "antd";
import { column } from "./receipt.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
// import { comma } from "../../../utils/util";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import ReceiptService from "../../../service/Receipt.service";

const reservice = ReceiptService();

function ReceiptPrintPreview() {
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
      reservice
        .get(code)
        .then(async (res) => {
          const {
            data: { header, detail },
          } = res.data;

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
      <Flex vertical style={{ textAlign: "center" }}>
        <Typography.Text
          className="tx-title"
          strong
          style={{ fontSize: 24, paddingTop: "40px", paddingBottom: "30px" }}
        >
          ใบเสร็จรับเงิน
        </Typography.Text>
        <Typography.Text className="tx-title " strong style={{ fontSize: 16 }}>
          บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
        </Typography.Text>
        <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
          62/2 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
        </Typography.Text>
        <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
          โทร. 076-214346 แฟกซ์ : 076-214347
        </Typography.Text>
        <Typography.Text className="tx-info" style={{ fontSize: 14 }}>
          เลขประจำตัวผู้เสียภาษี : 0833556001953
        </Typography.Text>
        <Typography.Text
          className="tx-info"
          style={{ fontSize: 14, paddingTop: "20px", marginLeft: "100px" }}
        >
          วันที่ {dayjs(hData?.redate).format("DD/MM/YYYY")}
        </Typography.Text>
        <br></br>
      </Flex>
    );
  };

  const ContentHead2 = () => {
    return (
      <div className="print-title">
        <Flex className="flex ps-3 grow-0" style={{ width: "60%" }}>
          <Flex vertical>
            <Typography.Text className="tx-info" style={{ fontSize: "15px" }}>
              ได้รับเงินจาก ( Recived form ) :
              <span style={{ paddingLeft: 22 }}>
                {hData?.cuscode} {hData?.prename} {hData?.cusname}
              </span>
            </Typography.Text>
            <Typography.Text className="tx-info" style={{ height: 21 }}>
              <span></span>
            </Typography.Text>
            <Typography.Text className="tx-info">
              <span>
                <br></br>
              </span>
            </Typography.Text>
          </Flex>
        </Flex>
      </div>
    );
  };

  const ReceiptSummary = (rec) => {
    return (
      <>
        <Table.Summary.Row style={{}}>
          <Table.Summary.Cell
            colSpan={1}
            className="!align-top !ps-0   !pe-0"
            style={{ height: 20 }}
          >
            <Flex
              style={{
                borderTop: "1px solid",
                borderLeft: "1px solid",
                borderBottom: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 18, marginLeft: 10, marginTop: 4 }}
                strong
              >
                ({thaiBahtText(hData?.total_price || 0, 2, 2)}).
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0   !pe-0">
            <Flex
              style={{
                borderTop: "1px solid",
                borderLeft: "1px solid",
                borderRight: "1px solid",
                borderBottom: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 18, marginLeft: 10, marginTop: 4 }}
                strong
              >
                {hData?.total_price}
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Row style={{ paddingTop: 50, paddingLeft: 50 }}>
          <Col className="!align-top" style={{ height: 20, width: 40 }}>
            <Flex
              style={{
                borderTop: "1px solid",
                borderLeft: "1px solid",
                borderRight: "1px solid",
                borderBottom: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 18, marginLeft: 10, marginTop: 4 }}
                strong
              >
                <br></br>
              </Typography.Text>
            </Flex>
          </Col>
          <Col
            className="!align-top"
            style={{ height: 20, width: 40, paddingLeft: 15, paddingTop: 5 }}
          >
            เงินสด
          </Col>
          
          <Col style={{ height: 20, width: 40 ,marginLeft: 40}}>
            <Flex
              style={{
                borderTop: "1px solid",
                borderLeft: "1px solid",
                borderRight: "1px solid",
                borderBottom: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 18, marginLeft: 10, marginTop: 4 }}
                strong
              >
                <br></br>
              </Typography.Text>
            </Flex>
          </Col>
          <Col
            style={{ height: 20, paddingLeft: 15, paddingTop: 5 }}
          >
            เลขที่เช็ค : ............. ธนาคาร : ..............
          </Col>
        </Row>
        <Row style={{ paddingTop: 50, paddingLeft: 50 }}>
          
          <Col
            style={{ height: 20, paddingLeft: 200, paddingTop: 5 }}
          >
         เช็คลงวันที่ : ........................................
          </Col>
        </Row>
        <Row style={{ paddingTop: 50, paddingLeft: 50 }}>
          
          <Col
            style={{ height: 20, paddingLeft: 320, paddingTop: 30 }}
          >
          .............................................<br></br>
          ผู้รับเงิน / Cash Collector
          </Col>
        </Row>
      </>
    );
  };

  const ContentBody = () => {
    return (
      <div>
        <Table
          size="small"
          dataSource={details}
          columns={columnDesc}
          pagination={false}
          rowKey="stcode"
          bordered={false}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          onRow={(record, index) => {
            return { className: "r-sub" };
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
      <div className="repv-pages flex flex-col">
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
            className="bn-center  bg-blue-400"
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

export default ReceiptPrintPreview;
