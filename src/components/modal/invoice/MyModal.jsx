import React, {useState, useEffect} from 'react';

import { Modal, Card, Table, message, Form, Spin,Button } from "antd";
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

    const [itemsList, setItemsList] = useState(selected || []);
    const [itemsRowKeySelect, setItemsRowKeySelect] = useState([]);
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

    const handleSelectItems = (record) => {
        const newData = {
            ...record, 
            qty: record.qty, 
            percent: 0,
            totalpercent: 0,
        };
        // console.log(newData);

        setItemsList([...itemsList, newData]);
    };

    const handleCheckDuplicate = (itemCode) => !!selected.find( (item) =>  item?.ivcode === itemCode ) ; 

    const handleConfirm = () => { 
        const choosed = selected.map( m => m.ivcode );
        const itemsChoose = (customersData.filter( f => itemsRowKeySelect.includes(f.ivcode) && !choosed.includes(f.ivcode) )).map( (m, i) => (
        {
            ivcode:m.ivcode,
            stcode:m.stcode,
            stname:m.stname,            
            price: m.price,
            qty: m.qty,
            unit:m.unit,        
            vat:m.vat,     
            discount:m.discount,        
        }));
        
        values([...selected, ...itemsChoose]);
        
        setItemsList([]);
        close(false);
    }

    /** Config Conponent */

    const itemSelection = {
        selectedRowKeys : itemsRowKeySelect,
        type: "checkbox",
        fixed: true,
        hideSelectAll:true,
        onChange: (selectedRowKeys, selectedRows) => { 
            // setItemsRowKeySelect([...new Set([...selectedRowKeys, ...itemsRowKeySelect])]);
            // setItemsList(selectedRows);
            //setItemsRowKeySelect(selectedRowKeys);
        },
        getCheckboxProps: (record) => { 
            return {
                disabled: handleCheckDuplicate(record.ivcode), 
                name: record.ivcode,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setItemsRowKeySelect([...new Set([...itemsRowKeySelect, record.ivcode])]);
            } else {
                const ind = itemsRowKeySelect.findIndex( d => d === record.ivcode);
                const tval = [...itemsRowKeySelect];
                tval.splice(ind, 1);
                setItemsRowKeySelect([...tval]);
                //console.log(ind, itemsRowKeySelect);
            }
        }
    };

    /** End Config Component */

    /** setting initial component */ 
    const column = customersColumn({ handleSelectItems, handleCheckDuplicate });

    useEffect( () => {
        const onload = () =>{            
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

        if( !!show ){
            onload();
            // console.log("modal-select-items");          
        } 
    }, [selected,show]);


    /** setting child component */
    const ButtonModal = (
        <Space direction="horizontal" size="middle" >
            
            <Button onClick={() => handleClose() }>ปิด</Button>
            <Button type='primary' onClick={() => handleConfirm() }>ยืนยันการเลือกสินค้า</Button>
        </Space>
    )
 
    return (
        <>
        <Modal
            open={show}
            title="เลือกใบแจ้งหนี้"
            onCancel={() => handleClose() } 
            footer={ButtonModal}
            maskClosable={false}
            style={{ top: 20 }}
            width={1000}
            className='modal-customers'
        >
            <Spin spinning={loading} >
            <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
                        <Form form={form} layout="vertical" autoComplete="off" >
                            <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'>
                                <Col span={24}>
                                    <Form.Item label="ค้นหา"  >
                                        <Input suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหาชื่อ หรือ รหัสสินค้า'/>
                                    </Form.Item>                        
                                </Col> 
                            </Row> 
                        </Form>
                    </Card>
                    <Card>
                        <Table  
                            bordered
                            dataSource={customersDataWrap}
                            columns={column} 
                            rowSelection={itemSelection}
                            rowKey="ivcode"
                            pagination={{ 
                                total:customersDataWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${customersData.length} items`,
                                defaultPageSize:10,
                                pageSizeOptions:[10,25,35,50,100]
                            }}
                            scroll={{ x: 'max-content' }} size='small'
                        /> 
                    </Card>
                </Space>    
            </Spin>
        </Modal>    
        </>
    )
}
