/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import "../delivery/delivery.css";
import { Authenticate } from "../../../service/Authenticate.service";
import { Button, Flex, Table, Typography, message } from "antd";
import { column } from "../delivery/delivery.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import SOService from "../../../service/SO.service";

const soservice = SOService();

export default function SOPrintPreview() {
  const { code } = useParams();
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const handlePrint = useReactToPrint({
    documentTitle: "Print Sales Order",
    onBeforePrint: () => handleBeforePrint(),
    onAfterPrint: () => handleAfterPrint(),
    removeAfterPrint: true,
  });

  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);

  const columnDesc = column;

  const [loading] = useState(false);

  const handleAfterPrint = () => {};
  const handleBeforePrint = () => {};

  useEffect(() => {
    const init = () => {
      soservice
        .get(code)
        .then(async (res) => {
          const {
            data: { header, detail },
          } = res.data;

          setHData(header || {});
          setDetails(detail || []);
        })
        .catch((err) => {
          console.log(err);
          message.error("Error getting infomation Sales Order.");
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

  const ContentHead = () => {
    return (
      <div className="content-head in-sample flex flex-col dnpv-header">
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
                ใบขายสินค้า
              </Typography.Text>
            </Flex>
          </div>
        </div>
      </div>
    );
  };

  const ContentHead2 = () => {
    return (
      <div className="content-head in-sample flex flex-col dnpv-header">
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
                เลขประจำตัวผู้เสียภาษี
                <span style={{ paddingLeft: 20 }}>{hData?.idno || "-"}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                ผู้ติดต่อ
                <span style={{ paddingLeft: 41 }}>{hData?.contact || "-"}</span>
              </Typography.Text>
            </Flex>
          </Flex>
          <Flex className="flex ps-3 grow-0" style={{ width: "40%" }}>
            <Flex vertical>
              <Typography.Text className="tx-info">
                เลขที่
                <span style={{ paddingLeft: 65 }}>{hData?.socode}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                วันที่
                <span style={{ paddingLeft: 70 }}>
                  {hData?.sodate ? dayjs(hData.sodate).format("DD/MM/YYYY") : "-"}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                PO ลูกค้า
                <span style={{ paddingLeft: 33 }}>{hData?.customer_po || "-"}</span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                วันที่นัดส่ง
                <span style={{ paddingLeft: 25 }}>
                  {hData?.deldate ? dayjs(hData.deldate).format("DD/MM/YYYY") : "-"}
                </span>
              </Typography.Text>
              <Typography.Text className="tx-info" style={{ height: 21 }}>
                ห้องครัว
                <span style={{ paddingLeft: 35 }}>{hData?.del_room || "-"}</span>
              </Typography.Text>
            </Flex>
          </Flex>
        </div>
      </div>
    );
  };

  const ReceiptSummary = () => {
    return (
      <>
        <Table.Summary.Row className="dnpv-footer">
          <Table.Summary.Cell
            colSpan={3}
            className="!align-top !ps-0 !pe-0"
            style={{ height: 20 }}
          >
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{ fontSize: 18, marginLeft: 10 }}
                strong
              >
                ({thaiBahtText(hData?.total_price || 0, 2, 2)}).
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                รวมเป็นเงิน
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
          <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
            <Flex
              style={{
                borderTop: "1px dashed",
              }}
            >
              <Typography.Text
                className="tx-info"
                style={{ fontSize: 15, marginLeft: 10, marginTop: 4 }}
                strong
              >
                {hData?.total_price}
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row className="dnpv-footer">
          <Table.Summary.Cell colSpan={8} className="!align-top !ps-0 !pe-0">
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
                <p>ยืนยันรายการใบขายสินค้าตามรายละเอียดข้างต้น</p>
                <p>
                  Confirmed by/ผู้ยืนยัน _____________________ วันที่
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
                  {hData?.sodate
                    ? dayjs(hData.sodate).format("DD/MM/YYYY  HH:mm:ss")
                    : dayjs().format("DD/MM/YYYY  HH:mm:ss")}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; บันทึกโดย {userInfo?.firstname}{" "}
                  {userInfo?.lastname}
                </p>
              </Typography.Text>
            </Flex>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </>
    );
  };

  const ROWS_PER_PAGE = 16;
  const ROW_HEIGHT = 17;

  const pages = useMemo(() => {
    const list = Array.isArray(details) ? details : [];
    const out = [];
    if (list.length === 0) {
      out.push({ rows: [], pageIndex: 0 });
      return out;
    }

    for (let start = 0; start < list.length; start += ROWS_PER_PAGE) {
      const slice = list.slice(start, start + ROWS_PER_PAGE);
      const withRowNo = slice.map((row, idx) => ({
        ...row,
        __rowNo: start + idx + 1,
      }));
      out.push({ rows: withRowNo, pageIndex: out.length });
    }
    return out;
  }, [details]);

  const totalPages = pages.length || 1;

  const padRows = (rows, pageIndex) => {
    const out = Array.isArray(rows) ? [...rows] : [];
    for (let i = out.length; i < ROWS_PER_PAGE; i++) {
      out.push({ _empty: true, key: `empty-${pageIndex}-${i}` });
    }
    return out;
  };

  const renderedColumns = useMemo(() => {
    return (columnDesc || []).map((col) => {
      const originalRender = col.render;
      return {
        ...col,
        render: (text, record, idx) => {
          if (record && record._empty) return "";
          if (col.key === "index" && typeof originalRender === "function") {
            const rowNo = Number(record?.__rowNo);
            if (Number.isFinite(rowNo)) {
              return originalRender(text, record, rowNo - 1);
            }
          }
          return originalRender ? originalRender(text, record, idx) : text;
        },
      };
    });
  }, [columnDesc]);

  const ContentBody = ({ rows, showSummary, pageIndex }) => {
    const paddedRows = padRows(rows, pageIndex);
    return (
      <div
        className="dnpv-table-wrap"
        style={{
          "--dnpv-empty-row-height": `${ROW_HEIGHT}px`,
          "--dnpv-row-height": `${ROW_HEIGHT}px`,
        }}
      >
        <Table
          className="dnpv-table"
          size="small"
          dataSource={paddedRows}
          columns={renderedColumns}
          pagination={false}
          rowKey={(rec) => {
            if (rec?._empty) return rec.key;
            const base = rec?.id || rec?.rowid || rec?.stcode || "row";
            const rowNo = rec?.__rowNo ? `-${rec.__rowNo}` : "";
            return `${base}${rowNo}`;
          }}
          bordered={false}
          locale={{
            emptyText: <span>No data available, please add some data.</span>,
          }}
          onRow={(record) => {
            return { className: record._empty ? "dnpv-empty-row" : "r-sub" };
          }}
          summary={showSummary ? ReceiptSummary : undefined}
        />
      </div>
    );
  };

  const ContentData = ({ children }) => {
    return (
      <div className="dnpv-pages flex flex-col">
        <div className="print-content">{children}</div>
      </div>
    );
  };

  const PrintablePages = () => {
    return (
      <div ref={componentRef}>
        {pages.map((p, idx) => {
          const isLast = idx === totalPages - 1;
          return (
            <React.Fragment key={`page-${idx}`}>
              <ContentData>
                <ContentHead />
                <ContentHead2 />
                <ContentBody rows={p.rows} showSummary={isLast} pageIndex={idx} />
              </ContentData>
              {idx < totalPages - 1 && <div className="page-break" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className="page-show" id="dnpv">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="title-preview">
          <Button
            className="bn-center bg-blue-400"
            onClick={() => {
              handlePrint(null, () => componentRef.current);
            }}
            icon={<PiPrinterFill style={{ fontSize: "1.1rem" }} />}
          >
            PRINT
          </Button>
        </div>
        <div className="layout-preview">
          <PrintablePages />
        </div>
      </div>
    </>
  );
}