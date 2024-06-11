/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';

import { Modal, Card, Table, message, Form, Typography, Flex } from "antd";
import { Row, Col, Space, Spin } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { FaTruckLoading } from "react-icons/fa";
import { useForm } from 'antd/es/form/Form';
 
import { columnsLoadingType } from "./modal-shipping-type.model";
// import { BsUiChecks } from "react-icons/bs"; 
 
import OptionService from '../../../service/Options.service';
import "./modal-shipping-type.css";
const optionService = OptionService();

export default function ModalLoadingType({show, close, values, packingset=null}) {
    const [form] = useForm();
    const inputRef = useRef(null);
    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);  

    const containerStyle = {
        position: 'relative',
        overflow: 'hidden',
      };
    // console.log( itemsTypeData )

    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false);  }, 140);
        
        //setTimeout( () => close(false), 200 );
    }

    // const handleConfirm = () => {
    //     // console.log(itemsList); 
    //     // values([...itemsList, ...selected]);
    //     // setItemsList([]);
    //     setOpenModel(false);
    // }

    const handleSearch = (value) => {  
        const input =  value?.toLowerCase();
        if(!!value){    
            const f = modalData.filter( d => {
                const text = ( 
                    d.loadingtype_name?.toLowerCase()?.includes(input) 
                );
                return  text;
            });
            setModalDataWrap(f);
        }  else setModalDataWrap(modalData); 
    }

    const handleChoose = (value) => { 
        const { loaddingtype_id, loadingtype_qty } = value;
        values({...value, loadingtype_qty :Number(loadingtype_qty || 0 ), loaddingtype_id });
        setOpenModel(false);
    } 
 

    /** setting initial component */ 
    const column = columnsLoadingType({handleChoose});

    const onload = () =>{
        setLoading(true);
        optionService.optionsLoadingType({pkset: packingset}, { ignoreLoading : true }).then(async (res) => {
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

    useEffect( () => {
      
        if( !!openModal ){
            onload(); 
            // console.log("modal-packages")        
        } 
    }, [openModal]);

    /** setting child component */

    /** */

    return (
        <>
        <div className='modal-loading-type-list'>
            <Modal
                open={openModal}
                title={<Flex align='center' gap={4}><FaTruckLoading /><Typography.Text className='ms-1 mb-0'>Loading Type</Typography.Text></Flex>}
                afterClose={() => handleClose() }
                onCancel={() => setOpenModel(false) } 
                maskClosable={false}
                style={{ top: 20 }}
                width={800}
                className='modal-loading-type'
                footer={<></>}
            >
                <Spin spinning={loading} >
                    <div style={containerStyle}>

                        <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}} className='current'  >
                            <Card style={{backgroundColor:'#f0f0f0' }}>
                                <Form form={form} layout="vertical" autoComplete="off" >
                                    <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                        <Col span={24}>
                                            <Form.Item label="ค้นหา"  >
                                                <Input ref={inputRef} suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหาชื่อ หรือ รหัส'/>
                                            </Form.Item>                        
                                        </Col> 
                                    </Row>
                                </Form>
                            </Card>
                            <Card style={{minHeight:'60vh'}}>
                                <Table
                                    // bordered={false}
                                    dataSource={modalDataWrap}
                                    columns={column}
                                    rowKey="loaddingtype_id"
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
                    </div>

                </Spin>
            </Modal>                
        </div>

        </>
    )
}