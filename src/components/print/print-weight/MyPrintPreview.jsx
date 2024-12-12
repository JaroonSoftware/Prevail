/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
import thaiBahtText from "thai-baht-text";
import "./MyPrint.css";
import logo from "../../../assets/images/logo.png";
// import QRCode from "../../../assets/images/QRCode.jpg";
import IVService from "../../../service/Invoice.service";
import {
  Button,
  Card,
  Flex,
  Table,
  Typography,
  message,
  Space,
  Spin,
  Row,
  Col,
} from "antd";
import { column } from "./model";

import dayjs from "dayjs";
// import { comma } from '../../../utils/util';
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { comma } from "../../../utils/util";

const ivservice = IVService();

function DelPrintPreview() {
  const { code } = useParams();
  const componentRef = useRef(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);

  const [newPageContent, setNewPageContent] = useState([]);
  const columnDesc = column;

  const [loading, setLoading] = useState(false);

  const handleAfterPrint = () => {
    setNewPageContent([]);
  };
  const handleBeforePrint = (e) => {
    console.log("before printing...");
  };

  const handleCheckMultiPages = async () => {
    const limitPage = 550;
    return new Promise((r) => {
      // const head = document.querySelector("#raw .in-head");
      const data = document.querySelector("#raw .in-data");
      const table = document.querySelector("#raw .in-data #tb-data");
      // const thead = table?.querySelector("thead");
      const mtbody = table?.querySelector("tbody");
      // const mtfoot = table?.querySelector("tfoot");
      const row = mtbody?.querySelectorAll("tr");

      const samplesPage = [];
      // console.log(mtfoot);
      // console.log(componentRef.current);
      // let pageCount = 1;
      let hPageCheck = 0;
      let emlContent = [];
      for (let elm of row) {
        const h = Number(
          window
            .getComputedStyle(elm)
            .getPropertyValue("height")
            ?.replace("px", "")
        );
        if (hPageCheck + h > limitPage) {
          // console.log( { hPageCheck } );
          samplesPage.push([...emlContent, elm]);
          emlContent = [];
          hPageCheck = 0;
        } else {
          hPageCheck += h;
          emlContent = [...emlContent, elm];
        }

        // console.log( h, hPageCheck );
      }
      if (emlContent.length > 0) samplesPage.push(emlContent);

      // const hfoot = Number(window.getComputedStyle(mtfoot).getPropertyValue('height')?.replace("px", ""));
      const pages = [];
      for (let rind in samplesPage) {
        // const chead = head.cloneNode(true);
        const cdata = data.cloneNode(true);
        const table = cdata.querySelector("#tb-data");
        // const thead = table?.querySelector("thead");
        const tbody = table?.querySelector("tbody");
        const tfoot = table?.querySelector("tfoot");

        // tbody.style.height = `${limitPage - hfoot}px`;

        tbody.innerHTML = `${samplesPage[rind]
          .map((m) => m.outerHTML)
          .join("")}`;

        if (rind < samplesPage.length - 1) tfoot.remove();
        // else {
        //     tbody.innerHTML = `${tbody.innerHTML}<tr><td colspan='6' style="height:100%">&nbsp;</td></tr>`;
        // }
        const temp = document.createElement("div");

        // temp.appendChild( chead );
        temp.appendChild(cdata);
        temp.classList.add("on-page");
        pages.push(temp);
      }
      // console.log( pages );
      setNewPageContent((state) => [...state, ...pages]);
      r(pages);
    });
  };
  const handlePrintMultiPages = () => {
    setLoading(true);
    handleCheckMultiPages().then((res) => {
      handlePrint(null, () => printRef.current);
      setLoading(false);
    });
  };

  useEffect(() => {
    const init = () => {
      ivservice
        .get(code)
        .then(async (res) => {
          const { header, detail } = res.data.data;

          setHData(header);
          setDetails(detail);
        })
        .catch((err) => {
          console.log(err);
          message.error("Error getting Quotation.");
        });
    };

    init();
    return () => {};
  }, []);

  const HeaderForm = ({ ...resProps }) => {
    return (
      <>
        <div className="print-head" style={{ height: 90 }}>
          <div className="print-title">
            <ContentHead {...resProps} />
          </div>
        </div>
        <ContentHead2 {...resProps} />
      </>
    );
  };

  const FooterForm = ({ page }) => {
    return (
      <div className="print-foot" style={{ height: 34 }}>
        <div className="print-title flex justify-end">
          <Flex className="mb-0">
            <Typography.Text className="text-sm min-w-8">Page</Typography.Text>
            <Typography.Text className="text-sm" strong>
              {page}
            </Typography.Text>
          </Flex>
        </div>
      </div>
    );
  };

  const ReceiptSummary = () => {
    return (
      <>
        <Table.Summary.Row className="r-sum">
          <Table.Summary.Cell
            colSpan={2}
            className="!align-top border-left-ontable"
            // style={{borderBottom: "1px solid"}}
          >
            <Flex vertical gap={12}>
              <Flex vertical gap={2}>
                <Typography.Text
                  className="tx-info"
                  style={{ display: "block", fontSize: 14, paddingTop: 15 }}
                >
                  กำหนดชำระเงิน/Payment Term :
                </Typography.Text>
              </Flex>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={2} className="text-start !align-top">
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14, paddingTop: 17  }}
            >
              ชำระเงินเต็มจำนวน ณ วันที่ส่งมอบสินค้า
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell
            colSpan={1}
            className="text-summary text-start !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14, paddingTop: 8, textAlign: "center"  }}
            >
              รวมเป็นเงิน/Sub Total
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell className="text-summary text-end !align-top">
            <Typography.Text
              className="text-sm text-end"
              style={{ display: "block", fontSize: 14, paddingTop: 10 }}
            >
              {comma(Number(hData?.total_price || 0), 2, 2)}
            </Typography.Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="r-sum">
          <Table.Summary.Cell
            colSpan={2}
            className="border-left-ontable text-start !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14 }}
            ></Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={2} className=" text-start !align-top">
            <Typography.Text className="text-sm" style={{ display: "block" }}>
              <span style={{ fontSize: 15 }}> ธนาคาร</span>
              <span style={{ color: "blue", fontSize: 17 }}> กสิกรไทย </span>
              <span style={{ fontSize: 15 }}> ชื่อบัญชี</span>
              <span style={{ color: "blue", fontSize: 17 }}>
                {" "}
                น.ส.ปิยรัตน์ ลอยสุวงศ์{" "}
              </span>
              <span style={{ fontSize: 15 }}> เลขบัญชีที่</span>
              <span style={{ color: "blue", fontSize: 17 }}>
                {" "}
                475 282 365 8{" "}
              </span>
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell
            colSpan={1}
            className="text-summary text-start !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14, textAlign: "center" }}
            >
              ภาษี/Vat
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell className="text-summary text-end !align-top">
            <Typography.Text
              className="text-sm text-end"
              style={{ display: "block", fontSize: 14 }}
            >
              {comma(Number((hData?.vat * hData?.total_price) / 100 || 0))}
            </Typography.Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="r-sum">
          <Table.Summary.Cell
            colSpan={2}
            className="border-left-ontable border-bottom-ontable  text-start !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14 }}
            >
              กำหนดส่งของ/Delivery Term :
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell
            colSpan={2}
            className="border-bottom-ontable text-start !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block" }}
            >{dayjs(hData?.deldate).format("DD/MM/YYYY")}</Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell
            rowSpan={2}
            className="text-summary text-start !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{
                display: "block",
                fontSize: 14,
                textAlign: "center",
                paddingTop: 5,
              }}
            >
              จำนวนเงินรวมทั้งสิ้น / Total
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell
            rowSpan={2}
            className="text-summary text-end !align-top"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14, paddingTop: 15 }}
            >
              {
              comma(
                Number((hData?.vat * hData?.total_price) / 100) +
                  Number(hData?.total_price),
                2,
                2
              )}
            </Typography.Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="r-sum">
          <Table.Summary.Cell
            colSpan={4}
            className="text-summary1 !align-top text-center !ps-0 !pt-1"
          >
            <Typography.Text
              className="text-sm"
              style={{ display: "block", fontSize: 14 }}
            >
              (
              {thaiBahtText(
                Number((hData?.vat * hData?.total_price) / 100) +
                  Number(hData?.total_price)
              )}
              )
            </Typography.Text>
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={2} className="!align-top">
            {"\u00A0"}
          </Table.Summary.Cell>
        </Table.Summary.Row>

        <Table.Summary.Row>
          <Table.Summary.Cell colSpan={8} className="!align-top !ps-0 !pt-8">
            <Flex className="w-full" gap={32} justify={"center"}>
            <Flex vertical className="w-1/3" style={{ gap: 10 }}>
            <Flex className="mb-1.5" vertical>
                <div className="grow pb-2">
                  {/* <img
                    src={QRCode}
                    alt=""
                    style={{
                      width: "180px",
                      float: "center",
                      marginLeft: "5px",
                      position: "absolute",
                      borderRadius: 8,
                    }}
                  /> */}
                </div>
              </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text
                    className="tx-info"
                    align="center"
                    strong
                    style={{ minWidth: 48 }}
                  ></Typography.Text>
                  <Typography.Text className="tx-info">
                    {"\u00A0"}
                  </Typography.Text>
                </Flex>
              </Flex>
              <Flex vertical className="w-2/3" style={{ gap: 10 , paddingLeft: 20}}>
                <Flex gap={2} justify="center" style={{paddingTop: 115}}>
                  <Typography.Text className="tx-info text-center" strong>
               ................................................................
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text className="tx-info text-center" strong>
                 ลูกค้าผู้รับสินค้า / Customer
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text className="tx-info text-center" strong style={{fontSize: 11, paddingTop: 40}}>
                วันที่ / Date.................................................................
                  </Typography.Text>
                </Flex>
              </Flex>
              <Flex vertical className="w-3/3" style={{ gap: 10 }}>
                <Flex gap={2} justify="center">
                  <Typography.Text
                    className="tx-info text-center"
                    strong
                    style={{ minWidth: 48 }}
                  >
                    {/* ได้รับการชำระเงินโดย */}
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text
                    className="tx-info text-center"
                    strong
                    style={{ minWidth: 48 }}
                  >
                    {/* ได้รับการชำระเงินโดย */}
                  </Typography.Text>
                </Flex>
                <Flex gap={3} justify="center">
                  <Typography.Text className="tx-info text-center" strong>
                   {/* <span>ใบเสร็จนี้จะสมบูรณ์ต่อเมื่อมีรายมือชื่อผู้รับเงินและผู้มีอำนาจลงนามแทน
                    บจก.<br></br>
                    และกรณีรับเงินเป็นเช็คจะต้องเรียกเก็บเงินจากธนาคารครบถ้วนถูกต้องแล้ว</span>  */}
                  </Typography.Text>
                </Flex>
              </Flex>
              <Flex vertical className="w-2/3" style={{ gap: 10 }}>
                <Flex gap={2} justify="center">
                  <Typography.Text
                    className="tx-info text-center"
                    strong
                    style={{ minWidth: 48 }}
                  >
                    ในนามบริษัท เอ.ไอ.โซลูชั่นเซอร์วิส จำกัด
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text className="tx-info text-center" strong>
                    For A.I. Solution Service Co.,Ltd.
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center" style={{paddingTop: 50}}>
                  <Typography.Text className="tx-info text-center" strong>
                __________________________________________
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text className="tx-info text-center" strong>
                 ลายเซ็นต์ผู้มีอำนาจลงนาม
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text className="tx-info text-center" strong>
                 Tel. 0802660934
                  </Typography.Text>
                </Flex>
                <Flex gap={2} justify="center">
                  <Typography.Text className="tx-info text-center" strong>
                  {dayjs(hData?.redate).format("DD/MM/YYYY")}
                  </Typography.Text>
                </Flex>
              </Flex>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };
  const ContentHead = () => {
    return (
      <div className="content-head in-sample flex flex-col">
        <div className="print-title">
          <Row>
            <Col span={6}>
              <Flex className="mb-1.5" vertical>
                <div className="grow pb-2">
                  <img
                    src={logo}
                    alt=""
                    style={{
                      width: "100%",
                      float: "left",
                      marginLeft: "-15px",
                      position: "absolute",
                    }}
                  />
                </div>
              </Flex>
            </Col>
            <Col span={12}>
              <Flex className="mb-0" vertical>
                <Typography.Text
                  className="tx-title min-w-48 weight600"
                  style={{ fontSize: 40 }}
                  strong
                >
                  A.I. Solution Service Co., Ltd.
                </Typography.Text>
                <Typography.Text
                  className="tx-title min-w-48 weight600"
                  style={{ fontSize: 26 }}
                  strong
                >
                  บริษัท เอ.ไอ. โซลูชั่นเซอร์วิส จำกัด สำนักงานใหญ่
                </Typography.Text>
                <Typography.Text style={{ fontSize: 18 }}>
                  29/2 หมู่ที่ 3 ตำบลศาลาครุ อำเภอหนองเสือ จังหวัดปทุมธานี 12170
                </Typography.Text>
              </Flex>
            </Col>

            <Col span={6}>
              <table className="w-full border-collapse border outline outline-1 outline-black-400 overflow-hidden text-center rounded-xl">
                <tr>
                  <td className="border outline outline-1 outline-gray-400">
                    <Typography.Text
                      style={{ fontSize: 30, margin: 0, padding: 0 }}
                    >
                      ใบแจ้งหนี้/ใบขนส่ง
                    </Typography.Text>
                    <br></br>
                    <Typography.Text
                      style={{
                        fontSize: 28,
                        display: "block",
                        marginTop: "-20px",
                      }}
                    >
                     Delivery Note
                    </Typography.Text>
                  </td>
                </tr>
                <tr>
                  <td className="border outline outline-1 outline-black-400 text-start">
                    <Space className="w-full items-baseline ml-2">
                      <Typography.Text
                        strong
                        style={{ display: "block", width: 70, fontSize: 16 }}
                      >
                        เลขที่/No :
                      </Typography.Text>
                      <Typography.Text
                        className="text-start"
                        style={{ display: "block", fontSize: 18 }}
                      >
                        {hData.ivcode}
                      </Typography.Text>
                    </Space>
                    <Space className="w-full items-baseline ml-2">
                      <Typography.Text
                        strong
                        style={{ display: "block", width: 70, fontSize: 16 }}
                      >
                        วันที่/Date :
                      </Typography.Text>
                      <Typography.Text
                        className="text-start"
                        style={{ display: "block", fontSize: 18 }}
                      >
                        {dayjs(hData?.redate).format("DD/MM/YYYY")}
                      </Typography.Text>
                    </Space>
                  </td>
                </tr>
              </table>
            </Col>
          </Row>
        </div>
        <Typography.Text
          strong
          style={{ display: "block", width: "100%", fontSize: 16 }}
        >
          Line ID : @golf_ai. Tel. 080-2660934 E-maill
          A.I.SolutionService15@gmail.com Website: www.aisolutionservice.com
        </Typography.Text>
      </div>
    );
  };

  const ContentHead2 = () => {
    return (
      <div className="head-data" style={{ paddingTop: "100px" }}>
        <Row style={{ border: "1px solid", borderRadius: 20 }}>
          <Col
            style={{
              borderBottom: "1px solid",
              borderRight: "1px solid",
              paddingInline: 15,
              borderTopLeftRadius: 20,
            }}
            xs={8}
            sm={8}
            md={8}
            lg={8}
            xl={8}
            xxl={8}
          >
            <div className="flex flex-col">
              <Space style={{ width: "100%", textAlign: "center" }}>
                <Typography.Text strong style={{ fontSize: 14, margin: 20 }}>
                  ใบแจ้งหนี้/INVOICE No.
                </Typography.Text>
              </Space>
              <Space className="w-full items-baseline">
                <Typography.Text
                  strong
                  style={{ width: 128, fontSize: 14, margin: 22 }}
                  width={124}
                >
                 {hData.ivcode}
                </Typography.Text>
              </Space>
            </div>
          </Col>
          <Col
            style={{
              borderBottom: "1px solid",
              paddingInline: 15,
              borderTopRightRadius: 20,
              paddingTop: 5,
            }}
            xs={16}
            sm={16}
            md={16}
            lg={16}
            xl={16}
            xxl={16}
          >
            <div>
              <Space className="w-full items-baseline">
                <Typography.Text
                  strong
                  style={{ fontSize: 14, paddingLeft: 175}}
                  width={124}
                >
                  เงื่อนใขการชำระเงิน/Term of Payaent
                </Typography.Text>
              </Space>
              <Space className="w-full items-baseline">
                <Typography.Text
                  strong
                  style={{ width: "100%", fontSize: 14, paddingLeft: 170}}
                >
                ชำระเงินเต็มจำนวน ณ วันที่ส่งมอบสินค้า
                </Typography.Text>
              </Space>
            </div>
          </Col>
          <Col
            style={{ paddingInline: 15, borderBottomLeftRadius: 20 }}
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
            xxl={12}
          >
            <div className="flex flex-col">
              <Space>
                <Typography.Text
                  strong
                  style={{ width: 128, fontSize: 14 }}
                  width={124}
                >
                  ชื่อผู้ขาย/Supplier :
                </Typography.Text>
                <Typography.Text
                  strong
                  style={{
                    display: "block",
                    width: "100%",
                    fontSize: 14,
                    paddingLeft: 5,
                  }}
                >
                  {hData?.cusname}
                </Typography.Text>
              </Space>
              <Space className="w-full items-baseline">
                <Typography.Text
                  strong
                  style={{ width: 128, fontSize: 14, paddingLeft: 21 }}
                  width={124}
                >
                  ที่อยู่/Address :
                </Typography.Text>
                <Space className="w-full items-baseline">
                  <Typography.Text
                    strong
                    style={{
                      display: "block",
                      width: "100%",
                      fontSize: 14,
                      paddingLeft: 5,
                    }}
                  >
                    {hData?.address}
                  </Typography.Text>
                </Space>
              </Space>
            </div>
          </Col>
          <Col
            style={{ paddingInline: 15, borderBottomRightRadius: 20 }}
            xs={12}
            sm={12}
            md={12}
            lg={12}
            xl={12}
            xxl={12}
          >
            <div>
              <Space className="w-full items-baseline">
                <Typography.Text
                  strong
                  style={{ marginLeft: 230, width: 200, fontSize: 14 }}
                  width={124}
                >
                  เบอร์ติดต่อ
                </Typography.Text>
              </Space>
              <Space className="w-full items-baseline">
                <Typography.Text
                  strong
                  style={{ marginLeft: 230, width: 200, fontSize: 14 }}
                  width={124}
                >
                  {hData?.tel}
                </Typography.Text>
              </Space>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const ContentBody = () => {
    return (
      <div className="content-body in-data flex flex-col" style={{paddingTop: 20}}>
        <Card
          // title={
          // <>
          //     <Flex align='baseline'>
          //         <Typography.Text className='m-0 min-w-32 text-md font-semibold border-r'> ประเภทสินค้า </Typography.Text>
          //         <Typography.Text className='text-md ps-2'> ชื่อสินค้า </Typography.Text>
          //         <Typography.Text className='text-md ps-2'> หน่วยสินค้า </Typography.Text>
          //         <Typography.Text className='text-md ps-2'> จำนวน </Typography.Text>
          //     </Flex>
          // </>
          // }
          size="small"
          bordered
        >
          <Table
            id="tb-data"
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
        </Card>
      </div>
    );
  };

  const Pages = () => (
    <div ref={componentRef} id="raw">
      <ContentData>
        <ContentBody />
      </ContentData>
    </div>
  );

  const ContentData = ({ children, pageNum = 0, total = 0 }) => {
    return (
      <div className="rec-pages flex flex-col">
        <HeaderForm page={`${pageNum}/${total}`} />
        <div className="print-content grow">{children}</div>
        <FooterForm page={`${pageNum} of ${total}`} />
      </div>
    );
  };

  return (
    <>
      {/* <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24, }} spin />} fullscreen /> */}
      <div className="page-show" id="rec">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="title-preview">
          <Button
            className="bn-center  bg-blue-400"
            onClick={() => {
              handlePrintMultiPages();
            }}
            icon={<PiPrinterFill style={{ fontSize: "1.1rem" }} />}
          >
            PRINT
          </Button>
        </div>
        <div className="layout-preview">
          <Pages />
        </div>
        <div className="hidden" id="mypage">
          <div ref={printRef}>
            {newPageContent?.map((page, i) => {
              // console.log( page.innerHTML );
              return (
                <div key={i} className="on-page">
                  <ContentData pageNum={i + 1} total={newPageContent?.length}>
                    <div
                      dangerouslySetInnerHTML={{ __html: page.innerHTML }}
                    ></div>
                  </ContentData>
                  {i < newPageContent.length - 1 && (
                    <div className="page-break"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default DelPrintPreview;
