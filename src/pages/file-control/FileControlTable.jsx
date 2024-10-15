import React from 'react';
import { Popconfirm, Table } from 'antd';
import { message, Button } from 'antd';
import { Tag, Space } from 'antd';
import { DeleteOutlined, EditOutlined, QuestionCircleOutlined  } from '@ant-design/icons';
import dayjs from 'dayjs'; 

import  FileService from "../../service/FileControl.service";
import { formatFileSize } from "../../utils/util"
const fileService = FileService();

const FileControlTable = ({ data, onEdit, noExpire, onDelete }) => { 

const columns = [
  {
    title: 'ลำดับ',
    dataIndex: 'seq',
    key: 'seq',
  },
  {
    title: 'ชื่อไฟล์',
    dataIndex: 'file_name',
    key: 'file_name',
    render: (_, { title_name, file_uuid, file_name }) => (
    <Button type="link" style={{padding:0}}
      title={file_name}
      onClick={()=>{ 
        fileService.fileDownload(file_uuid).catch( (err,ind) => {
          // console.log(err, ind); 
          message.error( "File download not found in server" ); 
        }); 
      }}>{title_name}</Button>
    ),
  },
  {
    title: 'ขนาดไฟล์',
    dataIndex: 'file_size',
    key: 'file_size',
    render: (_, { file_size }) => formatFileSize(file_size),
  },
  {
    title: 'วันหมดอายุ',
    dataIndex: 'expire_date',
    key: 'expire_date',
    render: (_, { expire_date }) => dayjs(expire_date).format("DD/MM/YYYY"),
    hidden: noExpire,
  },
  {
    title: 'สถานะ',
    dataIndex: 'expire_date_status',
    key: 'expire_date_status',
    render: (_, { expire_date }) => {
      const currDay = dayjs();
      const exprDay = dayjs(expire_date);
      if( exprDay.isBefore(currDay) ){
        return <Tag color="#cd201f">expire</Tag>
      }else return <Tag color="#87d068">active</Tag>
    },
    hidden: noExpire, 
  },
  {
    title: 'หมายเหตุ',
    dataIndex: 'description',
    key: 'description',
  }, 
  {
    title: 'ตัวเลือก',
    width: 90,
    fixed: 'right',
    render: ({file_uuid}) => (
      <Space> 
        <Button size='small' 
          onClick={()=>{ onEdit(file_uuid) }} 
          // style={{lineHeight:'1rem', backgroundColor: '#0958d9', color: '#fff',borderColor: '#0958d9'  }}
          className='bn-primary bn-center justify-center'
          icon={<EditOutlined />}
        /> 
        <Popconfirm
            placement="topRight"
            title="Sure to delete?"  
            description="Are you sure to delete this file?"
            icon={<QuestionCircleOutlined className='text-orange-600' />}
            onConfirm={() => onDelete(file_uuid)}        
        
        >
          <Button size='small' 
            className='bn-danger !text-white hover:!border-red-800 bn-center justify-center'
            icon={<DeleteOutlined />}
          /> 
        </Popconfirm>

      </Space>
    ),
  },
  // Add more columns as needed
].filter( f => !f.hidden );




  return <Table dataSource={data} columns={columns} rowKey="file_uuid" scroll={{ x: 'max-content' }} size='small' />;
};

export default FileControlTable;