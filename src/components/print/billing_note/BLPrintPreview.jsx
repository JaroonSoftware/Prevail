/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
import "./bl.css";
// import logo from "../../../assets/images/QRCODEDN.jpg";
import { Button, Flex, Table, Typography, message } from "antd";
import { column } from "./bl.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
// import { comma } from "../../../utils/util";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import BillingNoteService from "../../../service/BillingNote.Service";

const blservice = BillingNoteService();

function BLPrintPreview() {
  const { code } = useParams();
  const componentRef = useRef(null);

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
      blservice
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
              <Typography.Text className="tx-info" style={{ fontSize: 15 }}>
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ fontSize: 15 }}>
                TEL: 076 641 117, 098 192 9391
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
                ใบวางบิล
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
                หมายเหตุ
                <span style={{ paddingLeft: 20 }}>{hData?.remark}</span>
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex className="flex ps-3 grow-0" style={{ width: "40%" }}>
            <Flex vertical>
              <Typography.Text className="tx-info">
                เลขที่ใบวางบิล
                <span style={{ paddingLeft: 22 }}>{hData?.ivcode}</span>
              </Typography.Text>
              <Typography.Text className="tx-info">
                <br></br>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                วันที่
                <span style={{ paddingLeft: 70 }}>
                  {dayjs(hData?.ivdate).format("DD/MM/YYYY")}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info">
                <br></br>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                เงื่อนไขการชำระเงิน
                <span style={{ paddingLeft: 20 }}>{hData?.payment}</span>
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
            colSpan={5}
            className="!align-top !ps-0   !pe-0"
            style={{ height: 20 }}
          >
            <Flex
              style={{
                borderTop: "1px solid",
                borderLeft: "1px solid",
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
                borderTop: "1px solid",
                // borderLeft: "1px solid",
                // borderRight: "1px solid",
              }}
            >
              <Typography.Text
                className="tx-info "
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                รวมเงินทั้งสิ้น
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0   !pe-0">
            <Flex
              style={{
                borderTop: "1px solid",
                borderLeft: "1px solid",
                borderRight: "1px solid",
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
                border: "1px solid",
                borderRight: "1px solid",
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
                <p>
                  ชื่อผู้รับวางบิล
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__________________________________
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ในนาม บริษัท
                  พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
                </p>
                <p>
                  พิมพ์โดย
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  วันที่
                </p>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
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
      <div className="ivpv-pages flex flex-col">
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

export default BLPrintPreview;
