/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form, Drawer, Typography } from "antd";
import { Row, Col, Space, Spin } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { columnsPkType } from "./modal-packaging.model";
import PackagingTypeManage from './PackagingTypeManage';


import OptionService from '../../../service/Options.service';
import PackagingService from '../../../service/Packaging.service';

const pkservice =  PackagingService();
export default function ModalPackagingType({show, close, values}) {
    const optionService = OptionService();
    const [form] = useForm();

    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [openManage,  setOpenManage] = useState(false);
    const [manageInit,  setManageInit] = useState({});

    const [loading,  setLoading] = useState(true);
    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false) }, 140);
        
        //setTimeout( () => close(false), 200 );
    }

    const handleSubmit = (v) => {
        setLoading(true);

        const action = (v) => !v?.id ? pkservice.createType({...v}) : pkservice.updateType({...v});

        action(v).then( _ =>  {
            search();
        }).catch( err => {
            console.warn(err);
            const data = err?.response?.data;
            message.error( data?.message || "error request");
        })
        .finally( () => {
            setTimeout( () => { setLoading(false) }, 300);
            setOpenManage(false);
        });
        // values([...itemsList, ...selected]);
        // setItemsList([]);
    }

    const handleSearch = (value) => {
        if(!!value){    
            const f = modalData.filter( d => ( d.pktype?.toLowerCase().includes(value?.toLowerCase()) ) );
             
            setModalDataWrap(f);
        } else { 
            setModalDataWrap(modalData);            
        }

    }

    const handleChoose = (value) => {
        values(value);
        setOpenModel(false);
    }

    const handleEdit = (record) => {
        setManageInit({...record, status:record?.status?.toLowerCase() === 'y'});
        setOpenManage(true);
    } 

    const handleDeleted = (record) => {
        setLoading(true);
        pkservice.deleteType(record?.id || 0).then( _ =>  {
            search();
        }).catch( err => {
            console.warn(err);
            const data = err?.response?.data;
            message.error( data?.message || "error request");
        })
        .finally( () => {
            setTimeout( () => { setLoading(false) }, 300);
            setOpenManage(false);
        });
    }

    /** setting initial component */ 
    const column = columnsPkType({handleChoose, handleEdit, handleDeleted});

    const search = () =>{
        setLoading(true);
        optionService.optionsPackaging({p:'type'}).then((res) => {
            let { data } = res.data; 
            setModalData(data);
            setModalDataWrap(data);
            // console.log(modalData, data) 
        })
        .catch((err) => { 
            console.warn(err);
            const data = err?.response?.data;
            message.error( data?.message || "error request");  
            // setLoading(false);
        })
        .finally( () => setTimeout( () => { setLoading(false) }, 400));
    }
    
    useEffect( () => {
    
        if( !!openModal ){
            search();
            // console.log("modal-packages")        
        } 
    }, [openModal]);

    /** setting child component */
    // const ButtonModal = (
    //     <Space direction="horizontal" size="middle" >
    //         <Button type='primary' onClick={() => handleConfirm() }>ยืนยันการเลือกสินค้า</Button>
    //         <Button onClick={() => setOpenModel(false) }>ปิด</Button>
    //     </Space>
    // )
    /** */
    return (
        <>
        <Modal
            open={openModal}
            title="Packaging Type"
            okButtonProps={ {style: { display: 'none' }} }
            afterClose={() => handleClose() }
            onCancel={() => { values({}); setOpenModel(false) } } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-packaging-type'
            
        >
            <Spin spinning={loading}>
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col span={24}>
                                    <Form.Item label="ค้นหา"  >
                                        <Input suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหา'/>
                                    </Form.Item>                        
                                </Col> 
                            </Row> 
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col span={24}>
                                    <Typography.Link onClick={()=>{ setManageInit({}); setOpenManage(true); }} className='ps-1'>
                                        <span className='hover:underline underline-offset-1'>Create Packaging Type</span>
                                    </Typography.Link> 
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    <Card  style={{minHeight:'60vh'}}>
                        <Table
                            bordered
                            dataSource={modalDataWrap}
                            columns={column}
                            rowKey="id"
                            pagination={{ 
                                total:modalDataWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${modalData.length} items`,
                                defaultPageSize:10,
                                pageSizeOptions:[10,15,50,100]
                            }} 
                            size='small'
                            scroll={{ x: 'max-content' }}
                        /> 
                    </Card>
                </Space> 
                { openManage &&
                <Drawer
                    title="Create packaging type"
                    className='md:w-1/2 lg:w-1/2 w-full'
                    onClose={()=>{setOpenManage(false)}}
                    open={openManage}
                    getContainer={() => document.querySelector(".modal-packaging-type")}
                >
                    <PackagingTypeManage submit={(val)=>handleSubmit(val)} initial={manageInit} /> 
                </Drawer>}
            </Spin>
        </Modal>
        </>
    )
}
