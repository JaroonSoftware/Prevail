/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';

import { Modal, Card, Table, message, Form } from "antd";
import { Row, Col, Space, Spin } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { columnPackagingSingle } from "./modal-packaging.model";
import OptionService from '../../../service/Options.service'; 


export default function ModalPackagingSingle({show, close, values}) {
    const optionService = OptionService();
    const [form] = useForm();
    const inputRef = useRef(null);
    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);  

    // console.log( itemsTypeData )

    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false);  }, 140); 
    }
 

    const handleSearch = (value) => { 
        if(!!value){    
            value = value?.toLowerCase();
            const f = modalData.filter( d => {
                const text = ( 
                    d.id?.toLowerCase()?.includes(value) || 
                    d.pkname?.toLowerCase()?.includes(value) || 
                    d.expsname?.toLowerCase()?.includes(value) 
                );
                return  text;
            });
            setModalDataWrap(f);            
        } else { 
            setModalDataWrap(modalData);            
        } 
    }
    // }

    const handleSearchType = (value) => {
        if(!!value){    
            const f = modalData.filter( d => {
                const text = ( d.pktype?.toLowerCase()?.includes(value?.toLowerCase()) )  
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


    /** setting initial component */ 
    const column = columnPackagingSingle( {handleChoose} );
 
    useEffect( () => {
        const onload = () =>{
            setLoading(true);
            optionService.optionsPackaging().then(async (res) => {
                let { data } = res.data; 
                setModalData(data);
                setModalDataWrap(data);  
            })
            .catch((err) => { 
                message.error("Request error!");

                // setLoading(false);
            })
            .finally( () => setTimeout( () => { setLoading(false); }, 400));
        }        
        if( !!openModal ){
            onload();

            // console.log("modal-packages")        
        } 
    }, [openModal]); 
 
    return (
        <>
        <Modal
            open={openModal}
            title="เลือก Package"
            afterClose={() => handleClose() }
            onCancel={() => { setOpenModel(false); values({}) } } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-packaging' 
        >
            <Spin spinning={loading} >
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                    <Form.Item label="Search"  >
                                        <Input ref={inputRef} suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='Name or Code'/>
                                    </Form.Item>                        
                                </Col> 
                                <Col xs={24} sm={24} md={12} lg={12} xl={12}> 
                                    <Form.Item label="Packaging Type"  >
                                        <Input ref={inputRef} suffix={<SearchOutlined />} onChange={ (e) => { handleSearchType(e.target.value) } } placeholder='Packaging Type'/>
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
                                total:modalDataWrap?.length || 0, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${modalDataWrap?.length || 0} items`,
                                defaultPageSize:25,
                                pageSizeOptions:[25,35,50,100]
                            }} 
                            size='small'
                        /> 
                    </Card>                    
                </Space> 
            </Spin>
        </Modal>    
        </>
    )
}
