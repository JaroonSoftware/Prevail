/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons"
import { columns } from "./modal-cusCL.model"; 
// import ItemService from "../../service/ItemService";
import OptionService from "../../../service/Options.service"

const opnService = OptionService();
export default function ModalCusCL({show, close, values, selected}) {
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
            const f = itemsData.filter( d => ( (d?.includes(value)) || (d.cusname?.includes(value)) ) );
             
            setItemsDataWrap(f);            
        } else { 
            setItemsDataWrap(itemsData);            
        }

    }

    const handleSelectItems = (record) => {
        setItemsList([...itemsList]);
    };

    const handleCheckDuplicate = (CustomerCode) => !!selected.find( (customer) =>  customer?.cuscode === CustomerCode ) ; 

    const handleConfirm = () => { 
        const choosed = selected.map( m => m.cuscode );
        const itemsChoose = (itemsData.filter( f => itemsRowKeySelect.includes(f.cuscode) && !choosed.includes(f.cuscode) )).map( (m, i) => (
        {
            cuscode:m.cuscode,
            prename:m.prename,
            cusname:m.cusname,
       
        }));
        
        // const trans = selected.filter( (item) =>  item?.cuscode === "" );
        // const rawdt = selected.filter( (item) =>  item?.cuscode !== "" );
        // console.log(itemsChoose, rawdt, trans); 

        values([...selected, ...itemsChoose]);
        
        setItemsList([]);
        close(false);
    }

    /** Config Conponent */

    const itemSelection = {
        selectedRowKeys : itemsRowKeySelect,
        type: "checkbox",
        fixed: true,
        onChange: (selectedRowKeys, selectedRows) => {
            setItemsRowKeySelect([
              ...new Set([...selectedRowKeys, ...itemsRowKeySelect]),
            ]);
            setItemsList(selectedRows);
            setItemsRowKeySelect(selectedRowKeys);
          },
        getCheckboxProps: (record) => { 
            return {
                disabled: handleCheckDuplicate(record.cuscode), 
                name: record.cuscode,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setItemsRowKeySelect([...new Set([...itemsRowKeySelect, record.cuscode])]);
            } else {
                const ind = itemsRowKeySelect.findIndex( d => d === record.cuscode);
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
            opnService.optionsCustomer({p:'customer'}).then((res) => {
                let { status, data } = res;
                if (status === 200) {
                    setItemsData(data.data);
                    setItemsDataWrap(data.data);

                    const keySeleted = selected.map( m => m.cuscode );

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
            <Button type='primary' onClick={() => handleConfirm() }>ยืนยันการเลือกลูกค้า</Button>
        </Space>
    )
    /** */
    return (
        <>
        <Modal
            open={show}
            title="เลือกลูกค้า"
            onCancel={() => handleClose() } 
            footer={ButtonModal}
            maskClosable={false}
            style={{ top: 20 }}
            width={800}
            className='sample-request-modal-cusCL'
        >
            <Spin spinning={loading} >
                <Space direction="vertical" size="middle" style={{ display: 'flex', position: 'relative'}}  >
                    <Card style={{backgroundColor:'#f0f0f0' }}>
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
                    <Card>
                        <Table  
                            bordered
                            dataSource={itemsDataWrap}
                            columns={column} 
                            rowSelection={itemSelection}
                            rowKey="cuscode"
                            pagination={{ 
                                total:itemsDataWrap.length, 
                                showTotal:(_, range) => `${range[0]}-${range[1]} of ${itemsData.length} customer`,
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