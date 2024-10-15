/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
// import { capitalized } from "../../utils/util"; 
import { Form, Input, Button, Select, message, Typography } from 'antd';
import { Space, Row, Col } from 'antd';
import { Collapse, Card } from 'antd';
import dayjs from 'dayjs';
import { FileSearchOutlined, SearchOutlined, ClearOutlined, DoubleRightOutlined, UploadOutlined  } from '@ant-design/icons';

import FileService from "../../service/FileControl.service"
import { FileControlTable, FileControlForm } from "./file-control";  

const fileService = FileService();

export default function FileControl({refs, refcode, title, noExpire=false}){
    const [documentList, setDocumentList] = useState([]);
    const [formSearch] = Form.useForm();
    const [isOpenUpload, setIsOpenUpload] = useState(false);
    const [isReferent] = useState((!!refs && !!refcode));
    
    const [fileSource, setFileSource] = useState([]);
    const [initSource, setInitSource] = useState({});

    const [code, setCode] = useState(refcode);
    const [table, setTable] = useState(refs);
    const [des, setDes] = useState(title);

    useEffect( () => { 
      if(isReferent){
        handleFormSubmit({reftable:refs, refcode:refcode});
        setDes(`แนบไฟล์ สำหรับ Code : ${refcode || 'error'}`);
      } else {
        setDes(`แนบไฟล์`);
      }

      // console.log('Effect ran with updated dependencies', isReferent, refcode, refs);
    }, []); 

    const handleFormSubmit = (values = null) => {
      const p = values;
      p.refcode = p.refcode || refcode;
      p.ref = p.ref || refs;
      fileService.fileGetData(p).then( res => { 
        const {data} = res.data;
        setDocumentList(data);
      }); 
    }; 

    const handleEditFile = (id) => {
      fileService.fileGetList(id).then( res => {
        const {data} = res.data;
        if( data.length > 0){
          setFileSource(data.map( d => ({
              uid: d?.file_uuid,
              name: d?.file_name,
              status: 'done',
              //url: `${BACKEND_URL}/files-control/get-filelist.php?id=${d?.file_uuid || ""}`, 
            }))
          );
          setInitSource({ ...data[0], expire_date:dayjs(data[0]?.expire_date)});
          setCode(data[0]?.refcode);
          setTable(data[0]?.ref);

          setDes(`(แก้ไข) แนบไฟล์ สำหรับ Code : ${data[0]?.refcode || 'error'}`);
          setIsOpenUpload(true);
        } else {
          message.error("Error: not found data.")
        }
      });
    }

    const handleDeleteFile = (id) => {
      fileService.fileDelete(id).then( res => { 
        handleFormSubmit({reftable:refs, refcode:refcode});
      }).catch( e => {
        console.log( e );

        message.error("delete file fail.")
      })
    }
    
    const hendleClosedForm = (value) => {
      setFileSource([]);
      setInitSource({});
      setIsOpenUpload(false); 
      handleFormSubmit({ref_table:refs, ref_code:refcode});
    }

    const fileOptionRef = [
      { value: "items", label: 'Items' }, 
    ]

    const searchItems = [ 
      {
        key: '1',
        label: isReferent 
          ? <span><b>Refer</b> {`${refs} `} <DoubleRightOutlined /> {`code :  ${refcode}`}</span> 
          : <Space><FileSearchOutlined /> <span>ค้นหาไฟล์</span></Space>,
        children: (
          <Form form={formSearch} onFinish={handleFormSubmit} layout="vertical">
            { !isReferent && 
              <Row gutter={[16,8]}>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item label="ไฟล์อ้างอิง" name="ref" >
                    <Select
                      placeholder="เลือกไฟล์อ้างอิง"
                      style={{height:40}}
                      options={fileOptionRef}
                      allowClear={true}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Form.Item label="รหัสอ้างอิง" name="ref_code"  >
                    <Input placeholder="ค้นหารหัสอ้างอิง" autoComplete='off' />
                  </Form.Item>
                </Col>
              </Row>
            }
            <Row gutter={[16,8]}>
              {/* <Col xs={24} sm={24} md={12}>
                <Form.Item label="ชื่อไฟล์" name="file_name" >
                  <Input placeholder="ค้นหาชื่อไฟล์" autoComplete='off' />
                </Form.Item>
              </Col> */}
              <Col xs={24} sm={24} md={24}>
                <Form.Item label="หัวข้อไฟล์" name="upload_type" >
                  <Input placeholder="ค้นหาหัวข้อไฟล์" autoComplete='off' />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={24} md={12}> </Col>
              <Col xs={24} sm={24} md={12}>
                <Row justify='end' >
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit"><SearchOutlined /> ค้นหา</Button>
                      <Button htmlType="reset"><ClearOutlined /> ล้างข้อมูล</Button>                      
                    </Space> 
                  </Form.Item>                  
                </Row>
              </Col>
            </Row> 
          </Form>
        ),
        showArrow: false,
        extra: isReferent && 
        <Typography.Link 
        style={{lineHeight:1, fontWeight:400}} 
        onClick={()=>{ setIsOpenUpload(true);  }}
        className='hover:underline underline-offset-1'
        ><UploadOutlined /> อัพโหลดไฟล์</Typography.Link>
      },
    ];       

    return !isOpenUpload ? (
      <Space direction="vertical" className='width-100 files-control' >
        <Collapse defaultActiveKey={(!refs && !refcode) ? ['1'] : null}  items={searchItems} /> 
        <Card bordered={false}>
          <FileControlTable 
          data={documentList} 
          onEdit={(v)=>{ handleEditFile(v) }} 
          onDelete={(v)=>{ handleDeleteFile(v) }}
          noExpire={noExpire}  
          ></FileControlTable> 
        </Card>
      </Space> 
    ) :
    (
      <FileControlForm 
        title = {des} 
        refcode = {code}
        refs = {table}
        closed={ (v) => { hendleClosedForm(v) }} 
        fileSource={fileSource}
        initForm={initSource}
        noExpire={noExpire}
      />
    );
}