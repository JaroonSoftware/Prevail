import { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Button,
  Typography,
  message,
} from "antd";
import { AppstoreOutlined, UnorderedListOutlined, SaveFilled } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Itemservice from "../../service/Items.Service";
import { ReactSortable } from "react-sortablejs";
import "./MyPage.css";

const itemservice = Itemservice();
const { Title, Text } = Typography;

export default function ItemsOrder({ source }) {
  const navigate = useNavigate();

  const [dataSource, setDataSource] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await itemservice.search({}, { ignoreLoading: true });
        const data = res?.data?.data || [];
        const mapped = data.map((item, idx) => ({
          ...item,
          key: (item.id ?? idx + 1).toString(),
        }));
        setDataSource(mapped);
      } catch (err) {
        console.error(err);
        message.error("Request error!");
      }
    };
    fetchData();
  }, []);

  const handleSaveOrder = async () => {
    try {
      const newData = dataSource.map((item, index) => ({
        ...item,
        seq: Number(index+1),
      }));
      await itemservice.order({ detail: newData });
      message.success("Request success.");
      navigate("/items", { replace: true });
    } catch (err) {
      console.warn(err);
      const data = err?.response?.data;
      message.error(data?.message || "บันทึกไม่สำเร็จ");
    }
  };

  const onSortChange = (newList) => {
    // setDataSource(Array.isArray(newList) ? [...newList] : []);
    // newList เป็นลำดับล่าสุด — เก็บ state และแสดง log เพื่อเช็ค
    const list = Array.isArray(newList) ? [...newList] : [];
    console.log("new order:", list.map((it, i) => ({ pos: i+1, key: it.key, stcode: it.stcode })));
    setDataSource(list);
  };

  const TopBar = (
    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
      <Col>
        <Space>
          {/* เอา Select เรียงออกแล้ว */}
        </Space>
      </Col>
      <Col>
        <Space>
          <Button
            icon={<AppstoreOutlined />}
            type={viewMode === "grid" ? "primary" : "default"}
            onClick={() => setViewMode("grid")}
          />
          <Button
            icon={<UnorderedListOutlined />}
            type={viewMode === "list" ? "primary" : "default"}
            onClick={() => setViewMode("list")}
          />
          <Button icon={<SaveFilled />} type="primary" onClick={handleSaveOrder}>
            บันทึก
          </Button>
        </Space>
      </Col>
    </Row>
  );

  const GridView = (
    <div>
      <ReactSortable
        list={dataSource}
        setList={onSortChange}
        animation={150}
        className="myorder-grid-wrap"
        chosenClass="myorder-chosen"
        ghostClass="myorder-ghost"
      >
        {dataSource.map((item) => (
          <div key={item.key} className="myorder-grid-item">
            <Card hoverable bodyStyle={{ padding: 8 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="myorder-thumb">
                  {item.image ? (
                    <img src={item.image} alt={item.stname} />
                  ) : (
                    <div className="myorder-thumb-empty" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: 0 }}>
                    {item.stname || item.name}
                  </Title>
                  <Text strong>
                    {Number(item.price || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </ReactSortable>
    </div>
  );

  const ListView = (
    <div>
      <ReactSortable
        list={dataSource}
        setList={onSortChange}
        animation={150}
        className="myorder-list-wrap"
        chosenClass="myorder-chosen"
        ghostClass="myorder-ghost"
      >
        {dataSource.map((item) => (
          <div key={item.key} className="myorder-list-item">
            <Card hoverable>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div className="myorder-thumb-lg">
                  {item.image ? (
                    <img src={item.image} alt={item.stname} />
                  ) : (
                    <div className="myorder-thumb-empty" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={5} style={{ margin: 0 }}>{item.stname || item.name}</Title>
                  <Text type="secondary">{item.description}</Text>
                </div>
                <div style={{ minWidth: 120, textAlign: "right" }}>
                  <Text strong>
                    {Number(item.price || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </ReactSortable>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Button onClick={() => navigate("/" + source)}>ย้อนกลับ</Button>
      </div>
      {TopBar}
      <div>
        {viewMode === "grid" ? GridView : ListView}
      </div>
    </div>
  );
}