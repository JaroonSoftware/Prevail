/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
// import ReactDOMServer from "react-dom/server";
import { useReactToPrint } from "react-to-print";
// import thaiBahtText from 'thai-baht-text';
import "./MyPrint.css";
import logo from "../../../assets/images/logo.png";

import QuotationService from "../../../service/Quotation.service";
import { Button, Flex, Table, Typography, message, Spin, Row } from "antd";
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
  const [details2, setDetails2] = useState([]);

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
    // Target 100 rows per page across both columns (50 each)
    const ROWS_PER_PAGE_TOTAL = 100;
    const ROWS_PER_COLUMN = Math.ceil(ROWS_PER_PAGE_TOTAL / 2);
    return new Promise((r) => {
      const data = document.querySelector("#raw .in-data");

      const tableLeft = document.querySelector("#raw .in-data #tb-data");
      const tbodyLeft = tableLeft?.querySelector("tbody");
      const rowsLeft = Array.from(tbodyLeft?.querySelectorAll("tr") || []);

      const tableRight = document.querySelector("#raw .in-data #tb-data2");
      const tbodyRight = tableRight?.querySelector("tbody");
      const rowsRight = Array.from(tbodyRight?.querySelectorAll("tr") || []);

      const chunk = (arr, size) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      };

      const pagesLeft = chunk(rowsLeft, ROWS_PER_COLUMN);
      const pagesRight = chunk(rowsRight, ROWS_PER_COLUMN);

      const pageCount = Math.max(pagesLeft.length, pagesRight.length);
      const pages = [];

      for (let i = 0; i < pageCount; i++) {
        const cdata = data.cloneNode(true);
        const table = cdata.querySelector("#tb-data");
        const table2 = cdata.querySelector("#tb-data2");
        const tbody = table?.querySelector("tbody");
        const tbody2 = table2?.querySelector("tbody");

        const leftContent = (pagesLeft[i] || []).map((m) => m.outerHTML).join("");
        const rightContent = (pagesRight[i] || []).map((m) => m.outerHTML).join("");

        if (tbody) tbody.innerHTML = leftContent;
        if (tbody2) tbody2.innerHTML = rightContent;

        const temp = document.createElement("div");
        temp.appendChild(cdata);
        temp.classList.add("on-page");
        pages.push(temp);
      }

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

          let firstrow = detail.slice(0, detail.length / 2);
          let lastrow = detail.slice(detail.length / 2, detail.length);

          lastrow = lastrow.map(function (entry) {
            entry.total = detail.length / 2; 

            return entry;
          });

          

          setDetails(firstrow);
          setDetails2(lastrow);
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
          <div className="flex ps-3 grow-0" style={{ width: 900 }}>
            <Flex className="mb-1.5" vertical>
              <Typography.Text
                className="tx-title min-w-48 weight600"
                style={{ fontSize: 22, lineHeight: "1em" }}
                strong
              >
                Prevail International Food Co.,Ltd
              </Typography.Text>
              <Typography.Text style={{ fontSize: 14, lineHeight: "1em" }}>
                60/3 ถ.กระ ต.ตลาดใหญ่ อ.เมือง จ.ภูเก็ต 83000
              </Typography.Text>
              <Typography.Text style={{ fontSize: 18, lineHeight: "1em" }}>
                TEL. 098-1929391 ID LINE : 0981929391 E-mail
                :prevailinternational89@gmail.com
              </Typography.Text>
              <Typography.Text style={{ fontSize: 18, lineHeight: "1em" }}>
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
      <Row className="content-body in-data  ps-3 pe-3 " horizontal>
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
          style={{ width: "50%", borderRight: "1px solid" }}
          dataSource={details2}
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
