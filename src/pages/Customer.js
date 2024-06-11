import { SearchOutlined, ToolTwoTone } from "@ant-design/icons";
import React, { useRef, useState, useEffect } from "react";
import Highlighter from "react-highlight-words";
import {
  Button,
  Input,
  Space,
  Table,
  Row,
  Col,
  Card,
  Modal,
  Form,
  Select,
  Badge,
} from "antd";
import Swal from "sweetalert2";
import CustomerService from "../service/CustomerService";
import { PROVINCE_OPTIONS } from "../utils/util";

function Customer() {
  const [AllCustomer, setAllCustomer] = useState("");
  const [OpenModalAdd, setOpenModalAdd] = useState(false);
  const [OpenModalEdit, setOpenModalEdit] = useState(false);
  const [formAdd] = Form.useForm();
  const [formEdit] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");

  const searchInput = useRef(null);

  useEffect(() => {
    GetCustomer();
  }, []);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
              height: 40,
            }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
              height: 40,
            }}
          >
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({
                closeDropdown: false,
              });
              setSearchText(selectedKeys[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns = [
    {
      title: "รหัสลูกค้า",
      dataIndex: "cuscode",
      key: "cuscode",
      width: "30%",
      ...getColumnSearchProps("cuscode"),
      sorter: (a, b) => a.cuscode.length - b.cuscode.length,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "ชื่อลูกค้า",
      dataIndex: "cusname",
      key: "cusname",
      width: "30%",
      ...getColumnSearchProps("cusname"),
      sorter: (a, b) => a.cusname.length - b.cusname.length,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "จังหวัด",
      dataIndex: "district",
      key: "district",
      width: "30%",
      ...getColumnSearchProps("district"),
      sorter: (a, b) => a.district.length - b.district.length,
      sortDirections: ["descend", "ascend"],
    },
    {
      title: "สถานะการใช้งาน",
      dataIndex: "statuscus",
      key: "statuscus",
      width: "20%",
      ...getColumnSearchProps("statuscus"),
      sorter: (a, b) => a.statuscus.length - b.statuscus.length,
      sortDirections: ["descend", "ascend"],
      render: (data) => (
        <div>
          {data === "Y" ? (
            <Badge status="success" text="เปิดการใช้งาน" />
          ) : (
            <Badge status="error" text="ปิดการใช้การ" />
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "operation",
      width: "20%",
      fixed: "right",
      render: (text) => (
        <Button
          icon={<ToolTwoTone twoToneColor="#E74C3C" />}
          style={{ cursor: "pointer" }}
          danger
          onClick={(e) => showEditModal(text.cuscode)}
        >
          แก้ใข
        </Button>
      ),
    },
  ].filter((item) => !item.hidden);

  const GetCustomer = () => {
    CustomerService.getCustomer()
      .then((res) => {
        let { status, data } = res;
        if (status === 200) {
          setAllCustomer(data);
        }
      })
      .catch((err) => {});
  };

  const showAddModal = () => {
    CustomerService.getCuscode()
      .then((res) => {
        let { status, data } = res;
        if (status === 200) {
          // console.log(data.replaceAll('"', ''))
          formAdd.setFieldValue("Addcuscode", data.replaceAll('"', ""));
        }
      })
      .catch((err) => {});
    setOpenModalAdd(true);
  };

  const showEditModal = (data) => {
    CustomerService.getSupCustomer(data)
      .then((res) => {
        let { status, data } = res;
        if (status === 200) {
          console.log(data)
          formEdit.setFieldValue("Editcusname", data.cusname);
          formEdit.setFieldValue("Editstatuscus", data.statuscus);
          formEdit.setFieldValue("Editidno", data.idno);
          formEdit.setFieldValue("Editroad", data.road);
          formEdit.setFieldValue("Editsubdistrict", data.subdistrict);
          formEdit.setFieldValue("Editdistrict", data.district);
          formEdit.setFieldValue("Editprovince", data.province);
          formEdit.setFieldValue("Editzipcode", data.zipcode);
          formEdit.setFieldValue("Edittel", data.tel);
          formEdit.setFieldValue("Editfax", data.fax);
          formEdit.setFieldValue("Edittaxnumber", data.taxnumber);
          formEdit.setFieldValue("Editemail", data.email);
          formEdit.setFieldValue("Editcuscode", data.cuscode);

          setOpenModalEdit(true);
        }
      })
      .catch((err) => {});
  };

  const submitAdd = (dataform) => {
    CustomerService.addCustomer(dataform)
      .then(async (res) => {
        let { status, data } = res;
        if (status === 200) {
          if (data.status) {
            await Swal.fire({
              title: "<strong>สำเร็จ</strong>",
              html: data.message,
              icon: "success",
            });

            GetCustomer();
            setOpenModalAdd(false);
            formAdd.resetFields();
          } else {
            // alert(data.message)
            Swal.fire({
              title: "<strong>ผิดพลาด!</strong>",
              html: data.message,
              icon: "error",
            });
          }
        }
      })
      .catch((err) => {});
  };

  const submitEdit = (dataform) => {
    CustomerService.editCustomer(dataform)
      .then(async (res) => {
        let { status, data } = res;
        if (status === 200) {
          if (data.status) {
            await Swal.fire({
              title: "<strong>สำเร็จ</strong>",
              html: data.message,
              icon: "success",
            });

            GetCustomer();

            setOpenModalEdit(false);
          } else {
            // alert(data.message)
            Swal.fire({
              title: "<strong>ผิดพลาด!</strong>",
              html: data.message,
              icon: "error",
            });
          }
        }
      })
      .catch((err) => {});
  };

  ////////////////////////////////

  const ModalAdd = ({ open, onCancel }) => {
    return (
      <Modal
        open={open}
        title="เพิ่มลูกค้า"
        okText="Create"
        cancelText="Cancel"
        onCancel={onCancel}
        width={1200}
        onOk={() => {
          formAdd
            .validateFields()
            .then((values) => {
              // formAdd.resetFields();
              // console.log(values)
              submitAdd(values);
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}
      >
        <Form
          form={formAdd}
          layout="vertical"
          name="form_in_modal"
          initialValues={{
            modifier: "public",
          }}
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              รหัสลูกค้า
              <Form.Item
                name="Addcuscode"
                rules={[
                  {
                    required: true,
                    message: "กรุณาใส่รหัสลูกค้า!",
                  },
                ]}
              >
                <Input placeholder="รหัสลูกค้า" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={18} lg={18} xl={18}>
              ชื่อลูกค้า
              <Form.Item
                name="Addcusname"
                rules={[
                  {
                    required: true,
                    message: "กรุณาใส่ชื่อลูกค้า!",
                  },
                ]}
              >
                <Input placeholder="ใส่ชื่อลูกค้า" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เลขที่
              <Form.Item name="Addidno">
                <Input placeholder="เลขที่" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              ถนน
              <Form.Item name="Addroad">
                <Input placeholder="ถนน" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              ตำบล
              <Form.Item name="Addsubdistrict">
                <Input placeholder="ตำบล" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              อำเภอ
              <Form.Item name="Adddistrict">
                <Input placeholder="อำเภอ" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              จังหวัด
              <Form.Item
                name="Addprovince"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุประเภท!",
                  },
                ]}
              >
                <Select style={{ height: 40 }} options={PROVINCE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              รหัสไปรษณีย์
              <Form.Item name="Addzipcode">
                <Input placeholder="รหัสไปรษณีย์" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เบอร์โทรศัพท์
              <Form.Item name="Addtel">
                <Input placeholder="เบอร์โทรศัพท์" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เบอร์แฟ็ค
              <Form.Item name="Addfax">
                <Input placeholder="เบอร์แฟ็ค" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เลขที่ผู้เสียภาษี
              <Form.Item name="Addtaxnumber">
                <Input placeholder="เลขที่ผู้เสียภาษี" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              Email
              <Form.Item name="Addemail">
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  };

  const ModalEdit = ({ open, onCancel }) => {
    return (
      <Modal
        open={open}
        title="แก้ไขลูกค้า"
        okText="Edit"
        cancelText="Cancel"
        width={1200}
        onCancel={onCancel}
        onOk={() => {
          formEdit
            .validateFields()
            .then((values) => {
              // formEdit.resetFields();
              // console.log(values)
              submitEdit(values);
            })
            .catch((info) => {
              console.log("Validate Failed:", info);
            });
        }}
      >
        <Form
          form={formEdit}
          layout="vertical"
          name="form_in_modal"
          initialValues={{
            modifier: "public",
          }}
        >
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              รหัสลูกค้า
              <Form.Item
                name="Editcuscode"
                rules={[
                  {
                    required: true,
                    message: "กรุณาใส่รหัสลูกค้า!",
                  },
                ]}
              >
                <Input placeholder="รหัสลูกค้า" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={18} lg={18} xl={18}>
              ชื่อลูกค้า
              <Form.Item
                name="Editcusname"
                rules={[
                  {
                    required: true,
                    message: "กรุณาใส่ชื่อลูกค้า!",
                  },
                ]}
              >
                <Input placeholder="ใส่ชื่อลูกค้า" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เลขที่
              <Form.Item name="Editidno">
                <Input placeholder="เลขที่" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              ถนน
              <Form.Item name="Editroad">
                <Input placeholder="ถนน" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              ตำบล
              <Form.Item name="Editsubdistrict">
                <Input placeholder="ตำบล" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              อำเภอ
              <Form.Item name="Editdistrict">
                <Input placeholder="อำเภอ" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              จังหวัด
              <Form.Item
                name="Editprovince"
                rules={[
                  {
                    required: true,
                    message: "กรุณาระบุประเภท!",
                  },
                ]}
              >
                <Select style={{ height: 40 }} options={PROVINCE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              รหัสไปรษณีย์
              <Form.Item name="Editzipcode">
                <Input placeholder="รหัสไปรษณีย์" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เบอร์โทรศัพท์
              <Form.Item name="Edittel">
                <Input placeholder="เบอร์โทรศัพท์" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เบอร์แฟ็ค
              <Form.Item name="Editfax">
                <Input placeholder="เบอร์แฟ็ค" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[24, 0]}>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              เลขที่ผู้เสียภาษี
              <Form.Item name="Edittaxnumber">
                <Input placeholder="เลขที่ผู้เสียภาษี" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={6} lg={6} xl={6}>
              Email
              <Form.Item name="Editemail">
                <Input placeholder="Email" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              สถานการใช้งาน
              <Form.Item
                name="Editstatuscus"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select
                  style={{ height: 40 }}
                  options={[
                    {
                      value: "Y",
                      label: <Badge status="success" text="เปิดการใช้งาน" />,
                    },
                    {
                      value: "N",
                      label: <Badge status="error" text="ปิดการใช้งาน" />,
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    );
  };

  return (
    <>
      <div className="layout-content">
        <Button
          type="primary"
          onClick={() => {
            showAddModal();
          }}
        >
          เพิ่มลูกค้า
        </Button>
        <ModalAdd
          open={OpenModalAdd}
          onCancel={() => {
            setOpenModalAdd(false);
          }}
        />
        <ModalEdit
          open={OpenModalEdit}
          onCancel={() => {
            setOpenModalEdit(false);
          }}
        />
        <Row gutter={[24, 0]} style={{ marginTop: "1rem" }}>
          <Col xs={24} sm={24} md={24} lg={24} xl={24} className="mb-24">
            <Card bordered={false} className="criclebox cardbody h-full">
              <Table
                size="small"
                columns={columns}
                dataSource={AllCustomer}
                rowKey="cuscode"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}

export default Customer;
