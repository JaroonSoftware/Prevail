/* eslint-disable react-hooks/exhaustive-deps */
import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { Collapse, Form, Typography } from 'antd';
import { Row, Col, Flex, Button } from "antd";
import React, { useEffect, useState } from 'react' 



export default function AppFormSearchValue({children, title="Search", defaultValue={}, onValues  }) {
    const [form] = Form.useForm(); 
    const [activeSearch, setActiveSearch] = useState([]);
    // const borderDivider = { borderColor: 'var(--primary)', transform: 'none'  };

    const handleClear = () => {
        try {
            form.resetFields();

            onValues({});
        } catch ( e ){
            console.log( e );
        }
    }

    useEffect( () => {
      const initeial = () => { 
        console.log( defaultValue );
        if( Object.values(defaultValue).length > 0 ) setActiveSearch(['1'])
        form.setFieldsValue( defaultValue ); 
      } 
      initeial(); 
    }, [])

    const FormContent = (<>
        <Row gutter={[8, 8]}>
          {children}
        </Row>
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={8} md={12} lg={12} xl={12}>
            {/* Ignore */}
          </Col>
          <Col xs={24} sm={8} md={12} lg={12} xl={12}>
            <Flex justify="flex-end" gap={8}>
              <Button 
                size="small"
                className="bn-action bn-primary-outline"
                icon={<SearchOutlined />}
                onClick={() => onValues( form?.getFieldsValue() )}
              > Search </Button>
              <Button 
                size="small"
                className="bn-action bn-danger-outline" 
                icon={<ClearOutlined />}
                onClick={() => handleClear()}
              > Clear </Button>
            </Flex>
          </Col>
        </Row>  
        {/* <Divider style={borderDivider} /> */}
    </>);

    const FormSearch = (<>
        <Collapse
          size="small"
          onChange={(e) => { setActiveSearch(e); }}
          activeKey={activeSearch}
          items={[
            {
              key: "1",
              label: (<>
                {/* <Divider orientation="left" orientationMargin="0" className='!m-0' style={borderDivider} > */}
                    <Flex gap={5}>
                        <SearchOutlined /> 
                        <Typography.Text strong>{title}</Typography.Text> 
                    </Flex>
                {/* </Divider> */}
              </>),
              children: FormContent,
              showArrow: false,
            },
          ]}
          bordered={false}
          className='bg-gray-100 px-2 py-1 sm:px-4'
        />
    </>);
      
    return (
      <Form form={form} layout="vertical" autoComplete="off" onValuesChange={(_, value) => onValues(value) }>
          {FormSearch}
      </Form>
    )
}
