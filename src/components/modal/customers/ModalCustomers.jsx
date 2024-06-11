import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space, Drawer } from "antd";
import { Input, Typography } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { ModalCustomersManage } from './modal-customers.js';

import { customersColumn } from "./modal-customers.model";
import CustomerService from '../../../service/Customer.Service.js'; 
import OptionService from '../../../service/Options.service';

const ctmService = CustomerService();
const opservice = OptionService();

export default function ModalCustomers({show, close, values, selected}) {
    const [form] = useForm(); 

    const [customersData, setCustomersData] = useState([]);
    const [customersDataWrap, setCustomersDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);

    const [openManage,  setOpenManage] = useState(false);  
    const [isSmallScreen, setIsSmallScreen] = useState(false);
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

    const manageSubmit = ( v ) => {
        setOpenManage(false);
        setLoading(true); 
        const action = ctmService.create;

        action({...v}).then( _ =>  {
            search();
        }).catch( err => {
            console.warn(err);
            const data = err?.response?.data;
            message.error( data?.message || "error request");
        })
        .finally( () => {
            setTimeout( () => { setLoading(false) }, 300);
        });
        setOpenManage(false);
    }

    /** setting initial component */ 
    const column = customersColumn({handleChoose});
    const search = () =>{
        setLoading(true);
        opservice.optionsCustomer().then((res) => {
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

    const handleResize = () => {
      setIsSmallScreen(window.matchMedia('(max-width: 767px)').matches);
    };

    useEffect(() => {
      handleResize(); // Set initial screen size

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []); // Empty dependency array ensures the effect runs once on mount
 
    return (
        <>
        <Modal
            open={openModal}
            title="Select Customer"
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
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col span={24}>
                                    <Typography.Link onClick={()=>{ setOpenManage(true); }} className='ps-1'>
                                        <span className='hover:underline underline-offset-1'>Create Customer</span>
                                    </Typography.Link> 
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
                    { openManage &&
                    <Drawer
                        destroyOnClose={true}
                        title="Create Customer"
                        width={isSmallScreen ? '100%' : '50vw'}
                        className='custom-drawer-class'
                        onClose={()=>{setOpenManage(false)}}
                        open={openManage} 
                        styles={{ body: { padding: '0px 24px 8px' } }}
                        getContainer={() => document.querySelector(".modal-customers")}
                    >
                        <ModalCustomersManage submit={(val)=>manageSubmit(val)} /> 
                    </Drawer>}
                </Space> 
            </Spin>

        </Modal>    
        </>
    )
}
