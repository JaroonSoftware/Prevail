import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Typography,
  Flex,
  Col,
  Button,
  message,
  Drawer,
} from "antd";
import { BsUiChecks } from "react-icons/bs";
import { ReloadOutlined, EditOutlined } from "@ant-design/icons";
import { GiGrain } from "react-icons/gi";

import { columns } from "./model";
import DryCheckDrawer from "../../../components/drawer/dry-check/DryCheckDrawer";
import ReportService from "../../../service/Report.service";

const rpservice = ReportService();

const DryGoodsSelector = () => {
  const [listDetail, setListDetail] = useState([]);
  const [show, setShow] = useState(false);
  const [selected, setSelected] = useState(null);

  const getData = (data) => {
    rpservice
      .getDryGoods(data, { ignoreLoading: true })
      .then((res) => {
        const { data } = res.data;

        setListDetail(data);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });
  };

  const init = async () => {
    getData({});
  };

  useEffect(() => {
    init();

    return async () => {
      //console.clear();
    };
  }, []);

  const handleOpen = (value) => {
    setSelected(value);
    // console.log(value);
    setShow(true);
  };

  const handleConfirmed = (v) => {
    rpservice
      .setDryGoods(v, { ignoreLoading: true })
      .then((res) => {
        message.success(res.data.message || "บันทึกข้อมูลเรียบร้อย");
        getData({});
        setShow(false);
      })
      .catch((err) => {
        console.log(err);
        message.error("Request error!");
      });

    // if( typeof value === 'function'){
    //     value( v );
    // }
  };

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <GiGrain
                style={{ fontSize: "1.4rem", verticalAlign: "middle" }}
              />
              <span>รายการของแห้งสำหรับคนซื้อ</span>
            </span>
          </Typography.Title>
        </Flex>
      </Col>
      <Col span={12} style={{ paddingInline: 0 }}>
        <Flex gap={4} justify="end">
          <Button
            size="small"
            className="bn-action bn-center bn-primary justify-center"
            icon={<ReloadOutlined style={{ fontSize: ".9rem" }} />}
            onClick={() => getData({})}
          >
            Refresh
          </Button>
        </Flex>
      </Col>
    </Flex>
  );

  // ปุ่มเช็คลิสต์สำเร็จ ในคอลัมน์ "ตัวเลือก"
  const handleCheck = (record) => {
    return (
      <Button
        className="bt-icon bn-success-outline"
        icon={
          <BsUiChecks
            style={{ fontSize: "1.4rem", marginTop: "4px", marginLeft: "1px" }}
          />
        }
        aria-label="ทำรายการสำเร็จ"
        title="ทำรายการสำเร็จ"
        onClick={() => handleOpen(record)}
      />
    );
  };
  const handleSelectChange = () => {};

  // สร้างคอลัมน์จาก model (ต้องส่ง handleCheck ให้ตรงชื่อ)
  const columnDefs = React.useMemo(
    () => columns({ handleCheck, handleSelectChange }),
    []
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "16px 12px",
        boxSizing: "border-box",
      }}
    >
      <Card
        title={TitleTable}
        style={{
          width: "100%",
          maxWidth: 1024, // ความกว้างเหมาะกับ tablet
          borderRadius: 12,
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Table
          size="small"
          rowKey="key"
          columns={columnDefs}
          dataSource={listDetail}
          pagination={false}
          scroll={{ x: "max-content" }}
          locale={{ emptyText: "ไม่มีรายการ" }}
        />
      </Card>
      {!!show && (
        <Drawer
          title={
            <Flex align="center" gap={4}>
              ยืนยันการสั่งซื้อ <EditOutlined style={{ fontSize: "1.2rem" }} />
            </Flex>
          }
          onClose={() => setShow(false)}
          open={show}
          // footer={adjust_action}
          width={868}
          className="responsive-drawer"
          styles={{
            body: { paddingBlock: 8, paddingLeft: 18, paddingRight: 8 },
          }}
        >
          {show && (
            <DryCheckDrawer
              data={selected}
              submit={handleConfirmed}
              close={() => setShow(false)}
            />
          )}
        </Drawer>
      )}
    </div>
  );
};

export default DryGoodsSelector;
