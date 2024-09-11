import { Space } from "antd";
import { Button } from "antd";
// import { PrinterOutlined, QuestionCircleOutlined, DeleteOutlined } from "@ant-design/icons"; 
import { EditOutlined } from "@ant-design/icons"; 
// import dayjs from 'dayjs';

export const accessColumn = ({handleEdit, handleDelete, handleView}) => [
  {
    title: "User Code",
    dataIndex: "code",
    key: "code",
    hidden: "true",
    width: "10%",
  },
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    width: "15%",
    sorter: (a, b) => a.username.length - b.username.length,
    sortDirections: ["descend", "ascend"],
  },
  {
    title: "ชื่อ",
    dataIndex: "firstname",
    key: "firstname", 
    sorter: (a, b) => a.firstname.length - b.firstname.length,
    sortDirections: ["descend", "ascend"],
  },
  {
    title: "นามสกุล",
    dataIndex: "lastname",
    key: "lastname",
    sorter: (a, b) => a.lastname.length - b.lastname.length,
    sortDirections: ["descend", "ascend"],
  },
  {
    title: "เบอร์โทร",
    dataIndex: "tel",
    key: "tel",
    width: "15%",
    sorter: (a, b) => a.tel.length - b.tel.length,
    sortDirections: ["descend", "ascend"],
  },
  {
    title: "ประเภท",
    dataIndex: "type",
    key: "type",
    width: 120,
    sorter: (a, b) => a.type.length - b.type.length,
    sortDirections: ["descend", "ascend"],
  },
  {
    title: "Action",
    key: "operation",
    width: 90,
    fixed: "right",
    render: (text,record) => (
      <Space > 
        <Button
          icon={<EditOutlined />} 
          className='bn-primary-outline'
          style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          onClick={(e) => handleEdit(record) }
          size="small"
        />
      </Space> 
    ),
  },   
]; 

export const customers = {
    id: null,
    cuscode: null,
    cusname: null,
    prename: null,
    idno: null,
    road: null,
    subdistrict: null,
    district: null,
    province: null,
    zipcode: null,
    country: null,
    delidno: null,
    delroad: null,
    delsubdistrict: null,
    deldistrict: null,
    delprovince: null,
    delzipcode: null,
    delcountry: null,
    tel: null,
    fax: null,
    taxnumber: null,
    email: null,
    status: "Y",
}