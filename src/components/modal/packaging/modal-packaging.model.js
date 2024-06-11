import { Button, Flex, Popconfirm, Tag, Tooltip, Typography } from "antd";
import { TagActiveStatus } from "../../badge-and-tag";
import dayjs from 'dayjs';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { capitalized } from "../../../utils/util";
/** get items column */
export const columnsPkType = ({handleChoose, handleEdit, handleDeleted})=>{
    const Link = Typography.Link;
    const LChoose = ({children, record}) => (
      <Link 
      className="text-select" 
      onClick={()=>handleChoose(record)} 
      disabled={record.status?.toLowerCase() === 'n'} >{children}</Link>
    );
    return [
      {
        title: "Packaging Type",
        key: "pktype",
        dataIndex: "pktype", 
        render: (v, record) => <LChoose record={record}>{v}</LChoose>
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 84,
        render: (v, record) => <LChoose record={record}><TagActiveStatus result={v} /></LChoose>
      },
      {
        title: "Updated By",
        dataIndex: "updated_name",
        key: "updated_name",
        render: (v, record) => <LChoose record={record}>{v}</LChoose>
      },
      {
        title: "Updated Date",
        dataIndex: "updated_date",
        key: "updated_date",
        render: (v, record) => <LChoose record={record}>{dayjs(v).format("DD/MM/YYYY")}</LChoose>
      },
      {
        title: "",
        width: 50,
        render: (v, record) => (
          <Flex gap={3}>
            <Button
              icon={<EditOutlined />} 
              className='bn-primary-outline'
              style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center'}}
              onClick={(e) => handleEdit(record) }
              size="small"
            />
            <Popconfirm 
              placement="topRight"
              title="Sure to delete?"  
              description="Are you sure to delete this sample preparation?"
              icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
              onConfirm={() => handleDeleted(record)}
            >
              <Button
                icon={<DeleteOutlined />}
                danger
                style={{ cursor: "pointer", display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                size="small"
              />
            </Popconfirm>
          </Flex>
        )
      },
    ]
};

export const columnPackagingSingle = ({handleChoose})=>{
  const Link = Typography.Link;
  const LChoose = ({children, record}) => (
    <Link 
    className="text-select" 
    onClick={()=>handleChoose(record)} 
    disabled={record.status?.toLowerCase() === 'n'} >{children}</Link>
  );
  return [
    {
      title: "Package Name",
      key: "pkname",
      dataIndex: "pkname",
      width:200,
      ...ellipsis(),
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    {
      title: "Package Name(TH)",
      key: "pknameTH",
      dataIndex: "pknameTH",
      width:180,
      ...ellipsis(),
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    {
      title: "Express Code",
      dataIndex: "expscode",
      key: "expscode", 
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    // {
    //   title: "Express Name",
    //   dataIndex: "expsname",
    //   key: "expsname", 
    //   width:200,
    //   ...ellipsis(),
    //   render: (v, record) => <LChoose record={record}>{v}</LChoose>
    // },
    // {
    //   title: "Supplier",
    //   dataIndex: "supcode",
    //   key: "supcode",
    //   render: (_, record)=> (
    //     !!record.supcode && (
    //       <LChoose record={record}>
    //         <Typography.Text>{record.supcode}/{record.supname}</Typography.Text>
    //       </LChoose>
    //     )
    //   ),
    // },
    {
      title: "Package Type",
      dataIndex: "pktype",
      key: "pktype",
      render: (h, record)=>!!h && (
        <LChoose record={record}>
          <Tag color="#3b5999" >{capitalized(h || "")}</Tag>
        </LChoose>
      ),
    },
  ]
};

const ellipsis = () => {
  return {  
    ellipsis: {
      showTitle: false,
    },
    render: (v) => (
      <Tooltip placement="topLeft" title={v}>
        {v}
      </Tooltip>
    ),  
  }
}

export const columns = ()=>{
  return [
    {
      title: "Package Name",
      key: "pkname",
      dataIndex: "pkname",
      width:200,
      ...ellipsis()
    },
    // {
    //   title: "Package Name(TH)",
    //   key: "pknameTH",
    //   dataIndex: "pknameTH",
    //   width:180,
    //   ...ellipsis()
    // },
    // {
    //   title: "Express Code",
    //   dataIndex: "expscode",
    //   key: "expscode", 
    // },
    {
      title: "Express Name",
      dataIndex: "expsname",
      key: "expsname", 
      ...ellipsis()
    },
    {
      title: "Supplier",
      dataIndex: "supname",
      key: "supname",
      render: (_, v)=>!!v.supcode && <Typography.Text>{v.supcode}/{v.supname}</Typography.Text>,
      ...ellipsis()
    },
    {
      title: "Package Type",
      dataIndex: "pktype",
      key: "pktype",
      render: (h)=>!!h && <Tag color="#3b5999" >{capitalized(h || "")}</Tag>,
    },
  ]
};