/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect, useRef} from 'react';

import { Modal, Card, Table, message, Form, Button, Typography } from "antd";
import { Row, Col, Space, Spin, Flex } from "antd";
import { Input } from "antd";
import { BankTwoTone, SearchOutlined } from "@ant-design/icons";
import { useForm } from 'antd/es/form/Form';
 
import { bankListColumn } from "./modal-banks.model";
import { BsUiChecks } from "react-icons/bs"; 

import ModalBanksManage from './ModalBanksManage';
// import OptionService from '../../../service/Options.service';
import BankService from '../../../service/Bank.service';
import "./modal-banks.css";
// const optionService = OptionService();
const bnkservice = BankService();
const mngConfig = {title:"", textOk:null, textCancel:null, action:"create", code:null};
export default function ModalBanks({show, close, values, selected=[]}) {
    const [form] = useForm();
    const inputRef = useRef(null);
    const [modalData, setModalData] = useState([]);
    const [modalDataWrap, setModalDataWrap] = useState([]);

    const [openModal,  setOpenModel] = useState(show);
    const [loading,  setLoading] = useState(true);

    const [rowKeySelect, setRowKeySelect] = useState([]); 

    const [openManage, setOpenManage] = useState(false)
    const [config, setConfig] = useState(mngConfig);
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
                    d.acc_no?.toLowerCase()?.includes(input) || 
                    d.bank_name?.toLowerCase()?.includes(input) || 
                    d.bank_name_th?.toLowerCase()?.includes(input) ||
                    d.acc_name?.toLowerCase()?.includes(input)
                );
                return  text;
            });
            setModalDataWrap(f);
        }  else setModalDataWrap(modalData); 
    }

    const handleChoose = () => {
        const choosed = selected.map( m => m.acc_no );
        const itemsChoose = (modalData.filter( f => rowKeySelect.includes(f.acc_no) && !choosed.includes(f.acc_no) )).map( (m, i) => ({ ...m }));
        
        // const trans = selected.filter( (item) =>  item?.id === "" );
        // const rawdt = selected.filter( (item) =>  item?.id !== "" );
        // console.log(itemsChoose, rawdt, trans); 
        values([...selected, ...itemsChoose]);
        
        setOpenModel(false);
    }

    /** setting initial component */ 
    const column = bankListColumn(); 
    const onload = () =>{
        setLoading(true);
        bnkservice.search({}, { ignoreLoading : true }).then(async (res) => {
            let { data } = res.data; 
            setModalData(data);
            setModalDataWrap(data);
            // console.log(selected) 
            const keySeleted = selected.map( m => m.acc_no );

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

    const handleCheckDuplicate = (itemCode) => !!selected.find( (item) =>  item?.acc_no === itemCode ) ;

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
                disabled: handleCheckDuplicate(record.acc_no), 
                name: record.acc_no,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setRowKeySelect([...new Set([...rowKeySelect, record.acc_no])]);
            } else {
                const ind = rowKeySelect.findIndex( d => d === record.acc_no);
                const tval = [...rowKeySelect];
                tval.splice(ind, 1);
                setRowKeySelect([...tval]);
                //console.log(ind, rowKeySelect);
            }
        }
    };
    /** setting child component */
    const ButtonManageModal = (
        <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
            <Col span={24}>
                <Typography.Link onClick={()=>{ 
                    setConfig({...mngConfig, title:"Create Bank", action:"create"})
                    setOpenManage(true); 
                }} className='ps-1'>
                    <span className='hover:underline underline-offset-1'>Create Bank master data.</span>
                </Typography.Link> 
            </Col>
        </Row>   
    )
    /** */

    return (
        <>
        <Modal
            open={openModal}
            title={<><BankTwoTone /><Typography.Text className='ms-1 mb-0'>Banks List</Typography.Text></>}
            afterClose={() => handleClose() }
            onCancel={() => setOpenModel(false) } 
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='modal-customers'
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
                                <Col span={24}>
                                    <Form.Item label="ค้นหา"  >
                                        <Input ref={inputRef} suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหาชื่อ หรือ รหัส'/>
                                    </Form.Item>                        
                                </Col> 
                            </Row>
                            { ButtonManageModal }
                        </Form>
                    </Card>
                    <Card style={{minHeight:'60vh'}}>
                        <Table
                            // bordered={false}
                            dataSource={modalDataWrap}
                            rowSelection={itemSelection}
                            columns={column}
                            rowKey="acc_no"
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
                    <ModalBanksManage 
                        config={config}
                        open={openManage} 
                        close={()=>setOpenManage(false)} 
                        complete={() => { onload(); setOpenManage(false); }} 
                    />
                }                  
            </Spin>
        </Modal>    
        </>
    )
}