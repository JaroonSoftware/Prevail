/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons"

import { columns } from "./modal-items.model"; 
// import ItemService from "../../service/ItemService";
import OptionService from "../../../service/Options.service"

const opnService = OptionService();
export default function ModalItems({show, close,supcode, values, selected}) {
    const [form] = Form.useForm();
    /** handle state */
    const [itemsData, setItemsData] = useState([]);
    const [itemsDataWrap, setItemsDataWrap] = useState([]);
    
    const [itemsList, setItemsList] = useState(selected || []);
    const [itemsRowKeySelect, setItemsRowKeySelect] = useState([]);
    const [loading,  setLoading] = useState(true);
    /** handle logic component */
    const handleClose = () =>{ 
        close(false);
    }
 
    const handleSearch = (value) => {
        if(!!value){    
            const f = itemsData.filter( d => ( (d.stcode?.includes(value)) || (d.stname?.includes(value)) ) );
             
            setItemsDataWrap(f);            
        } else { 
            setItemsDataWrap(itemsData);            
        }

    }

    const handleSelectItems = (record) => {
        const newData = {
            ...record, 
            qty: 1, 
            percent: 0,
            totalpercent: 0,
        };
        // console.log(newData);

        setItemsList([...itemsList, newData]);
    };

    const handleCheckDuplicate = (itemCode) => !!selected.find( (item) =>  item?.code === itemCode ) ; 

    const handleConfirm = () => { 
        const choosed = selected.map( m => m.code );
        const itemsChoose = (itemsData.filter( f => itemsRowKeySelect.includes(f.code) && !choosed.includes(f.code) )).map( (m, i) => (
        {
            code:m.code,
            pocode:m.pocode,
            stcode:m.stcode,
            stname:m.stname,            
            price: m.price,
            qty_buy: m.qty,
            recamount: m.recamount,
            qty: m.qty-m.recamount,
            unit:m.unit,        
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
                disabled: handleCheckDuplicate(record.code), 
                name: record.code,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setItemsRowKeySelect([...new Set([...itemsRowKeySelect, record.code])]);
            } else {
                const ind = itemsRowKeySelect.findIndex( d => d === record.code);
                const tval = [...itemsRowKeySelect];
                tval.splice(ind, 1);
                setItemsRowKeySelect([...tval]);
                //console.log(ind, itemsRowKeySelect);
            }
        }
    };

    /** End Config Component */

    /** setting initial component */ 
    const column = columns( { handleSelectItems, handleCheckDuplicate } );

    useEffect( () => {
        const onload = () =>{            
            setLoading(true);
            opnService.optionsItems({p:'gr',supcode:supcode}).then((res) => {
                let { status, data } = res;
                if (status === 200) {
                    setItemsData(data.data);
                    setItemsDataWrap(data.data);

                    const keySeleted = selected.map( m => m.code );

                    setItemsRowKeySelect([...keySeleted]);
                    // console.log(selected);

                }
            })
            .catch((err) => { 
                message.error("Request error!");
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
    /** */
    return (
        <>
        <Modal
            open={show}
            title="เลือกสินค้า"
            onCancel={() => handleClose() } 
            footer={ButtonModal}
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='sample-request-modal-items'
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
                            dataSource={itemsDataWrap}
                            columns={column} 
                            rowSelection={itemSelection}
                            rowKey="code"
                            pagination={{ 
                                total:itemsDataWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${itemsData.length} items`,
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