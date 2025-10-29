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
import { ShoppingCartOutlined, EditOutlined } from "@ant-design/icons";
import { GiGrain } from "react-icons/gi";

import { columns as buildColumns } from "./model";
import DryCheckDrawer from "../../components/drawer/billing-payment/DryCheckDrawer";
import ReportService from "../../service/Report.service";

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
    let adjustdata = {
      ...value,
    };

    setSelected(adjustdata);
    setShow(true);
  };

  const handleConfirmed = (v) => {
    // if( typeof value === 'function'){
    //     value( v );
    // }
  };

  const TitleTable = (
    <Flex className="width-100" align="center">
      <Col span={12} className="p-0">
        <Flex gap={4} justify="start" align="center">
          <Typography.Title className="m-0 !text-zinc-800" level={3}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <GiGrain style={{ fontSize: "1.4rem", verticalAlign: "middle" }} />
              <span>รายการของแห้งสำหรับคนซื้อ</span>
            </span>
          </Typography.Title>
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
        onClick={() => handleOpen(record?.stcode)}
      />
    );
  };
  const handleSelectChange = () => {};

  // สร้างคอลัมน์จาก model (ต้องส่ง handleCheck ให้ตรงชื่อ)
  const columnDefs = React.useMemo(
    () => buildColumns({ handleCheck, handleSelectChange }),
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
          {show && <DryCheckDrawer data={selected} submit={handleConfirmed} />}
        </Drawer>
      )}
    </div>
  );
};

export default DryGoodsSelector;
