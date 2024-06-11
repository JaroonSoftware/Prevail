/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { columns } from "./modal-sample-request.model";
import SampleRequest from '../../../service/SampleRequest.service';
export default function ModalSampleRequest({show, close, values, selected}) {
    const SampleRequestService = SampleRequest();
    const [form] = useForm();

    const [sampleRequestMasterData, setSampleRequestMasterData] = useState([]);
    const [sampleRequestMasterDataWrap, setSampleRequestMasterDataWrap] = useState([]);
 
    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);
    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false);  }, 140);
        
        //setTimeout( () => close(false), 200 );
    } 
 

    const handleSearch = (value) => {
        if(!!value){    
            const f = sampleRequestMasterData.filter( d => ( 
                (
                    d.cuscode?.toLowerCase().includes(value?.toLowerCase())) || 
                    (d.cusname?.toLowerCase().includes(value?.toLowerCase())) || 
                    (d.srcode?.toLowerCase().includes(value?.toLowerCase())
                )
            ) );

            console.log(f);
             
            setSampleRequestMasterDataWrap(f);            
        } else { 
            setSampleRequestMasterDataWrap(sampleRequestMasterData);            
        }

    }
 
    const handleChoose = (value) => {
        values(value);
        setOpenModel(false);
    }

    /** setting initial component */ 
    const column = columns({handleChoose});

    const onload = () => {
        // debugger;
        setLoading(true);
        SampleRequestService.sampleRequestMaster()
        .then((res) => {
          let { status, data } = res;
          if (status === 200) {
            setSampleRequestMasterData([...sampleRequestMasterData, ...data.data]);
            setSampleRequestMasterDataWrap([...sampleRequestMasterData, ...data.data]);

          } 
        })
        .catch((err) => {  
            message.error("Request error!")
        })
        .finally( () => setTimeout( () => { setLoading(false) }, 400));
    }

    useEffect( () => {
        if( !!openModal ){
            onload();
            // console.log("modal-sample-request")
        } 
    }, [openModal]);
 
    return (
        <>
        <Modal
            open={openModal}
            title="เลือก Sample Request"
            afterClose={() => handleClose() }
            onCancel={() => setOpenModel(false) } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-sample-request'
        >
            <Spin spinning={loading} >
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col span={24}>
                                    <Form.Item label="ค้นหา"  >
                                        <Input suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหา SR No หรือ รหัสลูกค้า'/>
                                    </Form.Item>                        
                                </Col> 
                            </Row> 
                        </Form>
                    </Card>
                    <Card>
                        <Table  
                            bordered
                            dataSource={sampleRequestMasterDataWrap}
                            columns={column}
                            rowKey="srcode"
                            pagination={{ 
                                total:sampleRequestMasterDataWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${sampleRequestMasterData.length} items`,
                                defaultPageSize:25,
                                pageSizeOptions:[25,35,50,100]
                            }}
                            scroll={{ x: 'max-content' }} 
                            size='small'
                        /> 
                    </Card>
                </Space>                
            </Spin>

        </Modal>    
        </>
    )
}
