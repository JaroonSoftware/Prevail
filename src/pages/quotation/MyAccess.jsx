/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from 'antd';
import { Collapse, Form, Flex, Row, Col, Space } from 'antd';
import { Input, Button, Table, message, DatePicker, Typography } from 'antd';
import { SearchOutlined, ClearOutlined, FileAddOutlined } from '@ant-design/icons'; 
import { MdOutlineLibraryAdd } from "react-icons/md";
import { accessColumn } from "./model";

import dayjs from 'dayjs';
import QuotationService from '../../service/Quotation.service';
import {
    saveMyAccessSearchCookie,
    loadMyAccessSearchCookie,
    clearMyAccessSearchCookie,
} from '../../utils/myaccessSearchCookie';


const quotService = QuotationService(); 
const mngConfig = {title:"", textOk:null, textCancel:null, action:"create", code:null};

const RangePicker = DatePicker.RangePicker;
const QuotationAccess = () => {
    const PAGE_COOKIE_KEY = 'quotation';
    const navigate = useNavigate();
    const defaultTablePagination = { current: 1, pageSize: 25, pageSizeOptions: [10,25,35,50,100,200], showSizeChanger: true };
    
    const [form] = Form.useForm();
    const isFirstLoadRef = useRef(true);
    const getIgnoreLoading = () => {
        const ignoreLoading = !isFirstLoadRef.current;
        isFirstLoadRef.current = false;
        return ignoreLoading;
    };


    const [accessData, setAccessData] = useState([]);
    const [activeSearch, setActiveSearch] = useState([]);
    const [tablePagination, setTablePagination] = useState(defaultTablePagination);

    const getQuotationCode = (data = {}) => data?.qtcode ?? data?.quotcode;
     
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

    const buildSearchPayload = (values = {}) => {
        const data = { ...values };
        if( !!data?.qtdate ) {
            const arr = data?.qtdate.map( m => dayjs(m).format("YYYY-MM-DD") )
            const [qtdate_form, qtdate_to] = arr; 
            Object.assign(data, {qtdate_form, qtdate_to});
        }
        return data;
    };

    const requestSearch = (payload) => {
        setTimeout( () => 
            quotService.search(payload, { ignoreLoading: getIgnoreLoading()}).then( res => {
                const {data} = res.data;

                setAccessData(data);
            }).catch( err => {
                console.log(err);
                message.error("Request error!");
            })
            , 80);
    };

    const savePageState = (searchValues, pagination = tablePagination) => {
        saveMyAccessSearchCookie(PAGE_COOKIE_KEY, {
            searchValues,
            tablePagination: {
                current: pagination?.current ?? defaultTablePagination.current,
                pageSize: pagination?.pageSize ?? defaultTablePagination.pageSize,
            },
        }, 7);
    };

    const handleSearch = (forcedValues = null, paginationOverride = null) => {
        const v = forcedValues ?? form.getFieldsValue(true);
        const nextPagination = paginationOverride ?? tablePagination;
        savePageState(v, nextPagination);
        const payload = buildSearchPayload(v);
        requestSearch(payload);
    }

    const handleClear = () => {
        clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
        form.resetFields();
        setTablePagination(defaultTablePagination);
        
        handleSearch({}, defaultTablePagination)
    }
    // console.log(form);
    const hangleAdd = () => {  
        navigate("manage/create", { state: { config: {...mngConfig, title:"สร้างใบเสนอราคา", action:"create"} } }); 
    }

    const handleOrder = () => {
    navigate("order", {
      state: {
        config: {
          ...mngConfig,
          title: "จัดเรียงสินค้า",
          action: "order",
        },
      },
      replace: true,
    });
  };

    const handleEdit = (data) => {
        
        navigate("manage/edit", { state: { config: {...mngConfig, title:"แก้ไขใบเสนอราคา", action:"edit", code:data?.qtcode} }, replace:true } );
    }; 

    const handleDelete = (data) => { 
        const deleteCode = getQuotationCode(data);

        quotService.deleted(deleteCode).then( _ => {
            const tmp = accessData.filter((d) => getQuotationCode(d) !== deleteCode);

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
    const handleView = (data) => {
        navigate("view", { state: { config: {...mngConfig, title:"View", code:data?.qtcode} }, replace:true } );
    };

    const column = accessColumn( {handleEdit, handleDelete, handlePrint,handleView });
    // const column = accessColumn( {handleEdit, handlePrint });

    const handleTableChange = (pagination) => {
        const nextPagination = {
            ...defaultTablePagination,
            current: pagination?.current ?? defaultTablePagination.current,
            pageSize: pagination?.pageSize ?? defaultTablePagination.pageSize,
        };

        setTablePagination(nextPagination);
        savePageState(form.getFieldsValue(true), nextPagination);
    };

    const init = async () => {
        const restored = loadMyAccessSearchCookie(PAGE_COOKIE_KEY);
        if (restored?.searchValues || restored?.tablePagination) {
            if (restored?.searchValues) {
                form.setFieldsValue(restored.searchValues);
            }

            if (restored?.tablePagination) {
                setTablePagination({
                    ...defaultTablePagination,
                    current: restored.tablePagination.current ?? defaultTablePagination.current,
                    pageSize: restored.tablePagination.pageSize ?? defaultTablePagination.pageSize,
                });
            }

            return {
                searchValues: restored.searchValues ?? null,
                tablePagination: restored.tablePagination ?? defaultTablePagination,
            };
        }

        if (restored) {
            form.setFieldsValue(restored);
        }

        return {
            searchValues: restored,
            tablePagination: defaultTablePagination,
        };
    }
            
    useEffect( () => {
        (async () => {
            const restored = await init();
            handleSearch(restored?.searchValues ?? null, restored?.tablePagination ?? defaultTablePagination);
        })();

          

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
                                size="small"
                                className="bn-action bn-center bn-success-outline justify-center"
                                icon={<MdOutlineLibraryAdd style={{ fontSize: ".9rem" }} />}
                                onClick={() => {
                                  handleOrder();
                                }}
                              >
                                จัดเรียงสินค้า
                              </Button>
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
            <Form form={form} layout="vertical" autoComplete="off" onValuesChange={()=>{
                const nextPagination = {
                    ...tablePagination,
                    current: defaultTablePagination.current,
                };

                setTablePagination(nextPagination);
                handleSearch(null, nextPagination)
            }}>
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
                        pagination={tablePagination}
                        onChange={handleTableChange}
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