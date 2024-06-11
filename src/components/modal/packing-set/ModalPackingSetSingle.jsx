/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form } from "antd";
import { Row, Col, Space, Spin } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { columnPackingSetSingle } from "./modal-packing-set.model";

import OptionService from '../../../service/Options.service';

const optionService = OptionService();
export default function ModalPackingSetSingle({show, close, values}) {
    const [form] = useForm();

    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);

    const [loading,  setLoading] = useState(true);
    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false) }, 140);
        
        //setTimeout( () => close(false), 200 );
    } 

    const handleSearch = (value) => { 
        if(!!value){    
            const f = modalData.filter( d => {
                const text = ( d.packingset_name?.toLowerCase().includes(value?.toLowerCase()) );
                return  text;
            });
            setModalDataWrap(f);            
        } else { 
            setModalDataWrap(modalData);            
        } 
    }

    const handleChoose = (value) => {
        values(value);
        setOpenModel(false);
    }

    const column = columnPackingSetSingle({handleChoose});
    const search = () =>{
        setLoading(true);
        optionService.optionsPackingSet().then((res) => {
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
 
    return (
        <>
        <Modal
            open={openModal}
            title="Packing Set"
            okButtonProps={ {style: { display: 'none' }} }
            afterClose={() => handleClose() }
            onCancel={() => { values({}); setOpenModel(false) } } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-packingset'
            
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
            </Spin>
        </Modal>
        </>
    )
}
