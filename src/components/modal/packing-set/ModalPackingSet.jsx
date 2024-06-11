/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';

import { Modal, Card, Table, message, Form, Button } from "antd";
import { Row, Col, Space, Spin, Flex } from "antd";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';

import { columnPackingSet } from "./modal-packing-set.model";
import OptionService from '../../../service/Options.service';
import { BsUiChecks } from "react-icons/bs";


const optionService = OptionService();
export default function ModalPackingSet({show, close, values, selected=[]}) {
    const [form] = useForm();
    const inputRef = useRef(null);
    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true); 

    const [rowKeySelect, setRowKeySelect] = useState([]); 

    // console.log( itemsTypeData )

    /** handle logic component */
    const handleClose = () =>{ 
        setTimeout( () => { close(false);  }, 140); 
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
    // }

    const handleSearchGroup = (value) => {
        if(!!value){    
            const f = modalData.filter( d => {
                const text = ( d.packingset_group?.toLowerCase().includes(value?.toLowerCase()) )  
                return  text;
            });
            setModalDataWrap(f);
        } else { 
            setModalDataWrap(modalData);
        } 
    }

    const handleChoose = () => {
        const choosed = selected.map( m => m.id );
        const itemsChoose = (modalData.filter( f => rowKeySelect.includes(f.id) && !choosed.includes(f.id) ));
        
        // const trans = selected.filter( (item) =>  item?.id === "" );
        // const rawdt = selected.filter( (item) =>  item?.id !== "" );
        // console.log(itemsChoose, rawdt, trans); 
        values([...selected, ...itemsChoose]);
        
        setOpenModel(false);
    }

    /** setting initial component */ 
    const column = columnPackingSet();
 
    useEffect( () => {
        const onload = () =>{
            setLoading(true);
            optionService.optionsPackingSet().then(async (res) => {
                let { data } = res.data; 
                setModalData(data);
                setModalDataWrap(data);
                // console.log(modalData, data) 
                const keySeleted = selected.map( m => m.id );

                setRowKeySelect([...keySeleted]); 
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


        return () => {}
    }, [openModal]);

    const handleCheckDuplicate = (itemCode) => !!selected.find( (item) =>  item?.id === itemCode ) ;

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
                disabled: handleCheckDuplicate(record.id), 
                name: record.id,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setRowKeySelect([...new Set([...rowKeySelect, record.id])]);
            } else {
                const ind = rowKeySelect.findIndex( d => d === record.id);
                const tval = [...rowKeySelect];
                tval.splice(ind, 1);
                setRowKeySelect([...tval]);
                //console.log(ind, rowKeySelect);
            }
        }
    };
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
            title="เลือก Packing Set"
            afterClose={() => handleClose() }
            onCancel={() => setOpenModel(false) } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-packingset'
            footer={(
                <Row>
                    <Col span={24}>
                        {/* Ignore */}
                    </Col>
                    <Col span={24}>
                        <Flex justify='flex-end'>
                            <Button  className='bn-center bn-primary' icon={<BsUiChecks />} onClick={()=>handleChoose()}> Confirm </Button>
                        </Flex>
                    </Col> 
                </Row>
            )}
        >
            <Spin spinning={loading} >
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                                    <Form.Item label="Search"  >
                                        <Input 
                                        ref={inputRef} 
                                        suffix={<SearchOutlined />} 
                                        onChange={ (e) => { handleSearch(e.target.value) } } placeholder='Name or Code'/>
                                    </Form.Item>                        
                                </Col> 
                                <Col xs={24} sm={24} md={12} lg={12} xl={12}> 
                                    <Form.Item label="Packaging Set Group"  >
                                        <Input 
                                        ref={inputRef} 
                                        suffix={<SearchOutlined />} 
                                        onChange={ (e) => { handleSearchGroup(e.target.value) } } placeholder='Packaging Set Group'/>
                                    </Form.Item>                   
                                </Col> 
                            </Row> 
                        </Form>
                    </Card>
                    <Card  style={{minHeight:'60vh'}}>
                        <Table
                            bordered
                            dataSource={modalDataWrap}
                            rowSelection={itemSelection}
                            columns={column}
                            rowKey="id"
                            pagination={{ 
                                total:modalDataWrap?.length || 0, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${modalDataWrap?.length || 0} items`,
                                defaultPageSize:10,
                                pageSizeOptions:[10,50,100]
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
