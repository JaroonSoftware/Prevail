import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';


import { customersColumn } from "./model.js";
import OptionService from '../../../service/Options.service.js';

const opservice = OptionService();

export default function ModalInvoice({show, close, values, selected}) {
    const [form] = useForm(); 

    const [customersData, setCustomersData] = useState([]);
    const [customersDataWrap, setCustomersDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);

    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false);  }, 140);
        
        //setTimeout( () => close(false), 200 );
    }

    const handleSearch = (value) => {
        if(!!value){    
            const f = customersData.filter( d => ( 
                (d.cuscode?.toLowerCase().includes(value?.toLowerCase())) || 
                (d.cusname?.toLowerCase().includes(value?.toLowerCase())
        ) ) );
             
            setCustomersDataWrap(f);            
        } else { 
            setCustomersDataWrap(customersData);            
        }

    }

    const handleChoose = (value) => {
        values(value);
        setOpenModel(false);
    }

    /** setting initial component */ 
    const column = customersColumn({handleChoose});
    const search = () =>{
        setLoading(true);
        opservice.optionsInvoice().then((res) => {
            let { data } = res.data; 
            setCustomersData(data);
            setCustomersDataWrap(data);
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
            // console.log("modal-customers");       
        } 
    }, [openModal]);

    useEffect(() => {

    }, []); // Empty dependency array ensures the effect runs once on mount
 
    return (
        <>
        <Modal
            open={openModal}
            title="เลือกใบแจ้งหนี้"
            afterClose={() => handleClose() }
            onCancel={() => setOpenModel(false) } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-customers'
        >
            <Spin spinning={loading} >
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0'}}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col span={24}>
                                    <Form.Item label="ค้นหา"  >
                                        <Input suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหาชื่อ หรือ รหัสลูกค้า'/>
                                    </Form.Item>                        
                                </Col> 
                            </Row> 
                        </Form>
                    </Card>
                    <Card style={{minHeight:'60vh' }}>
                        <Table  
                            bordered
                            dataSource={customersDataWrap}
                            columns={column}
                            rowKey="cuscode"
                            pagination={{ 
                                total:customersDataWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${customersData.length} items`,
                                defaultPageSize:25,
                                pageSizeOptions:[25,35,50,100]
                            }}
                            scroll={{ x: 'max-content', y:400 }} 
                            size='small'
                        /> 
                    </Card>
                </Space> 
            </Spin>

        </Modal>    
        </>
    )
}
