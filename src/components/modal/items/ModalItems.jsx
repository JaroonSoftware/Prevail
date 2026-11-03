/* eslint-disable react-hooks/exhaustive-deps */
import React, {useState, useEffect} from 'react';
import { Modal, Card, Table, message, Form, Spin, Segmented, Tag } from "antd";
import { Row, Col, Space } from "antd";
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons"
import { columns } from "./modal-items.model"; 
// import ItemService from "../../service/ItemService";
import OptionService from "../../../service/Options.service"

const opnService = OptionService();
/* groups / groupId (ไม่บังคับ): ใช้ในหน้าแคตตาล็อกที่แบ่งแท็บตามหมวด
   เปิดจากแท็บไหน ค่าเริ่มต้นแสดงเฉพาะสินค้าหมวดนั้น สลับเป็น "สินค้าทั้งหมด" ได้
   หน้าที่ไม่ส่ง groupId มา (เช่นใบขายสินค้า) ทำงานเหมือนเดิมทุกอย่าง */
export default function ModalCusCL({show, close, values, selected, groups = [], groupId = undefined}) {
    const [form] = Form.useForm();
    /** handle state */
    const [itemsData, setItemsData] = useState([]);
    const [itemsDataWrap, setItemsDataWrap] = useState([]);
    
    const [itemsList, setItemsList] = useState(selected || []);
    const [itemsRowKeySelect, setItemsRowKeySelect] = useState([]);
    const [loading,  setLoading] = useState(true);
    const hasGroupMode = groupId !== undefined;
    const [viewMode, setViewMode] = useState(hasGroupMode && groupId !== null ? "group" : "all");
    const [searchText, setSearchText] = useState("");
    const groupName = (id) => groups.find((g) => String(g.group_id) === String(id))?.group_name;
    /** handle logic component */
    const handleClose = () =>{ 
        close(false);
    }
 
    /* กรองตามคำค้น + หมวด (groupId = null หมายถึงแท็บ "ยังไม่จัดหมวด") */
    useEffect(() => {
        let f = itemsData;
        if (hasGroupMode && viewMode === "group") {
            f = f.filter((d) => groupId === null ? !d.catalog_group_id : String(d.catalog_group_id) === String(groupId));
        }
        if (searchText) f = f.filter( d => ( (d.stcode?.includes(searchText)) || (d.stname?.includes(searchText)) ) );
        setItemsDataWrap(f);
    }, [itemsData, searchText, viewMode, groupId]);

    const handleSearch = (value) => setSearchText(value || "");

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

    const handleCheckDuplicate = (itemCode) => !!selected.find( (item) =>  item?.stcode === itemCode ) ; 

    const handleConfirm = () => { 
        const choosed = selected.map( m => m.stcode );
        const itemsChoose = (itemsData.filter( f => itemsRowKeySelect.includes(f.stcode) && !choosed.includes(f.stcode) )).map( (m, i) => (
        {
            stcode:m.stcode,
            stname:m.stname,
            price: Number(m?.price || 0),
            qty: 1,
            unit:m.unit,
            discount:0,
            catalog_group_id: m.catalog_group_id ?? null,
        }));
        
        // const trans = selected.filter( (item) =>  item?.stcode === "" );
        // const rawdt = selected.filter( (item) =>  item?.stcode !== "" );
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
                disabled: handleCheckDuplicate(record.stcode), 
                name: record.stcode,
            }
        },
        onSelect: (record, selected, selectedRows, nativeEvent) => {
            //console.log(record, selected, selectedRows, nativeEvent);
            if( selected ){
                setItemsRowKeySelect([...new Set([...itemsRowKeySelect, record.stcode])]);
            } else {
                const ind = itemsRowKeySelect.findIndex( d => d === record.stcode);
                const tval = [...itemsRowKeySelect];
                tval.splice(ind, 1);
                setItemsRowKeySelect([...tval]);
                //console.log(ind, itemsRowKeySelect);
            }
        }
    };

    /** End Config Component */

    /** setting initial component */ 
    const column = hasGroupMode
        ? [...columns( { handleSelectItems, handleCheckDuplicate } ), {
            title: "หมวด", key: "catalog_group_id", dataIndex: "catalog_group_id",
            render: (v) => (v ? groupName(v) || "-" : <Tag>ยังไม่จัดหมวด</Tag>),
          }]
        : columns( { handleSelectItems, handleCheckDuplicate } );

    useEffect( () => {
        const onload = () =>{
            setLoading(true);
            opnService.optionsItems({p:'items'}).then((res) => {
                let { status, data } = res;
                if (status === 200) {
                    setItemsData(data.data);
                    setItemsDataWrap(data.data);

                    const keySeleted = selected.map( m => m.stcode );

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
                                {hasGroupMode && (
                                    <Col span={24}>
                                        <Segmented
                                            value={viewMode}
                                            onChange={setViewMode}
                                            options={[
                                                { value: "group", label: `เฉพาะหมวดนี้ (${groupId === null ? "ยังไม่จัดหมวด" : groupName(groupId) || "-"})` },
                                                { value: "all", label: "แสดงสินค้าทั้งหมด" },
                                            ]}
                                        />
                                    </Col>
                                )}
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
                            rowKey="stcode"
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