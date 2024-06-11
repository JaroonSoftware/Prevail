import React, { useEffect, useState } from 'react';

// import { MinusCircleTwoTone, PlusOutlined } from '@ant-design/icons';
import { Input, Form, Card, Row, Col, Divider, Select, Flex, Typography, message } from 'antd';
 
import OptionService from '../../service/Options.service.js';

const opservice = OptionService();

function BanksManageForm({ confirm, mode, formName, source }) {
  const [form] = Form.useForm();
 
  const [banksOption, setBanksOption] = useState([]);
  const [banksOptionData, setBanksOptionDate] = useState([]);

  // const [formData, setFormData] = useState({});
 
  useEffect( () => {
    const initeial = async () => {
        const [
          lbanksRes, 
        ] = await Promise.all([ 
          opservice.optionsBanks(),
        ]); 
        const {data:banksOptionData} = lbanksRes.data; 

        const opnLtd = banksOptionData.map( v => ({
            value: v.key, 
            label: (
              <>
                  <Flex align='center' gap={8}>
                      <i className={`bank bank-${v.key} shadow huge`} style={{height:30, width:30}}></i>
                      <Flex align='start' gap={1} vertical>
                          {/* <Typography.Text ellipsis style={{ fontSize: 13 }}>{v.thai_name}</Typography.Text>  */}
                          <Typography.Text ellipsis={true} style={{ fontSize: 11, color:'#8c8386' }}>{v.official_name}</Typography.Text> 
                      </Flex>
                  </Flex>
              </>
            ),
            record: v, 
        }));
        setBanksOption( opnLtd );
        setBanksOptionDate( banksOptionData );
  }
    // if( ship.length < 1 ){
    //   setInitForm( shipping_expense_defualt.map( item => ({ expense_name: item, price: 0  })) );
    // } 
    
    initeial();  
  }, []);

  useEffect( () => {
    if(mode !== "create"){
      form.setFieldsValue({...source});
    }else{
      form.setFieldsValue({ });      
    }
  },[source, mode, form])

  const onFinish = (values) => {
    // console.log( values )
    const { bank, acc_name, acc_no, remark } = values;
    const bnk = banksOptionData.find( d =>  d.key === bank );
    if( !bnk ){
        message.error( "Bank data error please choose bank" );
        throw new Error("Bank Data is not empty.");
    } 
    confirm({ 
        bank, 
        acc_name, 
        acc_no,
        remark,
        bank_name : bnk?.official_name,
        bank_name_th : bnk?.thai_name,
        bank_nickname : bnk?.nice_name,
    });
  };


  return (
    <div className='flex flex-col gap-y-4'>
      <Form 
      form={form}
      name={formName}
      onFinish={onFinish}
      style={{ width: '100%', }} autoComplete="off"
      // initialValues={formData} 
      layout='vertical' >
        <Divider orientation="left" plain style={{margin:10}}> Banks  </Divider>
        <Card  style={{backgroundColor:'#f0f0f0' }} > 
          <Row gutter={[8,8]} className='m-0'>
            <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
              <Form.Item className='' name='bank' label='Choose Banks' rules={[{ required: true, message: 'Missing Bank', },]} >
                {/* <Input placeholder='Enter Loading type Name.' /> */}
                <Select 
                  showSearch
                  autoClearSearchValue
                  style={{ height:42, width:'100%' }}
                  options={banksOption} 
                  optionFilterProp="children"
                  filterOption={(input, option) => { 
                    const { record:v } = option; 
                    const val = input?.toLowerCase();
                    return (
                        (v?.official_name?.toLowerCase() ?? '').includes(val) || 
                        (v?.thai_name?.toLowerCase() ?? '').includes(val) || 
                        (v?.key?.toLowerCase() ?? '').includes(val)
                    ) 
                  }}
                  filterSort={(optionA, optionB) =>{ 
                    const { record:v1 } = optionA; 
                    const { record:v2 } = optionB; 

                    return (v1?.official_name ?? '').toLowerCase().localeCompare((v2?.official_name ?? '').toLowerCase())
                  }
                  } 
                  optionLabelProp="label" 
                  optionRender={ (option) => { 
                    const { record:v } = option.data;
                    return (
                    <>
                        <Flex align='self-end' gap={8}>
                            <i className={`bank bank-${v.key} shadow huge flex flex-grow-1`} style={{height:34, width:34, minWidth: 34}} ></i>
                            <Flex align='start' gap={1} vertical>
                                <Typography.Text ellipsis style={{ fontSize: 13, maxWidth:'100%' }}>{v.thai_name}</Typography.Text> 
                                <Typography.Text ellipsis style={{ fontSize: 11, color:'#8c8386', maxWidth:'100%'}}>{v.official_name}</Typography.Text> 
                            </Flex>
                        </Flex>
                    </>
                  )} }
                  allowClear 
                  placeholder='Enter Loading type Name.'
                />                
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Divider orientation="left" plain style={{margin:10}}> Banks Detail </Divider>
        <Card  style={{backgroundColor:'#f0f0f0' }} >
            <Row gutter={[8,8]} className='m-0'>
                <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} >
                    <Form.Item className='' name='acc_no' label='Account Number' rules={[{ required: true, message: 'Missing Account Number', },]}>
                        <Input placeholder='Enter Account Number' />
                    </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12} xxl={12} >
                    <Form.Item className='' name='acc_name' label='Accout Name' rules={[{ required: true, message: 'Missing Account Name', },]}>
                        <Input placeholder='Enter Accout Name' />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
        <Divider orientation="left" plain style={{margin:10}}> Other </Divider>
        <Card  style={{backgroundColor:'#f0f0f0' }} > 
            <Row gutter={[8,8]} className='m-0'>
              <Col xs={24} sm={24} md={24} lg={24} xl={24} xxl={24} >
                  <Form.Item className='' name='remark' label='Remark' >
                      <Input.TextArea placeholder='Enter Remark' rows={4}  />
                  </Form.Item>
              </Col>
            </Row>
        </Card>        
      </Form>
    </div>
  )
}

export default BanksManageForm