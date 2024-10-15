/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons'; 
import { message, Upload, Form, Modal } from 'antd';
import { Col, Row, Card, Space } from 'antd';

import { Button, AutoComplete, DatePicker, Input, Typography } from 'antd';
import locale from 'antd/es/date-picker/locale/th_TH';
import dayjs from 'dayjs';

import  FileService from "../../service/FileControl.service";

const { TextArea } = Input;
const { Dragger } = Upload;
const fileService = FileService();

export default function FileControlForm({refs, refcode, title, closed, fileSource, initForm, noExpire}){
  const [options, setOptions] =  useState([]);
  const [formFileDetail] = Form.useForm();
  const [formDataInit, setDataInit] = useState(initForm || {}); 
  const [fileList, setFileList] = useState([]); 

  useEffect( () => {
    const initial = async () => {
      try{
        const res = await fileService.uploadTypeOption();

        const {data} = res.data;
        
        const opn = data.map( v => ({value:v.text}));
        setOptions( opn );
        setFileList(fileSource || {});
        setDataInit({...initForm || {}});      
      }catch (err) {
        console.log(err)
        const { statusText } = err.response;    
        message.error( statusText || 'upload failed.');       
      }      
    }

    initial();


    //console.log(ref, refcode);
  }, []);

  const props = {
    name: 'file',
    multiple: false,
    action: '',
    maxCount:1,
    beforeUpload:Upload.LIST_IGNORE,
    fileList:fileList, 
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        //console.log(info.file, info); 
        setFileList(info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
    showUploadList: {
      showDownloadIcon: true,
      downloadIcon: <Typography.Link><DownloadOutlined /></Typography.Link>, 
    },
    onDownload(e){
      fileService.fileDownload(e.uid).catch( err => { 
        const {status, statusText} = err.response;    
        message.error(status === 404 ? "File download not found in server" : statusText || 'upload failed.'); 
      }); 
    }
  };

  const showConfirmationUpload = () => {
    return new Promise((resolve, reject) => {
      Modal.confirm({
        title: 'ไฟล์ที่อัพเดทเป็นไฟล์เดิม',
        content: 'ไฟล์ที่อัพเดทเป็นไฟล์เดิม ต้องการที่จะดำเนินการต่อหรือไม่',
        onOk: () => resolve(true),
        onCancel: () => reject(false),
      });
    });
  };
  
  const handleUpload = async () => {
    const formData = new FormData();
    if(fileList.length < 1){
      message.warning('please attach your file.');
      return;
    } 

    for( let file of fileList){
      file.uploading = true;
      if(!file?.originFileObj && !!formDataInit?.file_uuid){
        const c = await showConfirmationUpload();
        if( !c ) continue; 

        formData.append('files[]', null);
      }else{
        formData.append('files[]', file?.originFileObj); 
      }       
    }
    // fileList.forEach( async (file) => {
    //   console.log(file);
    //   file.uploading = true;
    //   if(!file?.originFileObj && !!formDataInit?.file_uuid){
    //     await confirm({
    //       title: 'ไฟล์ที่อัพเดทเป็นไฟล์เดิม',
    //       content: 'ไฟล์ที่อัพเดทเป็นไฟล์เดิม ต้องการที่จะดำเนินการต่อหรือไม่',
    //       onOk() {
    //         formData.append('files[]', null); 
    //       },
    //       onCancel() {
    //         console.log('Cancel');
    //       },
    //     });        
    //   }else{
    //     formData.append('files[]', file?.originFileObj); 
    //   } 
    // });

    setFileList([{ ...fileList[0], status:'uploading'}]);
    formFileDetail.validateFields().then((values) => { 
      values = { 
        ...values,  
        expire_date : !noExpire && !!values.expire_date ? dayjs(values.expire_date).format("YYYY-MM-DD") : '9999-12-31'
      };

      formData.append('data', JSON.stringify({...formDataInit, ...values}));
      formData.append('refcode', refcode);
      formData.append('ref', refs);
      formData.append('action', !!formDataInit?.file_uuid ? "edit" : "add");
 
      fileService.fileUpload(formData).then( res => {
        formFileDetail.resetFields();
        setFileList([{ ...fileList[0], status:'done', uploading:false}]);
        message.success('upload successfully.');
        setFileList([]);
        closed(false);
      })
      .catch((e) => {
        const {data} = e.response;
        message.error(data?.message || 'upload failed.');
        setFileList([{ ...fileList[0], status:'error', error:{message:data?.message || 'upload failed.'}, uploading:false}]);
        console.log(fileList); 
      })
      .finally(() => { 
        //Ignore
      });
    })
    .catch((info) => {
      // console.log("Validate Failed:", info);
      message.warning('please input field.');
    });

  };

  const onChange = (date, dateString) => {
    // console.log(date, dateString);
  };

  const handleClose = () => {
    setFileList([]);
    formFileDetail.resetFields();
    closed(false)
  }

  return (
    <> 
    <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative' }} className='files-control' >
      <Card bordered={false}>
        <Dragger {...props} className='files-control'>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">
            Support for a single or bulk upload. Strictly prohibited from uploading company data or other
            banned files.
          </p>
        </Dragger>  
      </Card> 
  
      <Card bordered={false} title={!!title ? title : null }>
        <Form form={formFileDetail} layout="vertical" initialValues={formDataInit} >
          <Row gutter={{xs: 8,sm: 16,md: 24,lg: 32, }}> 
              <Col xs={24} sm={24} lg={noExpire ? 24 : 12}>
                <Form.Item label="หัวข้อไฟล์ไฟล์" name="title_name" rules={[{ required: true, message: 'กรุณากรอก หัวข้อไฟล์' }]}  >
                  <AutoComplete
                    style={{ height: 40 }}
                    options={options}
                    placeholder="หัวข้อไฟล์"
                    filterOption={(inputValue, option) =>
                      option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} lg={12}>
                <Form.Item label="วันหมดอายุ" name="expire_date" rules={[{ required: false, message: 'กรุณากรอก วันหมดอายุ' }]} hidden={noExpire} > 
                  <DatePicker style={{ height: 40 }} placeholder="วันหมดอายุ" locale={locale} className='width-100' onChange={onChange} />
                </Form.Item>
              </Col> 
              <Col xs={24} sm={24} >
                <Form.Item label="คำอธิบาย" name="description" > 
                  <TextArea rows={2} placeholder="คำอธิบาย" maxLength={500} className='ant-input width-100' style={{fontWeight:400, color:'#000'}} />
                  {/* <textarea style={{ height: 40 }} placeholder="คำอธิบาย" className='ant-input width-100' onChange={onChange} ></textarea> */}
                </Form.Item>
              </Col> 
          </Row> 
          <Row>
            <Col lg={24}>
              <Space>
                <Button type="primary" onClick={handleUpload}>
                  Comfirm Upload
                </Button>
                <Button onClick={()=>{ handleClose() }}>
                  Cancle
                </Button>                
              </Space> 
            </Col>
          </Row>
        </Form> 
      </Card> 
    </Space> 
    </>
  
  );
}

 