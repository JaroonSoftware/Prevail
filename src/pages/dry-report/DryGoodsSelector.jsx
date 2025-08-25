import React from "react";
import { Card, Checkbox, Typography,Flex,Col,Button } from "antd";
import { FileAddOutlined } from "@ant-design/icons";
const { Title } = Typography;

const dryGoodsOptions = [
  { label: "มะนาวดอง", value: "มะนาวดอง" },
  { label: "อบเชย", value: "อบเชย" },
  { label: "ลูกชิ้นไก่", value: "ลูกชิ้นไก่" },
  { label: "หมี่ซั่ว", value: "หมี่ซั่ว" },
];

const TitleTable = (
        <Flex className='width-100' align='center'>
            <Col span={12} className='p-0'>
                <Flex gap={4} justify='start' align='center'>
                  <Typography.Title className='m-0 !text-zinc-800' level={3}>รายการซื้อของแห้งสำหรับคนซื้อ</Typography.Title>
                </Flex>
            </Col>
            <Col span={12} style={{paddingInline:0}}>
                <Flex gap={4} justify='end'>
                      <Button  
                      size='small' 
                      className='bn-action bn-center bn-primary-outline justify-center'  
                      icon={<FileAddOutlined  style={{fontSize:'.9rem'}} />} 
                      // onClick={() => { hangleAdd() } } 
                      >
                          เพิ่มใบเสนอราคา
                      </Button>
                </Flex>
            </Col>  
        </Flex>
    ); 

const DryGoodsSelector = () => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
    }}
  >
  <Card
    // title={<Title level={5} style={{ margin: 0 }}>รายการซื้อของแห้งสำหรับคนซื้อ</Title>}
    title={TitleTable} 
    style={{ width: "65%", borderRadius: 12 }}
    bodyStyle={{ padding: 18 }}
  >
    <div>
      <Checkbox.Group style={{ display: "block", marginTop: 16 }}>
        {dryGoodsOptions.map((item) => (
          <div key={item.value} style={{ marginBottom: 10 }}>
            <Checkbox value={item.value}>{item.label}</Checkbox>
          </div>
        ))}
      </Checkbox.Group>
    </div>
  </Card>
  </div>
);

export default DryGoodsSelector;