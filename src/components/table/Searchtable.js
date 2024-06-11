import { Space } from "antd"; 
import { Input, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons"; 
/** config column search column  */ 
export const columnSearchProp = (dataIndex, refInput, { handleSearch, handleReset, handleFilter, hendleRender }) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close, }) => (
      <div style={{ padding: 8, }} onKeyDown={(e) => e.stopPropagation()} >
        <Input
          ref={refInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : []) }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block", }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90, height: 40 }}
          > Search </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90, height: 40 }}
          > Reset </Button>
          <Button
            type="link"
            size="small"
            onClick={() => { handleFilter(selectedKeys, confirm, dataIndex) }}
          > Filter </Button>
          <Button type="link" size="small"  onClick={() => { close(); }} >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => ( <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined, }} /> ),
    onFilter: (value, record) => record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => refInput.current?.select(), 100);
      }
    },
    render: (text)  =>  hendleRender(text, dataIndex) 
}); 