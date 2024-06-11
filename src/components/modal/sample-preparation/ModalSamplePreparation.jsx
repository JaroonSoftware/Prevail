/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input } from "antd";
import { SearchOutlined, TagOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { columns } from "./modal-sample-preparation.model";
import SamplePreparationService from '../../../service/SamplePreparation.service';
export default function ModalSamplePreparation({show, close, values=()=>{}, selected}) {
    const request = SamplePreparationService();
    const [form] = useForm();

    const [masterDatas, setMasterDatas] = useState([]);
    const [masterDatasWrap, setMasterDatasWrap] = useState([]);
 
    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);
    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false);  }, 140);
        
        //setTimeout( () => close(false), 200 );
    } 
 
    const getSearchValue = ( source, str ) => {
        return source.filter( d => ( 
               (d.spcode?.toLowerCase()?.includes(str.toLowerCase())) 
            || (d.spname?.toLowerCase()?.includes(str.toLowerCase())) 
            || (d.srcode?.toLowerCase()?.includes(str.toLowerCase()))
        ));
    }

    const getSearchTagValue = ( source, str ) => {
        return  source.filter( d => {
            const t = JSON.parse(d?.tag || "[]");
            return t.find( tag => tag?.toLowerCase()?.includes(str.toLowerCase()) );
        });
    }

    const handleSearch = (value) => {
        const { tag } = form.getFieldValue();
        if(!!value || !!tag){    
            let f = getSearchValue(masterDatas, value);
            if( !!tag ) f = getSearchTagValue( f, tag )
            // console.log(f);
             
            setMasterDatasWrap(f);            
        } else { 
            setMasterDatasWrap(masterDatas);            
        }

    }

    const handleSearchTag = (value) => {
        const { search } = form.getFieldValue(); 
        if(!!value || !!search){    
            let f = getSearchTagValue( masterDatas, value);
            if( !!search ) f = getSearchValue( f, search );
             
            setMasterDatasWrap(f);            
        } else { 
            setMasterDatasWrap(masterDatas);            
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
        request.search({approved_result:"'approved'"},{ ignoreLoading : true })
        .then((res) => {
          let { status, data } = res;
          if (status === 200) {
            setMasterDatas([...data.data]);
            setMasterDatasWrap([...data.data]);

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
            // console.log("modal-sample-preparation")
        } 
    }, [openModal]);
 
    return (
        <>
        <Modal
            open={openModal}
            title="เลือก Sample Preparation"
            afterClose={() => handleClose() }
            onCancel={() => setOpenModel(false) } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-sample-preparation'
        >
            <Spin spinning={loading} >
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                                    <Form.Item label="Search" name="search"  >
                                        <Input 
                                        suffix={<SearchOutlined />} 
                                        onChange={ (e) => { handleSearch(e.target.value) } } 
                                        placeholder='ค้นหา SR No, SP Name, SR No'/>
                                    </Form.Item>                        
                                </Col> 
                                <Col xs={24} sm={24} md={12} lg={12} xl={12} xxl={12}>
                                    <Form.Item label="Tag" name="tag" >
                                        <Input 
                                        suffix={<TagOutlined />} 
                                        onChange={ (e) => { handleSearchTag(e.target.value) } } 
                                        placeholder='ค้นหา Tag'/>
                                    </Form.Item>                        
                                </Col> 
                            </Row> 
                        </Form>
                    </Card>
                    <Card>
                        <Table  
                            bordered
                            dataSource={masterDatasWrap}
                            columns={column}
                            rowKey="spcode"
                            pagination={{ 
                                total:masterDatasWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${masterDatas.length} items`,
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
