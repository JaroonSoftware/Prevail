/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from 'antd';
import { Collapse, Form, Flex, Row, Col, Space } from 'antd';
import { Input, Button, Table, message, DatePicker, Typography, Select, Modal } from 'antd';
import { SearchOutlined, ClearOutlined, FileAddOutlined } from '@ant-design/icons';
import { TfiTruck } from 'react-icons/tfi';
import { accessColumn } from "./model";

import dayjs from 'dayjs';
import SOService from '../../service/SO.service';
import DeliveryNoteService from '../../service/DeliveryNote.service';
import {
    saveMyAccessSearchCookie,
    loadMyAccessSearchCookie,
    clearMyAccessSearchCookie,
} from '../../utils/myaccessSearchCookie';


const soservice = SOService();
const dnservice = DeliveryNoteService();
const mngConfig = {title:"", textOk:null, textCancel:null, action:"create", code:null};

const RangePicker = DatePicker.RangePicker;
const MyAccess = () => {
    const PAGE_COOKIE_KEY = 'so';
    const navigate = useNavigate();
    const defaultTablePagination = { current: 1, pageSize: 25, pageSizeOptions: [10,25,35,50,100,200], showSizeChanger: true };
    
    const [form] = Form.useForm();
    const isFirstLoadRef = useRef(true);

    const [accessData, setAccessData] = useState([]);
    const [activeSearch, setActiveSearch] = useState([]);
    const [tablePagination, setTablePagination] = useState(defaultTablePagination);
 
    const getIgnoreLoading = () => {
        const ignoreLoading = !isFirstLoadRef.current;
        isFirstLoadRef.current = false;
        return ignoreLoading;
    };
    
    const CollapseItemSearch = (
        <>  
        <Row gutter={[8,8]}> 
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Sale Order Code' name='socode'>
                    <Input placeholder='Enter Sale Order Code.' />
                </Form.Item>                            
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Sale Order Date.' name='sodate'>
                    <RangePicker placeholder={['From Date', 'To date']} style={{width:'100%', height:40}}  />
                </Form.Item>
            </Col>             
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Customer PO' name='customer_po'>
                    <Input placeholder='Enter Customer PO.' />
                </Form.Item>                            
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Request By.' name='created_by'>
                    <Input placeholder='Enter First Name or Last Name.' />
                </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Product' name='stname'>
                    <Input placeholder='Enter Product Name.' />
                </Form.Item>                            
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Customer Code' name='cuscode'>
                    <Input placeholder='Enter Customer Code.' />
                </Form.Item>                            
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='Customer Name' name='cusname'>
                    <Input placeholder='Enter Customer Name.' />
                </Form.Item>
            </Col>
            <Col xs={24} sm={8} md={8} lg={8} xl={8}>
                <Form.Item label='สถานะใบขาย' name='doc_status'>
                    <Select
                        placeholder='-- ทั้งหมด --'
                        allowClear
                        style={{ width: '100%', height: 40 }}
                        options={[
                            { value: 'รอจัดเตรียมสินค้า',      label: 'รอจัดเตรียมสินค้า' },
                            { value: 'รอออกใบส่งของ',           label: 'รอออกใบส่งของ' },
                            { value: 'รอออกใบวางบิล',           label: 'รอออกใบวางบิล' },
                            { value: 'รอออกใบเสร็จรับเงิน',     label: 'รอออกใบเสร็จรับเงิน' },
                            { value: 'รอชำระเงิน',              label: 'รอชำระเงิน' },
                            { value: 'ชำระเงินยังไม่ครบ',       label: 'ชำระเงินยังไม่ครบ' },
                            { value: 'ชำระครบแล้ว',             label: 'ชำระครบแล้ว' },
                            { value: 'คืนสินค้า',               label: 'คืนสินค้า' },
                            { value: 'ยกเลิก',                  label: 'ยกเลิก' },
                        ]}
                    />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={[8,8]}>
          <Col xs={24} sm={8} md={12} lg={12} xl={12}>
              {/* Ignore */}
          </Col>
          <Col xs={24} sm={8} md={12} lg={12} xl={12}>
              <Flex justify='flex-end' gap={8}>
                  <Button type="primary" size='small' className='bn-action' icon={<SearchOutlined />} onClick={() => handleSearch()}>
                      Search
                  </Button>
                  <Button type="primary" size='small' className='bn-action' danger icon={<ClearOutlined />} onClick={() => handleClear()}>
                      Clear
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
            label: <><SearchOutlined /><span> Search</span></>,  
            children: <>{CollapseItemSearch}</>,
            showArrow: false, 
        } 
        ]}
        // bordered={false}
        />         
    );

    const buildSearchPayload = (values = {}) => {
        const data = {...values}; 
        if( !!data?.sodate ) {
            const arr = data?.sodate.map( m => dayjs(m).format("YYYY-MM-DD") )
            const [sodate_form, sodate_to] = arr; 
            Object.assign(data, {sodate_form, sodate_to});
        }
        return data;
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
        const values = forcedValues ?? form.getFieldsValue(true);
        const nextPagination = paginationOverride ?? tablePagination;
        savePageState(values, nextPagination);
        const payload = buildSearchPayload(values);
        setTimeout( () => getData(payload), 80);
    }

    const handleClear = () => {
        clearMyAccessSearchCookie(PAGE_COOKIE_KEY);
        form.resetFields();
        setTablePagination(defaultTablePagination);
        
        handleSearch({}, defaultTablePagination)
    }
    // console.log(form);
    const hangleAdd = () => {  
        navigate("manage/create", { state: { config: {...mngConfig, title:"สร้างใบขายสินค้า", action:"create"} } }); 
    }

    const handleEdit = (data) => {
        
        navigate("manage/edit", { state: { config: {...mngConfig, title:"แก้ไขใบขายสินค้า", action:"edit", code:data?.socode} }, replace:true } );
    }; 

    const handlePrintsData = (code) => {
        const url = `/so-print/${code}`;
        const newWindow = window.open('', url, url);
        newWindow.location.href = url;
      }

    // สร้างใบส่งของทันทีจากใบขายสินค้า (เลขเดียวกัน 1 SO : 1 DN ดึงรายการทั้งหมด)
    const creatingDNRef = useRef(false);
    const doCreateDN = async (record) => {
        if (!record?.socode || creatingDNRef.current) return;
        creatingDNRef.current = true;
        try {
            const res = await dnservice.getdetail_for_issue(
                { detail: [{ socode: record.socode }] },
                { ignoreLoading: true }
            );
            const rows = res?.data?.data || [];
            if (rows.length < 1) throw new Error("ไม่พบรายการสินค้าในใบขายสินค้า");

            const detail = rows.map((r) => ({
                socode: r.socode,
                stcode: r.stcode,
                qty: Number(r?.qty || 0) - Number(r?.delamount || 0),
                price: Number(r?.price || 0),
                unit: r.unit,
            }));

            const total_price = detail.reduce(
                (t, r) => t + Number(r.qty || 0) * Number(r.price || 0), 0
            );

            const header = {
                // ใช้วันที่ใบขายสินค้าเป็นวันที่ใบส่งของ
                dndate: record?.sodate
                    ? dayjs(record.sodate).format("YYYY-MM-DD")
                    : dayjs().format("YYYY-MM-DD"),
                cuscode: record.cuscode,
                total_price,
                remark: "",
            };

            await dnservice.create({ header, detail });
            message.success(`สร้างใบส่งของ ${record.socode} สำเร็จ`);
            handleSearch();
        } catch (err) {
            console.warn(err);
            message.error(err?.response?.data?.message || err?.message || "สร้างใบส่งของไม่สำเร็จ");
        } finally {
            creatingDNRef.current = false;
        }
    };

    const handleCreateDN = (record) => {
        if (!record?.socode) return;
        Modal.confirm({
            title: (
                <Flex align="center" gap={8} className="text-green-700">
                    <TfiTruck style={{ fontSize: "1.6rem" }} />
                    <span>ยืนยันการเพิ่มไปส่งของ</span>
                </Flex>
            ),
            icon: <></>,
            content: (
                <div style={{ paddingBlock: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                        ต้องการสร้าง <b>ใบส่งของ</b> จากใบขายสินค้านี้ ใช่หรือไม่
                    </div>
                    <div
                        style={{
                            background: "#f6ffed",
                            border: "1px solid #b7eb8f",
                            borderRadius: 8,
                            padding: "10px 14px",
                            lineHeight: 1.9,
                        }}
                    >
                        <div>เลขที่ใบขายสินค้า : <b>{record.socode}</b></div>
                        <div>ลูกค้า : <b>{record.cusname || record.cuscode || "-"}</b></div>
                        <div>เลขที่ใบส่งของ : <b>{record.socode}</b> (ใช้เลขเดียวกัน)</div>
                    </div>
                    <div style={{ marginTop: 8, color: "#8c8c8c", fontSize: 12 }}>
                        ระบบจะดึงรายการสินค้าทั้งหมดของใบขายนี้ไปออกใบส่งของทันที
                    </div>
                </div>
            ),
            okText: "ยืนยัน สร้างใบส่งของ",
            cancelText: "ยกเลิก",
            okButtonProps: { style: { background: "#389e0d" } },
            maskClosable: false,
            centered: true,
            width: 440,
            onOk: () => doCreateDN(record),
        });
    };

      const handleView = (data) => {
        navigate("view", { state: { config: {...mngConfig, title:"View", code:data?.socode} }, replace:true } );
    };
    

    const column = accessColumn( {handleEdit, handlePrintsData, handleView, handleCreateDN });

    const handleTableChange = (pagination) => {
        const nextPagination = {
            ...defaultTablePagination,
            current: pagination?.current ?? defaultTablePagination.current,
            pageSize: pagination?.pageSize ?? defaultTablePagination.pageSize,
        };

        setTablePagination(nextPagination);
        savePageState(form.getFieldsValue(true), nextPagination);
    };

    const getData = (data) => {
        soservice.search(data, { ignoreLoading: getIgnoreLoading()}).then( res => {
            const {data} = res.data;

            setAccessData(data);
        }).catch( err => {
            console.log(err);
            message.error("Request error!");
        });
    }

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
                  <Typography.Title className='m-0 !text-zinc-800' level={3}>หน้าจัดการใบขายสินค้า (Sales Order)</Typography.Title>
                </Flex>
            </Col>
            <Col span={12} style={{paddingInline:0}}>
                <Flex gap={4} justify='end'>
                      <Button  
                      size='small' 
                      className='bn-action bn-center bn-primary-outline justify-center'  
                      icon={<FileAddOutlined  style={{fontSize:'.9rem'}} />} 
                      onClick={() => { hangleAdd() } } >
                          เพิ่มใบขายสินค้า
                      </Button>
                </Flex>
            </Col>  
        </Flex>
    );    
    return (
    <div className='so-access' id="area">
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
                        rowKey="socode" 
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

export default MyAccess;