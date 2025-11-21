import { useEffect, useState } from "react";
import { Row, Col, Card, Space, Button, Typography, message } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  SaveFilled,
  TableOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import Itemservice from "../../service/Items.Service";
import { ReactSortable } from "react-sortablejs";
import "./MyPage.css";

const itemservice = Itemservice();
const { Title, Text } = Typography;

export default function ItemsOrder({ source }) {
  const navigate = useNavigate();

  const [dataSource, setDataSource] = useState([]);
  const [viewMode, setViewMode] = useState("grid2"); // 'grid' or 'list'

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
        seq: Number(index + 1),
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
    console.log(
      "new order:",
      list.map((it, i) => ({ pos: i + 1, key: it.key, stcode: it.stcode }))
    );
    setDataSource(list);
  };

  const TopBar = (
    <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
      <Col>
        <Space>{/* เอา Select เรียงออกแล้ว */}</Space>
      </Col>
      <Col>
        <Space>
          {/* grid2: layout แบบแถวเดียว */}
          <Button
            icon={<AppstoreOutlined />}
            type={viewMode === "grid2" ? "primary" : "default"}
            onClick={() => setViewMode("grid2")}
          />
          {/* grid: card ปกติ */}
          <Button
            icon={<TableOutlined />}
            type={viewMode === "grid" ? "primary" : "default"}
            onClick={() => setViewMode("grid")}
          />
          {/* list */}
          <Button
            icon={<UnorderedListOutlined />}
            type={viewMode === "list" ? "primary" : "default"}
            onClick={() => setViewMode("list")}
          />
          <Button
            icon={<SaveFilled />}
            type="primary"
            onClick={handleSaveOrder}
          >
            บันทึก
          </Button>
        </Space>
      </Col>
    </Row>
  );

  const GridView = (
    <div className="myorder-grid-container">
      <ReactSortable
        list={dataSource}
        setList={onSortChange}
        animation={180}
        easing="cubic-bezier(.25,.8,.25,1)"
        className="myorder-grid"
        chosenClass="drag-chosen"
        ghostClass="drag-ghost"
      >
        {dataSource.map((item) => (
          <div key={item.key} className="grid-item">
            <Card
              hoverable
              bordered={false}
              className="item-card"
              bodyStyle={{ padding: 12 }}
            >
              <div className="thumb-wrap">
                {item.image ? (
                  <img src={item.image} alt={item.stname || item.name} />
                ) : (
                  <div className="thumb-empty" />
                )}
              </div>
              <div className="info-wrap">
                <div className="title-line">
                  <Title
                    level={5}
                    className="title"
                    title={item.stname || item.name}
                  >
                    {item.stname || item.name}
                  </Title>
                </div>
                {!!item.description && (
                  <div className="desc" title={item.description}>
                    {item.description}
                  </div>
                )}
                <div className="meta-line">
                  <span className="price-badge">
                    {Number(item.price || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  {/* ใส่ tag เพิ่มถ้ามี category เช่น */}
                  {!!item.category && (
                    <span className="tag">{item.category}</span>
                  )}
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
                  <Title level={5} style={{ margin: 0 }}>
                    {item.stname || item.name}
                  </Title>
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

  const GridView2 = (
    <div className="myorder-grid-container">
      <ReactSortable
        list={dataSource}
        setList={onSortChange}
        animation={180}
        easing="cubic-bezier(.25,.8,.25,1)"
        className="myorder-grid myorder-grid--2col"
        chosenClass="drag-chosen"
        ghostClass="drag-ghost"
      >
        {dataSource.map((item) => (
          <div key={item.key} className="grid-item">
            <Card
              hoverable
              bordered={false}
              className="item-card"
              bodyStyle={{ padding: 12 }}
              style={{ width: "100%" }}
            >
              <div className="info-wrap">
                <div
                  className="title-line"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Title
                    level={5}
                    className="title"
                    title={item.stname || item.name}
                    style={{
                      margin: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      flex: 1, // ให้ชื่อกินพื้นที่ซ้าย
                    }}
                  >
                    {item.stcode} / {item.stname || item.name}
                  </Title>
                  <span
                    style={{
                      minWidth: 80,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    {Number(item.price || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Button onClick={() => navigate("/" + source)}>ย้อนกลับ</Button>
      </div>
      {TopBar}
      <div>
        {viewMode === "grid"
          ? GridView
          : viewMode === "grid2"
          ? GridView2
          : ListView}
      </div>
    </div>
  );
}
