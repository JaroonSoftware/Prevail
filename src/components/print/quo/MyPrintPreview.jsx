/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
// import thaiBahtText from 'thai-baht-text';
import "./MyPrint.css";
import logo from "../../../assets/images/logo.png";

import QuotationService from "../../../service/Quotation.service";
import {
  Button,
  Flex,
  Table,
  Typography,
  message,
  Spin,
  Row,

} from "antd";
import { column, column2 } from "./model";

import dayjs from "dayjs";
// import { comma } from '../../../utils/util';
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";

const quoservice = QuotationService();

function POPrintPreview() {
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
  const columnDesc2 = column2;
  const [loading, setLoading] = useState(false);

  const handleAfterPrint = () => {
    setNewPageContent([]);
  };
  const handleBeforePrint = (e) => {
    console.log("before printing...");
  };

  const handleCheckMultiPages = async () => {
    const limitPage = 900;
    return new Promise((r) => {
      // const head = document.querySelector("#raw .in-head");
      const data = document.querySelector("#raw .in-data");
      const table = document.querySelector("#raw .in-data #tb-data");
      // const thead = table?.querySelector("thead");
      const mtbody = table?.querySelector("tbody");
      // const mtfoot = table?.querySelector("tfoot");
      const row = mtbody?.querySelectorAll("tr");
      // const col = thead?.querySelectorAll("tr");
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
        const table2 = cdata.querySelector("#tb-data2");
        // const thead = table?.querySelector("thead");
        const tbody = table?.querySelector("tbody");
        const tbody2 = table2?.querySelector("tbody");
        // const tfoot = table?.querySelector("tfoot");

        // tbody.style.height = `${limitPage - hfoot}px`;

        tbody.innerHTML = `${samplesPage[rind]
          .map((m) => m.outerHTML)
          .join("")}`;

        tbody2.innerHTML = `${samplesPage[rind]
          .map((m) => m.outerHTML)
          .join("")}`;

        // if (rind < samplesPage.length - 1) tfoot.remove();
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
      quoservice
        .get(code)
        .then(async (res) => {
          const { header, detail } = res.data.data;
          setHData(header);
          setDetails(detail);
          console.log(detail);
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
        <div className="print-head" style={{ height: 75 }}>
          <div className="print-title">
            <ContentHead {...resProps} />
          </div>
        </div>
      </>
    );
  };

  const FooterForm = ({ page }) => {
    return (
      <div className="print-foot">
        <div className="print-title flex justify-end">
          <Flex className="mb-0 pe-6">
            <Typography.Text className="text-sm" strong>
              {page}
            </Typography.Text>
          </Flex>
        </div>
      </div>
    );
  };

  const ContentHead = () => {
    return (
      <div className="content-head in-sample flex flex-col">
        <div className="print-title flex pb-2">
          <div className="flex ps-3 grow-0" style={{ width: 900 ,}}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text
                className="tx-title min-w-48 weight600"
                style={{ fontSize: 22, lineHeight: "1em", }}
                strong
              >
                Prevail International Food Co.,Ltd
              </Typography.Text>
              <Typography.Text style={{ fontSize: 14, lineHeight: "1em",}}>
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text style={{ fontSize: 18, lineHeight: "1em",}}>
                TEL. 098-1929391 ID LINE : 0981929391 E-mail
                :prevailinternational89@gmail.com
              </Typography.Text>
              <Typography.Text style={{ fontSize: 18 ,lineHeight: "1em",}}>
                รอบวันที่ {dayjs(hData?.qtdate).format("DD/MM/YYYY")}
              </Typography.Text>
            </Flex>
            <div className="grow pb-2">
              <img
                src={logo}
                alt=""
                style={{
                  height: "100%",
                  width: 200,
                  float: "left",
                  marginLeft: "50px",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };
  const ContentBody = () => {
    return (
      <Row className="content-body in-data  ps-3 pe-3" horizontal>
        <Table
          id="tb-data"
          size="small"
          style={{ width: "50%" }}
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
        />
        <Table
          id="tb-data2"
          size="small"
          style={{ width: "50%" ,borderRight: "1px solid"}}
          dataSource={details}
          columns={columnDesc2}
          pagination={false}
          rowKey="stcode"
          bordered={false}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          onRow={(record, index) => {
            return { className: "r-sub2" };
          }}
        />
      </Row>
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
      <div className="quopv-pages flex flex-col">
        <HeaderForm page={`${pageNum}/${total}`} />
        <div className="print-content grow">{children}</div>
        <FooterForm page={`${pageNum} of ${total}`} />
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

export default POPrintPreview;
