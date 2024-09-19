/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
// import thaiBahtText from 'thai-baht-text';
import "./MyPrint.css";
import logo from "../../../assets/images/logo.png";
import vegetable from "../../../assets/images/vegetable.jpg";

import PrintService from "../../../service/Print.service";
import { Button, Card, Flex, Table, Typography, message } from "antd";
import { pickuplistColumn } from "./model";

import dayjs from "dayjs";
// import { comma } from '../../../utils/util';
import { PiPrinterFill } from "react-icons/pi";
import { TbFileTypePdf } from "react-icons/tb";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

const printservice = PrintService();

function QuoListPrint() {
  const { code } = useParams();
  const componentRef = useRef(null);
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [soData, setSoData] = useState({});
  const [soDetailData, setSoDetailData] = useState([]);

  const [newPageContent, setNewPageContent] = useState([]);
  const columnSpc = pickuplistColumn();

  const [loading, setLoading] = useState(false);

  const handleAfterPrint = () => {
    setNewPageContent([]);
  };
  const handleBeforePrint = (e) => {
    // console.log("before printing...")
    // const newElement = document.createElement('div');
    // newElement.id = 'new-container'; // Optional: Set an ID for the new container
    // newElement.innerHTML = 'TEST';
    // Render the new component into the new container
    // Replace the old container with the new container
    // componentRef.current.innerHTML = 'TEST';
  };

  const handleCheckMultiPages = async () => {
    const limitPage = 800;
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

  const hhandlePrintMultiPagesPdf = () => {
    setLoading(true);
    // await handleCheckMultiPages();
    handleCheckMultiPages()
      .then((res) => {
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
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
      console.log(code);
      printservice
        .quotation(code)
        .then(async (res) => {
          const {
            data: { header, detail },
          } = res.data;
          // console.log(header)
          setSoData(header);

          setSoDetailData(detail);
          //   const pkArr = [];
        })
        .catch((err) => {
          console.log(err);
          message.error("ดึงข้อมูล ใบเสนอราคา ไม่สำเร็จ.");
        });
    };

    init();
    return () => {};
  }, []);

  const HeaderForm = ({ ...resProps }) => {
    return (
      <>
        <div className="print-head" style={{ height: 64 }}>
          <div className="print-title flex gap-4">
            <div className="grow pb-2">
              <Flex className="mb-0 ">
                <Typography.Title
                  level={3}
                  align="end"
                  className="text-lg"
                  style={{ backgroundColor: "#A9D08E" }}
                >
                  Prevail Internationnal Food Co.,Ltd
                </Typography.Title>
              </Flex>
            </div>
            <div className="flex grow-0 items-center" style={{ width: 190 }}>
              <img src={logo} alt="" style={{ width: 350 }} />
            </div>
            <div
              className="flex grow-0 justify-end items-center"
              style={{ width: 150 }}
            >
              <img
                src={vegetable}
                alt=""
                style={{ paddingInline: 20, height: "100%" }}
              />
            </div>
          </div>
        </div>
        {/* <div className="content-head in-head flex flex-col">
        <div className="print-title flex pb-2">
          <div className="flex ps-3 grow-0" style={{ width: 280 }}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text className="tx-title min-w-48" strong>
                ที่อยู่จัดส่ง
              </Typography.Text>
              <Typography.Text className="tx-info">
                {soData?.cusname}
              </Typography.Text>
              <Typography.Text className="tx-info">
                {soData?.address}
              </Typography.Text>
              {soData?.contact_name && (
                <Typography.Text className="tx-info">
                  ติดต่อ {soData?.contact_name || "-"}
                </Typography.Text>
              )}
              {soData?.contact_tel && (
                <Typography.Text className="tx-info">
                  โทร. {soData?.tel}
                </Typography.Text>
              )}
              {soData?.contact_email && (
                <Typography.Text className="tx-info">
                  อีเมล {soData?.email}
                </Typography.Text>
              )}
            </Flex>
          </div> */}
        <ContentHead {...resProps} />
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

  const Summary = () => {
    return (
      <>
        <Table.Summary.Row style={{ height: 24 }}>
          {/* <Table.Summary.Cell colSpan={7} className='!align-top'></Table.Summary.Cell> */}
        </Table.Summary.Row>
      </>
    );
  };

  const ContentHead = ({ page }) => {
    return (
      <div className="content-head in-head flex flex-col">
        <div className="print-title flex pb-2">
          <div className="flex ps-3 grow-0" style={{ width: "100%" }}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text className="tx-title min-w-48" strong>
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text className="tx-info">
                TEL. 098-1929391 ID LINE : 0981929391 E-mail
                :prevailinternational89@gmail.com
              </Typography.Text>
              <Typography.Text className="tx-info">
                รอบวันที่ {dayjs(soData?.qtdate).format("DD/MM/YYYY")}
              </Typography.Text>
            </Flex>
          </div>
          <div className="flex px-3 grow justify-end">
            <Flex className="mb-1.5 w-full" vertical>
              <Flex justify="space-between">
              {/* <Typography.Text className="tx-title min-w-48" strong>
                  PHUKET
                </Typography.Text> */}
                <Typography.Text className="tx-title min-w-48" strong>
                  PHUKET
                </Typography.Text>
              </Flex>
              {/* <Flex justify="space-between">
                <Typography.Text className="tx-info">
                  ใบขายสินค้าเลขที่
                </Typography.Text>
                <Typography.Text className="tx-info">
                  {soData?.socode}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between">
                <Typography.Text className="tx-info">
                  วันที่ใบขายสินค้า
                </Typography.Text>
                <Typography.Text className="tx-info">
                  {dayjs(soData?.sodate).format("DD/MM/YYYY")}
                </Typography.Text>
              </Flex> */}
              <Flex justify="space-between">
                <Typography.Text className="tx-info">หน้า</Typography.Text>
                <Typography.Text className="tx-info">{page}</Typography.Text>
              </Flex>
            </Flex>
          </div>
        </div>
      </div>
    );
  };

  const ContentBody = () => {
    return (
      <div className="content-body in-data flex flex-col">
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
            dataSource={soDetailData}
            columns={columnSpc}
            pagination={false}
            rowKey="code"
            // bordered={true}
            locale={{
              emptyText: <span>No data available, please add some data.</span>,
            }}
            onRow={(record, index) => {
              return { className: "r-sub" };
            }}
            summary={Summary}
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
      <div className="pickup-pages flex flex-col">
        <HeaderForm page={`${pageNum}/${total}`} />
        <div className="print-content grow">{children}</div>
        <FooterForm page={`${pageNum} of ${total}`} />
      </div>
    );
  };

  return (
    <>
      {/* <Spin spinning={loading} indicator={<LoadingOutlined style={{ fontSize: 24, }} spin />} fullscreen /> */}
      <div className="page-show" id="pickup">
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
          {false && (
            <Button
              className="bn-center  !bg-red-600 text-white hover:!text-white hover:!border-red-800"
              onClick={() => {
                hhandlePrintMultiPagesPdf();
              }}
              // onClick={() => { handlePrint(null, () => componentRef.current ); }}
              icon={<TbFileTypePdf style={{ fontSize: "1.1rem" }} />}
            >
              PDF
            </Button>
          )}
          {false && (
            <Button
              className="bn-center  bg-blue-400"
              onClick={() => {
                handleCheckMultiPages();
              }}
              icon={<PiPrinterFill style={{ fontSize: "1.1rem" }} />}
            >
              Images
            </Button>
          )}
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

export default QuoListPrint;
