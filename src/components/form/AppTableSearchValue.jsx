/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Col, Divider, Drawer, Flex, Row, Table, Typography } from 'antd';
import { TbPencil, 
    TbCirclePlus, 
    TbTrashXFilled, 
    TbColumns, 
    // TbSettingsCheck,
    TbEyeOff, TbEye
} from "react-icons/tb";


import { v4 as uuidv4 } from 'uuid';
function AppTableSearchValue({
    provider = true,
    title = "",
    setPageDefault = {},
    // ignoreLoad = false,
    multi,
    tbProps = {},
    onPageChange,
    onSelectedRow,
    onCreate,
    onUpdate,
    onDelete,
}){
    const bntStyle = {
      minWidth: 102,
      fontSize: 'clamp(12px, 0.7vw, 1rem)',
      display: 'flex',
      alignItems: 'center',
      fontWeight: 200,
    }
    const iconStyle = { 
      fontSize: 'clamp(25px, 0.9vw, 1.7rem)',
      fontWeight: 200,
    }  
    const context = useTbSearchContext();
    // const [loading, setLoading] = useState(false);
    // const [source, setSource] = useState(data);

    const [firstSelect, setFirstSelect] = useState(false);
    const [tableParams, setTableParams] = useState({...setPageDefault});

    const [rowKeySelectLocal, setRowKeySelectLocal] = useState([]);
    const [rowRecordSelectLocal, setRowRecordSelectLocal] = useState([]);

    const selectedRowKeys    = (context && provider) ? context.rowKeySelect : rowKeySelectLocal;
    const setSelectedRowKeys = (context && provider) ? context.setRowKeySelect : setRowKeySelectLocal;
    
    const selectedRowRecord    = (context && provider) ? context.rowRecordSelect : rowRecordSelectLocal;
    const setSelectedRowRecord = (context && provider) ? context.setRowRecordSelect : setRowRecordSelectLocal;

    const [propColumn, setPropColumn] = useState(tbProps?.columns);
    
    const [openManageColumn, setOpenManageColumn] = useState( false )
    const [isManageColumn, setIsManageColumn] = useState( false );
    const [columnData, setColumnData] = useState( [] );
 
    const handleRowClick = (record) => { 
      const newSelectedRowKeys = [...selectedRowKeys];
      const newSelectedRecord = [...selectedRowRecord];
      const rowKey = tbProps?.rowKey || "id";
      const recordKey = record[rowKey];
    
      if (newSelectedRowKeys.includes(recordKey)) {
        setSelectedRowKeys(newSelectedRowKeys.filter(key => key !== recordKey));
        setSelectedRowRecord(newSelectedRecord.filter(rec => rec[rowKey] !== recordKey))
      } else {
        setSelectedRowKeys(state => multi ? [ ...new Set([...state, recordKey])] : [recordKey]); 
        setSelectedRowRecord(state => multi ? [ ...new Set(
          ([...state, record].map( s => JSON.stringify(s)))
        )].map( m => JSON.parse(m)) : [record])
      } 

      setFirstSelect(true);
    };
    
    const isSelected = (record) => selectedRowKeys.includes( record[tbProps?.rowKey || "id"] );

    const hendleOpenManageColumn = () => { setIsManageColumn(true); setOpenManageColumn(true) };

    const handleToggleColumn = (status) => {
        setPropColumn( state => state.map( (c) => { 
            if( Object.keys(c)?.includes("hide") ){
                c.hide = status;
            }
            return c;
        })); 
        setOpenManageColumn(false);        
    };

    const handleTableChange = (pagination, filters, sorter, extra) => {
        const page = { pagination, filters, ...sorter }
        // console.log('params', pagination, page, extra);
        setTableParams({...page});
        onPageChange(page);
    };

    const handleUpdateRow = () => {
      onUpdate(multi ? selectedRowKeys: selectedRowKeys[0], multi ? selectedRowRecord : selectedRowRecord[0] );

      setSelectedRowKeys([]);
      setSelectedRowRecord([])
    }

    const handleDeleteRow = () => {
      onDelete(multi ? selectedRowKeys: selectedRowKeys[0], multi ? selectedRowRecord : selectedRowRecord[0] );

      setSelectedRowKeys([]);
      setSelectedRowRecord([])
    }

    const head = (<>
      <Row className='!mx-0 bg-gray-100'>
        <Col xs={24} sm={24} md={24} lg={12} >
          <Flex className='justify-center lg:justify-start'>
            { !!title && <Typography.Title level={5}>{ title }</Typography.Title> }
          </Flex>
        </Col>
        <Col xs={24} sm={24} md={24} lg={12} >
          <Flex className='w-full gap-2 sm:gap-4 justify-start sm:justify-end flex-wrap'>
            { !!onCreate && <Button
                icon={<TbCirclePlus style={iconStyle} />} 
                style={bntStyle} 
                className='bn bn-primary' 
                onClick={()=>onCreate()} 
            >
              <Typography.Text>เพิ่ม</Typography.Text>
            </Button>}

            { !!onUpdate && <Button 
                icon={<TbPencil style={iconStyle} />} 
                style={bntStyle} 
                className='bn bn-primary-outline' 
                disabled={selectedRowKeys.length === 0}  
                onClick={()=>handleUpdateRow()}
            >
              <Typography.Text>แก้ไข</Typography.Text>
            </Button>}

            { !!onDelete && <Button 
                icon={<TbTrashXFilled style={iconStyle} />} 
                style={bntStyle} 
                className='bn-danger-outline' 
                disabled={selectedRowKeys.length === 0}  
                onClick={()=>handleDeleteRow()}
            >
              <Typography.Text>ลบ</Typography.Text>
            </Button>}

            { columnData.length > 0 && <Button 
                icon={<TbColumns style={iconStyle} />} 
                style={bntStyle} 
                className='bn-secondary-outline' 
                onClick={hendleOpenManageColumn} 
            >
              <Typography.Text>คอลัมน์</Typography.Text>
            </Button>}
            
          </Flex>
        </Col>
      </Row>
    </>);

    useEffect(() => {
        if( tbProps?.columns.length > 0 ){
            setPropColumn( tbProps?.columns ); 
        }
        
        return () => {};
    }, [ tbProps?.columns ]);

    useEffect(() => {
        if( propColumn.length > 0 ){  
            setColumnData( (propColumn || []).filter( c => Object.keys(c)?.includes("hide") ) );
        }
        return () => {  };
    }, [ propColumn ]); 

    useEffect(() => { 
      if( !( typeof onSelectedRow === "function" ) || !firstSelect) return;
      
      if(multi) ( typeof onSelectedRow === "function" ) && onSelectedRow(selectedRowRecord, selectedRowKeys);
      else ( typeof onSelectedRow === "function" ) && onSelectedRow(selectedRowRecord[0],selectedRowKeys[0]);

      return () => { setFirstSelect(false) };
    },[selectedRowRecord, selectedRowKeys]);

    const manageColumnFoot = (
      <Row gutter={[{xs:32, sm:32, md:32, lg:12, xl:12}, 8]} className='m-0'> 
          <Col span={24} className='p-0'>
            <Flex gap={4} justify='end'>
              <Button 
                icon={<TbEye style={iconStyle} />} 
                style={bntStyle} 
                className='bn bn-success' 
                onClick={() => handleToggleColumn(false)}              
              >แสดงทั้งหมด</Button>
              <Button 
                icon={<TbEyeOff style={iconStyle} />} 
                style={bntStyle} 
                className='bn bn-secondary' 
                onClick={() => handleToggleColumn(true)}              
              >ซ่อนทั้งหมด</Button>
            </Flex>
          </Col>
      </Row>
    )

    return (
      <>
        <Table 
          onChange={handleTableChange}
          className='tb-search'
          size='small'
          pagination={tableParams.pagination} 
          rowClassName={(record) => (isSelected(record) ? 'ant-table-row-selected' : '')}
          onRow={(record) => ({
              onClick: () => handleRowClick(record),
          })}
          rowKey='id'
          showSorterTooltip={false}
          title={ () => head }
          scroll={{ x: 'max-content' }}
          {...tbProps}

          columns={propColumn.filter(c => !c.hide )}
        />
        { isManageColumn && <Drawer
          title='จัดการคอลัมน์'
          onClose={() => { setOpenManageColumn(false); }}
          open={openManageColumn}
          width={480}
          className="responsive-drawer" 
          footer={manageColumnFoot}
          afterOpenChange={(e)=>{ !e && setIsManageColumn(false); }}
          maskClosable={true}
          >  
            <div className='flex flex-col gap-y-4 w-full'>
                <Divider orientation="left" style={{margin:10}} className='!border-black' > แสดง/ซ่อน คอลัมน์ </Divider>
                { columnData.map( ( item ) => {  
                    return (
                    <div key={uuidv4()} >
                    <Flex align='center' gap={8}>
                      <Button 
                        icon={ !item?.hide ? <TbEyeOff style={{fontSize: '1rem'}}/> : <TbEye style={{fontSize: '1rem'}}/>  } 
                        style={{width: 34, height:34}}
                        className={`${!item?.hide ? 'bn-secondary' : 'bn-success'}`}
                        size='small'
                        onClick={() => {
                          setPropColumn( state => state.map( (m ) => {
                            // console.log(item.key)
                            if( item.key === m.key ){
                              m.hide = !m.hide
                            }
                            return m;
                          }));
                        }}
                      />
                      <Typography.Text delete={item?.hide}>{ item?.title || "" } </Typography.Text>
                    </Flex>
                    <Divider />
                    </div>
                    ) 
                })}
            </div>
          </Drawer> 
        }
      </>
    )
}

AppTableSearchValue.propTypes = {
  provider: PropTypes.bool,
  title: PropTypes.string,
  setPageDefault: PropTypes.object,
  footer: PropTypes.node,
  multi: PropTypes.bool,
  rowSelect: PropTypes.array,
  // ignoreLoad = false,
  tbProps: PropTypes.object,
  onPageChange: PropTypes.func,
  onSelectedRow: PropTypes.func,
  onCreate: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.bool,
    // PropTypes.arrayOf(PropTypes.string)
  ]),
  onUpdate: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.bool,
  ]),
  onDelete: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.bool,
  ]),
}

export default AppTableSearchValue