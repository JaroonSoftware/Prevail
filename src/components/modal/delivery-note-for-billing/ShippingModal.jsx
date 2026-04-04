/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import { shippingColumns } from "./model";
import DeliveryNoteService from "../../../service/DeliveryNote.service";

const dnService = DeliveryNoteService();

const getShippingRowKey = (item) => (
    item?._rowKey || [item?.dncode, item?.socode, item?.code].filter(Boolean).join("::")
);

export default function ShippingModal({ show, close, values, selected, shippingData, loading }) {
    const [form] = Form.useForm();
    const tableWrapRef = useRef(null);
    const focusFrameRef = useRef(null);
    const [shippingDataWrap, setShippingDataWrap] = useState([]);
    const [shippingItems, setShippingItems] = useState([]);
    const [shippingRowKeySelect, setShippingRowKeySelect] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);

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

    const focusFirstTableRow = () => {
        if (focusFrameRef.current) {
            cancelAnimationFrame(focusFrameRef.current);
        }

        focusFrameRef.current = requestAnimationFrame(() => {
            focusFrameRef.current = requestAnimationFrame(() => {
                const firstRow = tableWrapRef.current?.querySelector('.ant-table-tbody > tr.ant-table-row');

                if (!firstRow) {
                    return;
                }

                firstRow.scrollIntoView({ block: 'nearest' });
                firstRow.focus();
            });
        });
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
        if (!!value) {
            const f = shippingItems.filter((d) => (
                d.dncode?.toLowerCase().includes(value?.toLowerCase()) ||
                d.socode?.toLowerCase().includes(value?.toLowerCase()) ||
                d.stcode?.toLowerCase().includes(value?.toLowerCase()) ||
                d.stname?.toLowerCase().includes(value?.toLowerCase())
            ));

            setShippingDataWrap(f);
        } else {
            setShippingDataWrap(shippingItems);
        }
    };

    const handleCheckDuplicate = (rowKey) => !!selected.find((item) => getShippingRowKey(item) === rowKey);

    const loadShippingItems = async () => {
        if (!show || shippingData.length < 1) {
            setShippingItems([]);
            setShippingDataWrap([]);
            setShippingRowKeySelect([]);
            return;
        }

        setDetailLoading(true);
        try {
            const payload = shippingData.map((item) => ({ dncode: item.dncode }));
            const res = await dnService.getlist(payload, { ignoreLoading: true });
            const detail = (res?.data?.data?.detail || []).map((item) => ({
                ...item,
                _rowKey: getShippingRowKey(item),
            }));
            const selectedKeys = [...new Set(selected.map((item) => getShippingRowKey(item)).filter(Boolean))];

            setShippingItems(detail);
            setShippingDataWrap(detail);
            setShippingRowKeySelect(selectedKeys);
        } catch (error) {
            message.error("โหลดรายการสินค้าใบส่งของไม่สำเร็จ");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleConfirm = () => {
        const choosed = [...selected];
        const itemsChoose = shippingItems.filter(
            (item) => shippingRowKeySelect.includes(item._rowKey) && !choosed.some((row) => getShippingRowKey(row) === item._rowKey)
        );

        const merged = [...choosed, ...itemsChoose]
            .filter((item, index, array) => array.findIndex((row) => getShippingRowKey(row) === getShippingRowKey(item)) === index);

        if (merged.length < 1) {
            message.warning("กรุณาเลือกใบส่งของ");
            return;
        }

        values(merged);
        close(false);
    };

    const shippingSelection = {
        selectedRowKeys: shippingRowKeySelect,
        type: "checkbox",
        fixed: true,
        hideSelectAll: false,
        onChange: (selectedRowKeys) => {
            setShippingRowKeySelect(selectedRowKeys);
        },
        getCheckboxProps: (record) => {
            return {
                disabled: handleCheckDuplicate(record._rowKey),
                name: record._rowKey,
            }
        },
        onSelect: (record, selectedRow) => {
            setShippingRowKeySelect((state) => (
                selectedRow
                    ? [...new Set([...state, record._rowKey])]
                    : state.filter((item) => item !== record._rowKey)
            ));
        },
    };

    useEffect(() => {
        loadShippingItems();
    }, [show, shippingData, selected]);

    useEffect(() => {
        if (!show || loading || detailLoading || shippingDataWrap.length < 1) {
            return;
        }

        focusFirstTableRow();
    }, [show, loading, detailLoading, shippingDataWrap]);

    useEffect(() => {
        return () => {
            if (focusFrameRef.current) {
                cancelAnimationFrame(focusFrameRef.current);
            }
        };
    }, [show, loading, detailLoading, shippingDataWrap]);

    const ButtonShippingModal = (
        <Space direction="horizontal" size="middle" >
            <Button onClick={() => close(false) }>ย้อนกลับ</Button>
            <Button type='primary' onClick={() => handleConfirm() } disabled={detailLoading}>ยืนยันเตรียมออกใบวางบิล</Button>
        </Space>
    );

    return (
        <Modal
            open={show}
            title="เลือกใบส่งของ"
            onCancel={() => close(false) }
            afterOpenChange={(open) => {
                if (open) {
                    focusFirstTableRow();
                }
            }}
            footer={ButtonShippingModal}
            maskClosable={false}
            style={{ top: 20 }}
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
                                        <Input suffix={<SearchOutlined />} onChange={ (e) => { handleSearch(e.target.value) } } placeholder='ค้นหาเลขที่ใบส่งของ หรือ ชื่อลูกค้า'/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                    <Card>
                        <div ref={tableWrapRef}>
                        <Table
                            bordered
                            dataSource={shippingDataWrap}
                            columns={shippingColumns()}
                            loading={false}
                            rowSelection={shippingSelection}
                            rowKey="_rowKey"
                            onRow={(record, index) => createRowHandler({
                                record,
                                index,
                                dataSource: shippingDataWrap,
                                rowKey: "_rowKey",
                                setSelectedKeys: setShippingRowKeySelect,
                                isDisabled: (row) => handleCheckDuplicate(row._rowKey),
                                // onLastRow: handleConfirm,
                            })}
                            pagination={{
                                total: shippingDataWrap.length,
                                showTotal: (_, range) => `${range[0]}-${range[1]} of ${shippingItems.length} items`,
                                defaultPageSize: 10,
                                pageSizeOptions: [10,25,35,50,100]
                            }}
                            scroll={{ x: 'max-content' }} size='small'
                        />
                        </div>
                    </Card>
                </Space>
            </Spin>
        </Modal>
    );
}