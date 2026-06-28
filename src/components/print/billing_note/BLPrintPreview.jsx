/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import "./bl.css";
import { Authenticate } from "../../../service/Authenticate.service";
import { Button, Flex, Table, Typography, message } from "antd";
import { column } from "./bl.model";
import thaiBahtText from "thai-baht-text";
import dayjs from "dayjs";
import { PiPrinterFill } from "react-icons/pi";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import BillingNoteService from "../../../service/BillingNote.Service";

const blservice = BillingNoteService();
const ROWS_PER_PAGE = 34;

function BLPrintPreview() {
  const { code } = useParams();
  const componentRef = useRef(null);
  const authService = Authenticate();
  const [userInfo, setUserInfo] = useState(null);
  const [hData, setHData] = useState({});
  const [details, setDetails] = useState([]);
  const [loading] = useState(false);

  const handlePrint = useReactToPrint({
    documentTitle: "Print This Document",
    removeAfterPrint: true,
    pageStyle: `@page { size: 210mm 297mm !important; margin: 0 !important; }`,
  });

  useEffect(() => {
    blservice
      .get(code)
      .then((res) => {
        const { header, detail } = res.data.data;
        setHData(header);
        setDetails(detail);
      })
      .catch((err) => {
        console.log(err);
        message.error("Error getting billing note information.");
      });
  }, []);

  useEffect(() => {
    setUserInfo(authService.getUserInfo());
  }, []);

  const groupedDetails = useMemo(() => {
    if (!details || details.length === 0) return [];

    const map = new Map();
    details.forEach((row) => {
      const key = row.socode;
      const amount = Number(row.qty || 0) * Number(row.price || 0);

      if (!map.has(key)) {
        map.set(key, {
          socode: row.socode,
          redate: row.redate ?? row.dndate,
          duedate: row.duedate ?? hData?.duedate,
          total_price: 0,
        });
      }

      map.get(key).total_price += amount;
    });

    return Array.from(map.values());
  }, [details, hData]);

  const pageChunks = useMemo(() => {
    if (!groupedDetails || groupedDetails.length === 0) return [[]];
    const chunks = [];
    for (let i = 0; i < groupedDetails.length; i += ROWS_PER_PAGE) {
      const slice = groupedDetails
        .slice(i, i + ROWS_PER_PAGE)
        .map((row, j) => ({ ...row, _no: i + j + 1 }));
      chunks.push(slice);
    }
    return chunks;
  }, [groupedDetails]);

  const ContentHead = () => (
    <div className="content-head in-sample flex flex-col">
      <div className="print-title flex pb-2">
        <div className="flex ps-3 grow-0" style={{ width: "80%" }}>
          <Flex className="mb-1.5" vertical>
            <Typography.Text className="tx-title min-w-80 weight600" strong style={{ fontSize: 24 }}>
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

  const ContentHead2 = () => (
    <div className="content-head in-sample flex flex-col">
      <div className="print-title flex pb-2">
        <Flex className="flex ps-3 grow-0" style={{ width: "60%" }}>
          <Flex vertical>
            <Typography.Text className="tx-info">
              ลูกค้า<span style={{ paddingLeft: 22 }}>{hData?.cuscode}</span>
            </Typography.Text>
            <Typography.Text className="tx-info">
              <span>{hData?.prename} {hData?.cusname}</span>
            </Typography.Text>
            <Typography.Text className="tx-info" style={{ height: 21 }}>
              <span>{hData?.address}</span>
            </Typography.Text>
            <Typography.Text className="tx-info">
              <span><br /></span>
            </Typography.Text>
            <Typography.Text className="tx-info" style={{ height: 21 }}>
              หมายเหตุ<span style={{ paddingLeft: 20 }}>{hData?.remark}</span>
            </Typography.Text>
          </Flex>
        </Flex>
        <Flex className="flex ps-3 grow-0" style={{ width: "40%" }}>
          <Flex vertical>
            <Typography.Text className="tx-info">
              เลขที่ใบวางบิล<span style={{ paddingLeft: 22 }}>{hData?.blcode}</span>
            </Typography.Text>
            <Typography.Text className="tx-info"><br /></Typography.Text>
            <Typography.Text className="tx-info" style={{ height: 21 }}>
              วันที่<span style={{ paddingLeft: 70 }}>{dayjs(hData?.ivdate).format("DD/MM/YYYY")}</span>
            </Typography.Text>
            <Typography.Text className="tx-info"><br /></Typography.Text>
            <Typography.Text className="tx-info" style={{ height: 21 }}>
              เงื่อนไขการชำระเงิน<span style={{ paddingLeft: 20 }}>{hData?.payment}</span>
            </Typography.Text>
          </Flex>
        </Flex>
      </div>
    </div>
  );

  const ReceiptSummary = () => (
    <>
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={3} className="!align-top !ps-0 !pe-0" style={{ height: 20 }}>
          <Flex style={{ borderTop: "1px solid", borderLeft: "1px solid" }}>
            <Typography.Text className="tx-info" style={{ fontSize: 18, marginLeft: 10 }} strong>
              ({thaiBahtText(hData?.total_price || 0, 2, 2)}).
            </Typography.Text>
          </Flex>
        </Table.Summary.Cell>
        <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
          <Flex style={{ borderTop: "1px solid", justifyContent: "flex-end" }}>
            <Typography.Text
              className="tx-info"
              style={{ fontSize: 15, marginRight: 10, marginTop: 4, textAlign: "right", width: "100%" }}
              strong
            >
              รวมเงินทั้งสิ้น
            </Typography.Text>
          </Flex>
        </Table.Summary.Cell>
        <Table.Summary.Cell colSpan={1} className="!align-top !ps-0 !pe-0">
          <Flex style={{ borderTop: "1px solid", borderLeft: "1px solid", borderRight: "1px solid", justifyContent: "flex-end" }}>
            <Typography.Text
              className="tx-info"
              style={{ fontSize: 15, marginRight: 10, marginTop: 4, textAlign: "right", width: "100%" }}
              strong
            >
              {hData?.total_price}
            </Typography.Text>
          </Flex>
        </Table.Summary.Cell>
      </Table.Summary.Row>
      <Table.Summary.Row>
        <Table.Summary.Cell colSpan={8} className="!align-top !ps-0 !pe-0">
          <Flex style={{ border: "1px solid", padding: 3, height: 70 }}>
            <Typography.Text className="tx-info" style={{ fontSize: 15, paddingLeft: 5, lineHeight: "1em", paddingTop: 7 }}>
              <p>
                ชื่อผู้รับวางบิล
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;__________________________________
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ในนาม บริษัท พรีเวล อินเตอร์เนชั่นแนล ฟู้ด จำกัด
              </p>
              <p>
                พิมพ์โดย
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                วันที่ {dayjs(hData?.ivdate).format("DD/MM/YYYY  HH:mm:ss")}
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; บันทึกโดย {userInfo?.firstname} {userInfo?.lastname}
              </p>
            </Typography.Text>
          </Flex>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    </>
  );

  return (
    <>
      <div className="page-show" id="bl">
        {loading && <Spin fullscreen indicator={<LoadingOutlined />} />}
        <div className="title-preview">
          <Button
            className="bn-center bg-blue-400"
            onClick={() => handlePrint(null, () => componentRef.current)}
            icon={<PiPrinterFill style={{ fontSize: "1.1rem" }} />}
          >
            PRINT
          </Button>
        </div>
        <div className="layout-preview">
          <div ref={componentRef}>
            {pageChunks.map((rows, idx) => {
              const isLast = idx === pageChunks.length - 1;
              return (
                <React.Fragment key={idx}>
                  <div className="bl-pages flex flex-col">
                    <div className="print-content">
                      <ContentHead />
                      <ContentHead2 />
                      <Table
                        size="small"
                        dataSource={rows}
                        columns={column}
                        pagination={false}
                        rowKey={(r, i) => `${r.socode}-${i}`}
                        bordered={false}
                        locale={{ emptyText: <span>ไม่มีข้อมูล</span> }}
                        onRow={() => ({ className: "r-sub" })}
                        summary={isLast ? ReceiptSummary : undefined}
                      />
                      {!isLast && (
                        <div style={{ textAlign: "right", paddingTop: 4, fontSize: 11, color: "#555" }}>
                          (มีต่อหน้าถัดไป)
                        </div>
                      )}
                    </div>
                  </div>
                  {!isLast && <div className="page-break" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export default BLPrintPreview;
