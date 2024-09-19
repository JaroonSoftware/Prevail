/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from 'antd';
import { Collapse, Form, Flex, Row, Col, Space } from 'antd';
import { Input, Button, Table, message, DatePicker, Typography } from 'antd';
import { SearchOutlined, ClearOutlined, FileAddOutlined } from '@ant-design/icons'; 
import { accessColumn } from "./model";

import dayjs from 'dayjs';
import QuotationService from '../../service/Quotation.service';


const quotService = QuotationService(); 
const mngConfig = {title:"", textOk:null, textCancel:null, action:"create", code:null};

const RangePicker = DatePicker.RangePicker;
const QuotationAccess = () => {
    const navigate = useNavigate();
    
    const [form] = Form.useForm();

    const [accessData, setAccessData] = useState([]);
    const [activeSearch, setActiveSearch] = useState([]);
     
    const CollapseItemSearch = (
        <>  
        <Row gutter={[8,8]}> 
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='เลขที่ใบเสนอราคา' name='qtcode'>
                <Input placeholder='กรอกเลขที่ใบรับสินค้า' />
                </Form.Item>                            
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='วันที่ใบเสร็จรับเงิน' name='qtdate'>
                    <RangePicker placeholder={['เริ่มวันที่', 'ถึงวันที่']} style={{width:'100%', height:40}}  />
                </Form.Item>
            </Col> 
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='จัดทำโดย' name='created_by'>
                    <Input placeholder='กรอก ชื่อ-นามสกุล ผู้จัดทำ' />
                </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='รหัสลูกค้า' name='cuscode'>
                    <Input placeholder='กรอกรหัสลูกค้า' />
                </Form.Item>                            
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='ชื่อลุูกค้า' name='cusname'>
                    <Input placeholder='กรอกชื่อลูกค้า' />
                </Form.Item>                            
            </Col>
        </Row>
        <Row gutter={[8,8]}>
          <Col xs={24} sm={8} md={12} lg={12} xl={12}>
              {/* Ignore */}
          </Col>
          <Col xs={24} sm={8} md={12} lg={12} xl={12}>
          <Flex justify="flex-end" gap={8}>
            <Button
              type="primary"
              size="small"
              className="bn-action"
              danger
              icon={<ClearOutlined />}
              onClick={() => handleClear()}
            >
              ล้าง
            </Button>
            <Button
              type="primary"
              size="small"
              className="bn-action"
              icon={<SearchOutlined />}
              onClick={() => handleSearch()}
            >
              ค้นหา
            </Button>
          </Flex>
        </Col>
        </Row> 
        </>
    )

    const FormSearch = (
        <Collapse 
        size="small"                    
        onChange={(e) => { setActiveSearch(e) }}
        activeKey={activeSearch} 
        items={[
        { 
            key: '1', 
            label: <><SearchOutlined /><span> ค้นหา</span></>,  
            children: <>{CollapseItemSearch}</>,
            showArrow: false, 
        } 
        ]}
        // bordered={false}
        />         
    );

    const handleSearch = () => {
        
        form.validateFields().then((v) => {
            const data = { ...v };
            if( !!data?.qtdate ) {
                const arr = data?.qtdate.map( m => dayjs(m).format("YYYY-MM-DD") )
                const [qtdate_form, qtdate_to] = arr; 
                //data.created_date = arr
                Object.assign(data, {qtdate_form, qtdate_to});
            }
            setTimeout( () => 
                quotService.search(data, { ignoreLoading: Object.keys(data).length !== 0}).then( res => {
                    const {data} = res.data;
        
                    setAccessData(data);
                }).catch( err => {
                    console.log(err);
                    message.error("Request error!");
                })
                , 80);
      
          });
    }

    const handleClear = () => {
        form.resetFields();
        
        handleSearch()
    }
    // console.log(form);
    const hangleAdd = () => {  
        navigate("manage/create", { state: { config: {...mngConfig, title:"สร้างใบเสนอราคา", action:"create"} } }); 
    }

    const handleEdit = (data) => {
        
        navigate("manage/edit", { state: { config: {...mngConfig, title:"แก้ไขใบเสนอราคา", action:"edit", code:data?.qtcode} }, replace:true } );
    }; 

    const handleDelete = (data) => { 
        // startLoading();
        quotService.deleted(data?.quotcode).then( _ => {
            const tmp = accessData.filter( d => d.quotcode !== data?.quotcode );

            setAccessData([...tmp]); 
        })
        .catch(err => {
            console.log(err);
            message.error("Request error!");
        });
    }; 

    const handlePrint = (code) => { 
        const url = `/quo-print/${code}`;
        const newWindow = window.open('', url, url);
        newWindow.location.href = url;
      }
    

    const column = accessColumn( {handleEdit, handleDelete, handlePrint });
    // const column = accessColumn( {handleEdit, handlePrint });

    const getData = (data) => {
        handleSearch()
    }

    const init = async () => {
        getData({});
    }
            
    useEffect( () => {
        init();

          

        return  async () => { 
            //console.clear();
        }
    }, []);
    const TitleTable = (
        <Flex className='width-100' align='center'>
            <Col span={12} className='p-0'>
                <Flex gap={4} justify='start' align='center'>
                  <Typography.Title className='m-0 !text-zinc-800' level={3}>หน้าจัดการใบเสนอราคา (Quotation)</Typography.Title>
                </Flex>
            </Col>
            <Col span={12} style={{paddingInline:0}}>
                <Flex gap={4} justify='end'>
                      <Button  
                      size='small' 
                      className='bn-action bn-center bn-primary-outline justify-center'  
                      icon={<FileAddOutlined  style={{fontSize:'.9rem'}} />} 
                      onClick={() => { hangleAdd() } } >
                          เพิ่มใบเสนอราคา
                      </Button>
                </Flex>
            </Col>  
        </Flex>
    );    
    return (
    <div className='quotation-access' id="area">
        <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative' }} >
            <Form form={form} layout="vertical" autoComplete="off" onValuesChange={()=>{ handleSearch(true)}}>
                {FormSearch}
            </Form> 
            <Card>
                <Row gutter={[8,8]} className='m-0'>
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                        <Table 
                        title={()=>TitleTable} 
                        size='small' 
                        rowKey="qtcode" 
                        columns={column} 
                        dataSource={accessData} 
                        scroll={{ x: 'max-content' }} 
                        />
                    </Col>
                </Row>         
            </Card>
        </Space>
    </div>
    );
}

export default QuotationAccess;