import { Flex, Typography } from "antd";
import "../../../assets/styles/banks.css"
export const bankListColumn = () => [
  {
    title: "No.",
    key: "id",
    dataIndex: "id",
    align: "left", 
    vertical: "middle",
    width:60,
    render: (_,record, index) => (index + 1) 
  },
  {
    title: "Bank",
    key: "bank",
    dataIndex: "bank",
    align: "left",  
    render: (_,record) => (<>
      <Flex align='center' gap={8}>
          <i className={`bank bank-${record.bank} shadow huge`} style={{height:24, width:24, marginTop: 4}}></i>
          <Flex align='start' gap={1} vertical>
              <Typography.Text ellipsis style={{ fontSize: 13 }}>{record.bank_name_th}</Typography.Text> 
              <Typography.Text ellipsis style={{ fontSize: 9, color:'#8c8386' }}>{record.bank_name}</Typography.Text> 
          </Flex>
      </Flex>
    </>)
  },
  {
    title: "Account Number",
    key: "acc_no",
    dataIndex: "acc_no",
    align: "left", 
    width:140,
  },
  {
    title: "Account Name",
    key: "acc_name",
    dataIndex: "acc_name",
    align: "left", 
    width:'28%',
  },
];