/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';

import { Modal, Card, Table, message, Form, Typography, Flex, Button } from "antd";
import { Row, Col, Space, Spin } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { FaTruckLoading } from "react-icons/fa";
import { useForm } from 'antd/es/form/Form';
 
import { columns } from "./modal-shipping-type.model";
import { BsUiChecks } from "react-icons/bs"; 

import ModalShippingTypeView from './ModalShippingTypeView';
import OptionService from '../../../service/Options.service';
import "./modal-shipping-type.css";
const optionService = OptionService();
const mngConfig = {title:"", textOk:null, textCancel:null, action:"create", code:null};
export default function ModalShippingTypeMulti({show, close, values, selected=[]}) {
    const [form] = useForm();
    const inputRef = useRef(null);
    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true); 

    const [openManage, setOpenManage] = useState(false)
    const [sourceData, setSourceData] = useState(mngConfig);

    const [rowKeySelect, setRowKeySelect] = useState([]); 
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

    // const handleChoose = (value) => { 
    //     const { shipping_terms } = value;
    //     const total = shipping_terms?.reduce( (ac, v) => ac += Number( v?.price || 0), 0);
    //     values({...value, shipping_price : total });
    //     setOpenModel(false);
    // }

    const handleChoose = () => {
        const choosed = selected.map( m => m.loadingtype_id );
        const itemsChoose = (modalData.filter( f => rowKeySelect.includes(f.loadingtype_id) && !choosed.includes(f.loadingtype_id) )).map( (m, i) => (
        {
            loadingtype_id:m.loadingtype_id,
            loadingtype_name:m.loadingtype_name, 
            qty: 0,
        }));
        
        // const trans = selected.filter( (item) =>  item?.stcode === "" );
        // const rawdt = selected.filter( (item) =>  item?.stcode !== "" );
        // console.log(itemsChoose, rawdt, trans); 
        values([...selected, ...itemsChoose]);
        
        setOpenModel(false);
    }


    const handleView = (value) => { 
        setSourceData( value );
        
        setOpenManage(true);  
    }

    const handleCheckDuplicate = (itemCode) => !!selected.find( (item) =>  item?.loadingtype_id === itemCode ) ;

    const itemSelection = {
        selectedRowKeys : rowKeySelect,
        type: "checkbox",
        fixed: true,
        hideSelectAll:true,
        onChange: (selectedRowKeys, selectedRows) => { 
            // setRowKeySelect([...new Set([...selectedRowKeys, ...rowKeySelect])]);
            // setItemsList(selectedRows);
            //setRowKeySelect(selectedRowKeys);
        },
        getCheckboxProps: (record) => { 
            return {
                disabled: handleCheckDuplicate(record.loadingtype_id), 
                name: record.loadingtype_id,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setRowKeySelect([...new Set([...rowKeySelect, record.loadingtype_id])]);
            } else {
                const ind = rowKeySelect.findIndex( d => d === record.loadingtype_id);
                const tval = [...rowKeySelect];
                tval.splice(ind, 1);
                setRowKeySelect([...tval]);
                //console.log(ind, rowKeySelect);
            }
        }
    };

    /** setting initial component */ 
    const column = columns({handleChoose, handleView});

    const onload = () =>{
        setLoading(true);
        optionService.optionsShippingType({}, { ignoreLoading : true }).then(async (res) => {
            let { data } = res.data; 
            setModalData(data);
            setModalDataWrap(data);
            const keySeleted = selected.map( m => m.loadingtype_id );

            setRowKeySelect([...keySeleted]);
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
                title={<Flex align='center' gap={4}><FaTruckLoading /><Typography.Text className='ms-1 mb-0'>Shipping Type</Typography.Text></Flex>}
                afterClose={() => handleClose() }
                onCancel={() => setOpenModel(false) } 
                maskClosable={false}
                style={{ top: 20 }}
                width={800}
                className='modal-loading-type' 
                footer={(
                    <Row>
                        <Col span={24}>
                            {/* Ignore */}
                        </Col>
                        <Col span={24}>
                            <Flex justify='flex-end'>
                                <Button className='bn-center bn-primary' icon={<BsUiChecks />} onClick={()=>handleChoose()}> Confirm </Button>
                            </Flex>
                        </Col> 
                    </Row>
                )}
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
                                    rowKey="loadingtype_id"
                                    rowSelection={itemSelection}
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
                        { openManage && 
                            <ModalShippingTypeView 
                                open={openManage} 
                                close={()=>setOpenManage(false)} 
                                source={sourceData}
                            />
                        }                  
                    </div>

                </Spin>
            </Modal>                
        </div>

        </>
    )
}