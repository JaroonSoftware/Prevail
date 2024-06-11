/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';

import { Modal, Card, Tag, message, Tooltip, Empty } from "antd";
import { Row, Col, Space, Spin, Typography, Button } from "antd";
import { AutoComplete } from "antd";
import { TagOutlined } from "@ant-design/icons"; 

import SamplePreparationService from '../../../service/SamplePreparation.service';

const { Title, Text } = Typography;
export default function ModalSamplePreparationTags({show, close, values, code}) {
    const samplePreparationService = SamplePreparationService(); 

    const [loading, setLoading] = useState(false);
    const [tagsOptionsData, setTagsOptionsData] = useState([]);
    const [tagsOptionsDataWrap, setTagsOptionsDataWrap] = useState([]);

    const [tagsData, setTagsData] = useState([]);
    const [tagsValue, setTagsValue] = useState('');
 
    const [openModal,  setOpenModel] = useState(show);
    /** handle logic component */
    const handleClose = () =>{ 
       
        setTimeout( () => { close(false);  }, 140);
        
        //setTimeout( () => close(false), 200 );
    }  

    const handleOk = () => {
        setLoading(true);

        samplePreparationService.sptags_create({ code, tags:tagsData }).then( res => {


            setLoading(false);
            setTimeout( ()=> {
                values(tagsData);
                setOpenModel(false); 
            }, 400)
        })
        .catch( err => {
            console.log(err); 

            setLoading(false);
        })
    }
 
    const handleChoose = () => {
        const tag = tagsValue;
        if(!!tag){
            const tagsValue =  [...new Set([...tagsData, tag])]
            setTagsData(tagsValue);

            setTagsOptionsDataWrap(tagsOptionsData.filter( f => (!tagsValue.includes(f.value) || tagsValue.length < 1 )) ); 
        }
        
        setTagsValue(''); 
    }

    const handleRemoveTag = ( e, val ) => {
        e.preventDefault();
        const tag = tagsData.filter( (f) => f !== val); 
        setTagsOptionsDataWrap(tagsOptionsData.filter( f => (!tag.includes(f.value) || tag.length < 1 )) ); 
        setTagsData([...tag]);
    }

    /** setting initial component */  

    const onload = async () => {
        // debugger;
        setLoading(true);
        const t = await samplePreparationService.get_sptags(); 
        const opn_parameter = t.data.data.map( v => ({value:v.text}));
        setTagsOptionsData(opn_parameter);

        samplePreparationService.get_sptags(code)
            .then( (res) => {
                let { data } = res.data; 
                const tags = data.map( v => v.text); 
                setTagsData([...tags]); 

                // const filterTagsUse = opn_parameter.filter( f => (!tags.includes(f.text) || tags.length < 1 ));
                
                // console.log(tagsOptionsDataWrap, filterTagsUse, tagsOptionsData, opn_parameter)
                setTagsOptionsDataWrap( () => opn_parameter.filter( f => (!tags.includes(f.value) || tags.length < 1 )) );
                setLoading(false); 
            })
            .catch((err) => { 
                console.log(err);
                message.error("Request error!");
                setLoading(false);
            });
    }

    useEffect( () => {
        if( !!openModal ){
            onload();
        } 
    }, [openModal]);
 
    return (
        <>
        
            <Modal
                open={openModal}
                title={<Space style={{ display: 'flex', alignItems: 'baseline', gap: '1rem'}}><TagOutlined /><Title level={4}>Tag</Title></Space>}
                afterClose={() => handleClose() }
                onCancel={() => setOpenModel(false) } 
                onOk={() => handleOk() }
                maskClosable={false}
                style={{ top: 20 }}
                width={800}
                className='modal-sample-request'
            >
                <Spin tip="Loading..." spinning={loading}>
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{paddingBlock:'1.1rem'}}>
                        <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                            <Col span={24}>
                                <Space.Compact style={{ width: '100%' }}>
                                    <AutoComplete 
                                        value={tagsValue}
                                        onChange={(e) => { setTagsValue(e) }}
                                        style={{ height:42, width:'100%' }}
                                        options={tagsOptionsDataWrap}
                                        filterOption={(inputValue, option) =>
                                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                        }
                                        allowClear
                                    />
                                    <Button type="primary" style={{ height:42, width:52 }} icon={<TagOutlined />} onClick={()=>{handleChoose()}} />
                                </Space.Compact> 
                                
                            </Col> 
                            <Col span={24}>
                                <Text style={{color:'rgb(52 120 255)'}} > Total {tagsData.length} tags for request preparation.</Text>
                            </Col>
                        </Row>
                    </Card>
                    <Card>
                        {tagsData.length < 1 &&<Space style={{width:'100%', justifyContent:'center'}} ><Empty description={false} className='width-100' /></Space>}
                        <Space size="2" style={{width:'100%'}} >
                            {tagsData.map( (m, i) => { 
                                const isLongTag =  m?.length > 20;
                                const tagElem = (
                                <Tag key={i} closable onClose={(e) => handleRemoveTag(e, m) } color="#108ee9" style={{height:32, display:'flex', alignItems:'center'}} > 
                                    <span style={{lineHeight:'1.9rem', height:'100%'}}>{isLongTag ? `${m.slice(0, 20)}...` : m} </span>
                                    {/* {m}  */}
                                </Tag>
                                );
                                return isLongTag ? <Tooltip title={m} key={i}> {tagElem} </Tooltip> : tagElem ; 
                            }) }

                        </Space>           
                    </Card>
                </Space>
                </Spin> 
            </Modal>   
        </>
        
    )
}
