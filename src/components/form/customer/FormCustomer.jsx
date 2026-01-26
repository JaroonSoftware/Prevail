import React, { useState, useEffect } from "react";

import {
  Card,
  message,
  Row,
  Col,
  // Divider,
  Spin,
  Table,
  Typography,
} from "antd";

import { CustomerColumn } from "./form-customer.model.js";
import OptionService from "../../../service/Options.service.js";

const opservice = OptionService();

export default function FormCustomer({ onChooseCustomer }) {
  const [itemtypesData, setCustomerData] = useState([]);
  const [itemtypesDataWrap, setCustomerDataWrap] = useState([]);
  const [loading, setLoading] = useState(true);

  const [itemDetail, setItemDetail] = useState({});

  useEffect(() => {
    search();
    // console.log("modal-itemtypes");
  }, []);

  
  /** handle logic component */
  const handleChoose = (selectedItem) => {
    // console.log("selectedItem", selectedItem);
    setItemDetail(selectedItem);
    onChooseCustomer(selectedItem);
  };

  /** setting initial component */
  const search = () => {
    setLoading(true);
    opservice
      .optionsCustomer()
      .then((res) => {
        let { data } = res.data;
        setCustomerData(data);
        setCustomerDataWrap(data);
      })
      .catch((err) => {
        console.warn(err);
        const data = err?.response?.data;
        message.error(data?.message || "error request");
        // setLoading(false);
      })
      .finally(() =>
        setTimeout(() => {
          setLoading(false);
        }, 400)
      );
  };

  return (
    <>
      <Spin spinning={loading} className="w-full">
        <Row className="m-0 mt-4  px-2 lg:px-[1rem] 2xl:px-[20vw]" gutter={[12, 12]}>
          {/* <Card style={{ minHeight: "60vh", width: "100%" }} className="w-full border-none"> */}
            <Card className="w-full">
              <Row className="m-0" gutter={[8, 8]}>
                <Col xs={24} sm={24} md={6} lg={6}>
                  <Typography.Title level={3} className="m-0" style={{fontSize: 'clamp(12px, 1vw, 24px)'}}>
                  รหัสลูกค้า :{itemDetail?.cuscode}
                  </Typography.Title>
                </Col>
                <Col xs={24} sm={24} md={10} lg={10}>
                  <Typography.Title level={3} className="m-0" style={{fontSize: 'clamp(12px, 1vw, 24px)'}}>
                    ชื่อลูกค้า : {itemDetail?.cusname}
                  </Typography.Title>
                </Col>
                <Col xs={24} sm={24} md={8} lg={8}>
                  <Typography.Title level={3} className="m-0" style={{fontSize: 'clamp(12px, 1vw, 24px)'}}>
                    เขตขนส่ง : {itemDetail?.county_name}
                  </Typography.Title>
                </Col>
              </Row>
            </Card>
            {/* <Divider></Divider> */}
            <Table
              bordered
              dataSource={itemtypesDataWrap}
              columns={CustomerColumn}
              rowKey="typecode"
              onRow={(record, rowIndex) => {
                return {
                  onClick: () => handleChoose(record), // click row
                };
              }}
              pagination={{
                total: itemtypesDataWrap.length,
                showTotal: (_, range) =>
                  `${range[0]}-${range[1]} of ${itemtypesData.length} items`,
                defaultPageSize: 25,
                pageSizeOptions: [25, 35, 50, 100],
              }}
              scroll={{ y: 400 }}
              size="small"
            />
          {/* </Card> */}
        </Row>
      </Spin>
    </>
  );
}
