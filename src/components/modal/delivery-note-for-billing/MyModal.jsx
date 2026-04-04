/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons"

import { columns } from "./model"; 
import OptionService from "../../../service/Options.service"
import ShippingModal from "./ShippingModal";

const opnService = OptionService();
export default function ModalDeliverynoteBilling({show, close,cuscode, values, selected}) {
    const [form] = Form.useForm();
    /** handle state */
    const [itemsData, setItemsData] = useState([]);
    const [itemsDataWrap, setItemsDataWrap] = useState([]);

    const [shippingData, setShippingData] = useState([]);

    const [itemsRowKeySelect, setItemsRowKeySelect] = useState([]);
    const [loading,  setLoading] = useState(true);
    const [requestingShipping, setRequestingShipping] = useState(false);
    const [openShippingModal, setOpenShippingModal] = useState(false);

    /** handle logic component */
    const handleClose = () =>{
        setShippingData([]);
        setOpenShippingModal(false);
        close(false);
    }

    const toggleRowKey = (rowKey, setSelectedKeys, disabled = false) => {
        if (disabled) {
            return;
        }

        setSelectedKeys((state) => (
            state.includes(rowKey)
                ? state.filter((item) => item !== rowKey)
                : [...state, rowKey]
        ));
    };

    const focusNextRow = (rowElement, isLastRow, onLastRow) => {
        setTimeout(() => {
            if (!isLastRow) {
                rowElement?.nextElementSibling?.focus?.();
                return;
            }

            onLastRow?.();
        }, 0);
    };

    const createRowHandler = ({ record, index, dataSource, rowKey, setSelectedKeys, isDisabled, onLastRow }) => ({
        tabIndex: 0,
        onKeyDown: (event) => {
            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();
            toggleRowKey(record[rowKey], setSelectedKeys, isDisabled?.(record));
            focusNextRow(event.currentTarget, index === dataSource.length - 1, onLastRow);
        },
    });

    const handleSearch = (value) => {
        if(!!value){    
            const f = itemsData.filter( d => (
                d.socode?.toLowerCase().includes(value?.toLowerCase()) ||
                d.cusname?.toLowerCase().includes(value?.toLowerCase())
            ) );
             
            setItemsDataWrap(f);            
        } else { 
            setItemsDataWrap(itemsData);            
        }

    }

    const handleCheckDuplicate = () => false;

    const loadShippingOptions = (salesOrders) => {
        const selectedSalesOrders = salesOrders.map((item) => item.socode).filter(Boolean).join(",");

        setRequestingShipping(true);
        opnService.optionsShipping({ cuscode, socode: selectedSalesOrders }).then((res) => {
            let { status, data } = res;
            if (status === 200) {
                const shippingItems = data.data || [];
                if (shippingItems.length < 1) {
                    message.warning("ไม่พบใบส่งของจากใบขายสินค้าที่เลือก");
                    setShippingData([]);
                    setOpenShippingModal(false);
                    return;
                }
                setShippingData(shippingItems);
                setOpenShippingModal(true);
            }
        })
        .catch(() => {
            message.error("Request error!");
        })
        .finally(() => {
            setRequestingShipping(false);
        });
    };

    const handleConfirm = () => { 
        const itemsChoose = (itemsData.filter( f => itemsRowKeySelect.includes(f.socode) )).map( (m) => (
        {
            socode:m.socode,    
        }));

        if (itemsChoose.length < 1) {
            message.warning("กรุณาเลือกใบขายสินค้า");
            return;
        }

        if (requestingShipping) {
            return;
        }

        loadShippingOptions(itemsChoose);
    }

    /** Config Conponent */

    const itemSelection = {
        selectedRowKeys : itemsRowKeySelect,
        type: "checkbox",
        fixed: true,
        hideSelectAll:false,
        onChange: (selectedRowKeys) => {
            setItemsRowKeySelect(selectedRowKeys);
        },
        getCheckboxProps: (record) => { 
            return {
                disabled: handleCheckDuplicate(record.socode), 
                name: record.socode,
            }
        },
        onSelect: (record, selected) => {
            setItemsRowKeySelect((state) => (
                selected
                    ? [...new Set([...state, record.socode])]
                    : state.filter((item) => item !== record.socode)
            ));
        }
    };

    /** End Config Component */

    /** setting initial component */ 
    const column = columns();

    useEffect( () => {
        const onload = () =>{            
            setLoading(true);
            opnService.optionsDeliverynote({cuscode:cuscode,ignoreLoading:true}).then((res) => {
                let { status, data } = res;
                if (status === 200) {
                    setItemsData(data.data);
                    setItemsDataWrap(data.data);
                    setItemsRowKeySelect([]);

                }
            })
            .catch((err) => { 
                message.error("Request error!");
            })
            .finally( () => setTimeout( () => { setLoading(false) }, 400));
        }

        if( !!show ){
            setShippingData([]);
            setOpenShippingModal(false);
            onload();
        } 
    }, [selected,show]);

    /** setting child component */
    const ButtonModal = (
        <Space direction="horizontal" size="middle" >
            
            <Button onClick={() => handleClose() }>ปิด</Button>
            <Button type='primary' onClick={() => handleConfirm() } disabled={requestingShipping}>ถัดไปเลือกใบส่งของ</Button>
        </Space>
    );

    /** */
    return (
        <>
        <Modal
            open={show}
            title="เลือกใบขายสินค้า"
            onCancel={() => handleClose() } 
            footer={ButtonModal}
            maskClosable={false}
            mask={!openShippingModal}
            style={{ top: 20, visibility: openShippingModal ? 'hidden' : 'visible' }}
            width={1000}
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
                            rowKey="socode"
                            onRow={(record, index) => createRowHandler({
                                record,
                                index,
                                dataSource: itemsDataWrap,
                                rowKey: "socode",
                                setSelectedKeys: setItemsRowKeySelect,
                                isDisabled: (row) => handleCheckDuplicate(row.socode),
                                onLastRow: handleConfirm,
                            })}
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
        <ShippingModal
            show={show && openShippingModal}
            close={(state) => {
                if (state === false) {
                    setOpenShippingModal(false);
                }
            }}
            values={(v) => {
                values(v);
                close(false);
            }}
            selected={selected}
            shippingData={shippingData}
            loading={false}
        />
        </>
    )
}