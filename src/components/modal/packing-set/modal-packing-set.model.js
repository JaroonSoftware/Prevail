import { DeleteOutlined, EditOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Space, Tag, Tooltip, Typography } from 'antd';

import dayjs from 'dayjs';
import { capitalized } from '../../../utils/util';

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

export const columnPackingSet = ()=>{
  return [
    {
      title: "Packing Set Name",
      key: "packingset_name",
      dataIndex: "packingset_name",
      width:200,
      ...ellipsis()
    }, 
    {
      title: "Packing Set Group",
      dataIndex: "packingset_group",
      key: "packingset_group",
      render: (h)=>!!h && <Tag color="#3b5999" >{capitalized(h || "")}</Tag>,
    },
    {
      title: "Unit Per Cost",
      dataIndex: "unit_cost",
      key: "unit_cost", 
      width:'12%',
      align: "right",
      className:'!pe-3',
    },
    {
      title: "Fill Volume",
      dataIndex: "fill_volume",
      key: "fill_volume",
      width:'12%',
      align: "right",
      className:'!pe-3', 
    },
    {
      title: "Request By",
      dataIndex: "updated_name",
      key: "updated_name", 
    },
  ]
};

export const columnPackingSetSingle = ({handleChoose})=>{
  const Link = Typography.Link;
  const LChoose = ({children, record}) => (
    <Link 
    className="text-select" 
    onClick={()=>handleChoose(record)} 
    disabled={record.status?.toLowerCase() === 'n'} >{children}</Link>
  );
  return [
    {
      title: "Packing Set Name",
      key: "packingset_name",
      dataIndex: "packingset_name",
      width:200,
      ...ellipsis(),
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    }, 
    {
      title: "Packing Set Group",
      dataIndex: "packingset_group",
      key: "packingset_group",
      render: (h)=>!!h && <Tag color="#3b5999" >{capitalized(h || "")}</Tag>,
    },
    {
      title: "Unit Per Cost",
      dataIndex: "unit_cost",
      key: "unit_cost", 
      width:'12%',
      align: "right",
      className:'!pe-3',
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    {
      title: "Fill Volume",
      dataIndex: "fill_volume",
      key: "fill_volume",
      width:'12%',
      align: "right",
      className:'!pe-3',
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
    {
      title: "Request By",
      dataIndex: "updated_name",
      key: "updated_name",
      render: (v, record) => <LChoose record={record}>{v}</LChoose>
    },
  ]
};

export const columnPackingsetGroup = ({handleChoose, handleEdit, handleDeleted})=>{
    const Link = Typography.Link;
    const LChoose = ({children, record}) => (
      <Link 
      className="text-select" 
      onClick={()=>handleChoose(record)} 
      disabled={record.status?.toLowerCase() === 'n'} >{children}</Link>
    );
    return [
      {
        title: "Packaging Type Group",
        key: "packingset_group",
        dataIndex: "packingset_group", 
        render: (v, record) => <LChoose record={record}>{v}</LChoose>
      }, 
      {
        title: "Crated By",
        dataIndex: "created_name",
        key: "created_name",
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
          <Space >
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
              description="Are you sure to delete this Packing set group?"
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
          </Space>
        )
      },
    ]
};