import { Button, Space, Typography } from "antd";
import { formatCommaNumber } from "../../../utils/util";
import { RightOutlined } from "@ant-design/icons";
// import dayjs from "dayjs";
export const columns = ({handleChoose, handleView})=>{
  const Link = Typography.Link;
  const LChoose = ({children, record}) => (
    <Link 
    className="text-select" 
    onClick={()=>handleChoose(record)} 
    >{children}</Link>
  );
  return [
    {
      title: "Shipping type",
      key: "shippingtype_name",
      dataIndex: "shippingtype_name",
      align: "left",
      sorter: (a, b) => (a?.shippingtype_name || "").localeCompare(b?.shippingtype_name || ""),
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    // {
    //   title: "Quantity",
    //   dataIndex: "loadingtype_qty",
    //   key: "loadingtype_qty",
    //   align: "right",
    //   className: "!pe-4",
    //   width: '10%',
    //   sorter: (a, b) => (a?.loadingtype_qty || "").localeCompare(b?.loadingtype_qty || ""),
    //   render: (v, record) => <LChoose record={record}>{formatCommaNumber(Number( v || 0))}</LChoose>,
    // },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "right",
      className: "!pe-4",
      width: '10%',
      sorter: (a, b) => (a?.price || "").localeCompare(b?.price || ""),
      render: (v, record) => <LChoose record={record}>{formatCommaNumber(Number( v || 0))}</LChoose>,
    },
    {
      title: "More",
      key: "operation",
      width: '60px',
      fixed: 'right',
      render: (text, record) => (
        <Space > 
          <Button
            icon={<RightOutlined />}
            className='bn-primary-outline'
            style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
            onClick={(e) => handleView(record) }
            size="small"
          />
        </Space>
      ),
    },  
  ]
};

export const shippingTermsColumn = [
  {
    title: "Shipping Expense",
    key: "expense_name",
    dataIndex: "expense_name",
    align: "left",  
  },
  {
    title: "Price",
    key: "price",
    dataIndex: "price",
    align: "right", 
    className: '!pe-4',
    width: 120,
    render: (v) => formatCommaNumber( Number( v || 0 ))
  },
];

// import dayjs from "dayjs";
export const columnsLoadingType = ({handleChoose})=>{
  const Link = Typography.Link;
  const LChoose = ({children, record}) => (
    <Link 
    className="text-select" 
    onClick={()=>handleChoose(record)} 
    >{children}</Link>
  );
  return [
    {
      title: "Loading type",
      key: "loadingtype_name",
      dataIndex: "loadingtype_name",
      align: "left",
      sorter: (a, b) => (a?.loadingtype_name || "").localeCompare(b?.loadingtype_name || ""),
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    {
      title: "Quantity",
      dataIndex: "loadingtype_qty",
      key: "loadingtype_qty",
      align: "right",
      className: "!pe-4",
      width: '15%',
      sorter: (a, b) => (a?.loadingtype_qty || "").localeCompare(b?.loadingtype_qty || ""),
      render: (v, record) => <LChoose record={record}>{formatCommaNumber(Number( v || 0))}</LChoose>,
    }, 
  ]
};