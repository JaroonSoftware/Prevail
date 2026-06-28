/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Card, Table, message, Form, Spin } from "antd";
import { Row, Col, Space } from "antd";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";

import { dnSummaryColumns } from "./model";

export default function DnSummaryModal({ show, close, values, selected, dnData, loading, dimmed = false }) {
    const [form] = Form.useForm();
    const tableWrapRef = useRef(null);
    const focusFrameRef = useRef(null);
    const [dnDataWrap, setDnDataWrap] = useState([]);
    const [dnRowKeySelect, setDnRowKeySelect] = useState([]);

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
            const f = dnData.filter((d) => (
                d.dncode?.toLowerCase().includes(value?.toLowerCase()) ||
                d.cusname?.toLowerCase().includes(value?.toLowerCase())
            ));

            setDnDataWrap(f);
        } else {
            setDnDataWrap(dnData);
        }
    };

    const loadDnData = () => {
        if (!show) {
            setDnDataWrap([]);
            setDnRowKeySelect([]);
            return;
        }

        const selectedDncodes = [...new Set((selected || []).map((item) => item?.dncode).filter(Boolean))];

        setDnDataWrap(dnData || []);
        setDnRowKeySelect(selectedDncodes.filter((dncode) => (dnData || []).some((item) => item.dncode === dncode)));
    };

    const handleConfirm = () => {
        const itemsChoose = dnDataWrap.filter((item) => dnRowKeySelect.includes(item.dncode));

        if (itemsChoose.length < 1) {
            message.warning("กรุณาเลือกใบส่งของ");
            return;
        }

        values(itemsChoose);
    };

    const dnSelection = {
        selectedRowKeys: dnRowKeySelect,
        type: "checkbox",
        fixed: true,
        hideSelectAll: false,
        onChange: (selectedRowKeys) => {
            setDnRowKeySelect(selectedRowKeys);
        },
        onSelect: (record, selectedRow) => {
            setDnRowKeySelect((state) => (
                selectedRow
                    ? [...new Set([...state, record.dncode])]
                    : state.filter((item) => item !== record.dncode)
            ));
        },
    };

    useEffect(() => {
        loadDnData();
    }, [show, dnData, selected]);

    useEffect(() => {
        if (!show || loading || dnDataWrap.length < 1) {
            return;
        }

        focusFirstTableRow();
    }, [show, loading, dnDataWrap]);

    useEffect(() => {
        return () => {
            if (focusFrameRef.current) {
                cancelAnimationFrame(focusFrameRef.current);
            }
        };
    }, [show, loading, dnDataWrap]);

    const column = dnSummaryColumns();

    const ButtonDnSummaryModal = (
        <Space direction="horizontal" size="middle" >
            <Button onClick={() => close(false) }>ปิด</Button>
            <Button type='primary' onClick={() => handleConfirm() }>ถัดไปเลือกรายการสินค้า</Button>
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
            footer={ButtonDnSummaryModal}
            maskClosable={false}
            mask={!dimmed}
            style={{ top: 20, visibility: dimmed ? 'hidden' : 'visible' }}
            width={900}
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
                            dataSource={dnDataWrap}
                            columns={column}
                            loading={false}
                            rowSelection={dnSelection}
                            rowKey="dncode"
                            onRow={(record, index) => createRowHandler({
                                record,
                                index,
                                dataSource: dnDataWrap,
                                rowKey: "dncode",
                                setSelectedKeys: setDnRowKeySelect,
                                onLastRow: handleConfirm,
                            })}
                            pagination={{
                                total: dnDataWrap.length,
                                showTotal: (_, range) => `${range[0]}-${range[1]} of ${dnDataWrap.length} items`,
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
