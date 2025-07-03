import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Typography,
  Table,
  Tag,
  Spin,
  Card,
  Collapse,
  Toast,
  Space,
  Tabs,
} from "@douyinfe/semi-ui";
import { IconSearch, IconCopy, IconDownload } from "@douyinfe/semi-icons";
import { API, timestamp2string, copy } from "../helpers";
import { stringToColor } from "../helpers/render";
import { ITEMS_PER_PAGE } from "../constants";
import { renderModelPrice, renderQuota } from "../helpers/render";
import Paragraph from "@douyinfe/semi-ui/lib/es/typography/paragraph";
import { Tooltip, Modal } from "@douyinfe/semi-ui";
import Papa from "papaparse";

const { Text } = Typography;
const { Panel } = Collapse;
const { TabPane } = Tabs;

function renderTimestamp(timestamp) {
  return timestamp2string(timestamp);
}

function renderIsStream(bool) {
  if (bool) {
    return (
      <Tag color="blue" size="large">
        Stream
      </Tag>
    );
  } else {
    return (
      <Tag color="purple" size="large">
        Not Stream
      </Tag>
    );
  }
}

function renderUseTime(type) {
  const time = parseInt(type);
  if (time < 101) {
    return (
      <Tag color="green" size="large">
        {" "}
        {time} s{" "}
      </Tag>
    );
  } else if (time < 300) {
    return (
      <Tag color="orange" size="large">
        {" "}
        {time} s{" "}
      </Tag>
    );
  } else {
    return (
      <Tag color="red" size="large">
        {" "}
        {time} s{" "}
      </Tag>
    );
  }
}

const LogsTable = () => {
  const [apikey, setAPIKey] = useState("");
  const [activeTabKey, setActiveTabKey] = useState("");
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeKeys, setActiveKeys] = useState([]);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [baseUrl, setBaseUrl] = useState("");
  const baseUrls = JSON.parse(process.env.REACT_APP_BASE_URL); // Parse environment variables

  useEffect(() => {
    // Set the first address as the baseUrl by default
    const firstKey = Object.keys(baseUrls)[0];
    setActiveTabKey(firstKey);
    setBaseUrl(baseUrls[firstKey]);
  }, []);

  const handleTabChange = (key) => {
    setActiveTabKey(key);
    setBaseUrl(baseUrls[key]);
  };

  const resetData = (key) => {
    setTabData((prevData) => ({
      ...prevData,
      [key]: {
        balance: 0,
        usage: 0,
        accessdate: "Unknown",
        logs: [],
        tokenValid: false,
      },
    }));
  };

  const fetchData = async () => {
    if (apikey === "") {
      Toast.warning("Please enter the token before querying");
      return;
    }
    // Check token format
    if (!/^sk-[a-zA-Z0-9]{48}$/.test(apikey)) {
      Toast.error("Invalid token format!");
      return;
    }
    setLoading(true);
    let newTabData = {
      ...tabData[activeTabKey],
      balance: 0,
      usage: 0,
      accessdate: 0,
      logs: [],
      tokenValid: false,
    };

    try {
      if (process.env.REACT_APP_SHOW_BALANCE === "true") {
        const subscription = await API.get(
          `${baseUrl}/v1/dashboard/billing/subscription`,
          {
            headers: { Authorization: `Bearer ${apikey}` },
          }
        );
        const subscriptionData = subscription.data;
        newTabData.balance = subscriptionData.hard_limit_usd;
        newTabData.tokenValid = true;

        let now = new Date();
        let start = new Date(now.getTime() - 100 * 24 * 3600 * 1000);
        let start_date = `${start.getFullYear()}-${
          start.getMonth() + 1
        }-${start.getDate()}`;
        let end_date = `${now.getFullYear()}-${
          now.getMonth() + 1
        }-${now.getDate()}`;
        const res = await API.get(
          `${baseUrl}/v1/dashboard/billing/usage?start_date=${start_date}&end_date=${end_date}`,
          {
            headers: { Authorization: `Bearer ${apikey}` },
          }
        );
        const data = res.data;
        newTabData.usage = data.total_usage / 100;
      }
    } catch (e) {
      console.log(e);
      Toast.error("Token has been exhausted");
      resetData(activeTabKey); // Reset all data to default values if an error occurs
      setLoading(false);
    }
    try {
      if (process.env.REACT_APP_SHOW_DETAIL === "true") {
        const logRes = await API.get(`${baseUrl}/api/log/token?key=${apikey}`);
        const { success, message, data: logData } = logRes.data;
        if (success) {
          newTabData.logs = logData.reverse();
          let quota = 0;
          for (let i = 0; i < logData.length; i++) {
            quota += logData[i].quota;
          }
          setActiveKeys(["1", "2"]); // Automatically expand the two collapse panels
        } else {
          Toast.error(
            "Failed to query call details, please enter the correct token"
          );
        }
      }
    } catch (e) {
      Toast.error("Query failed, please enter the correct token");
      resetData(activeTabKey); // Reset all data to default values if an error occurs
      setLoading(false);
    }
    setTabData((prevData) => ({
      ...prevData,
      [activeTabKey]: newTabData,
    }));
    setLoading(false);
  };

  const copyText = async (text) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        Toast.success("Copied:" + text);
        return;
      }

      // Fallback for Safari and older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        textArea.remove();
        Toast.success("Copied:" + text);
      } catch (err) {
        textArea.remove();
        Modal.error({
          title: "Could not copy to clipboard, please copy manually",
          content: text,
        });
      }
    } catch (err) {
      Modal.error({
        title: "Could not copy to clipboard, please copy manually",
        content: text,
      });
    }
  };

  const columns = [
    {
      title: "Time",
      dataIndex: "created_at",
      render: renderTimestamp,
      sorter: (a, b) => a.created_at - b.created_at,
    },
    {
      title: "Token Name",
      dataIndex: "token_name",
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? (
          <div>
            <Tag
              color="grey"
              size="large"
              onClick={() => {
                copyText(text);
              }}
            >
              {" "}
              {text}{" "}
            </Tag>
          </div>
        ) : (
          <></>
        );
      },
      sorter: (a, b) => ("" + a.token_name).localeCompare(b.token_name),
    },
    {
      title: "Model",
      dataIndex: "model_name",
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? (
          <div>
            <Tag
              color={stringToColor(text)}
              size="large"
              onClick={() => {
                copyText(text);
              }}
            >
              {" "}
              {text}{" "}
            </Tag>
          </div>
        ) : (
          <></>
        );
      },
      sorter: (a, b) => ("" + a.model_name).localeCompare(b.model_name),
    },
    {
      title: "Time Consumed",
      dataIndex: "use_time",
      render: (text, record, index) => {
        return record.model_name.startsWith("mj_") ? null : (
          <div>
            <Space>
              {renderUseTime(text)}
              {renderIsStream(record.is_stream)}
            </Space>
          </div>
        );
      },
      sorter: (a, b) => a.use_time - b.use_time,
    },
    {
      title: "Prompt",
      dataIndex: "prompt_tokens",
      render: (text, record, index) => {
        return record.model_name.startsWith("mj_") ? null : record.type === 0 ||
          record.type === 2 ? (
          <div>{<span> {text} </span>}</div>
        ) : (
          <></>
        );
      },
      sorter: (a, b) => a.prompt_tokens - b.prompt_tokens,
    },
    {
      title: "Completion",
      dataIndex: "completion_tokens",
      render: (text, record, index) => {
        return parseInt(text) > 0 &&
          (record.type === 0 || record.type === 2) ? (
          <div>{<span> {text} </span>}</div>
        ) : (
          <></>
        );
      },
      sorter: (a, b) => a.completion_tokens - b.completion_tokens,
    },
    {
      title: "Cost",
      dataIndex: "quota",
      render: (text, record, index) => {
        return record.type === 0 || record.type === 2 ? (
          <div>{renderQuota(text, 6)}</div>
        ) : (
          <></>
        );
      },
      sorter: (a, b) => a.quota - b.quota,
    },
    {
      title: "Details",
      dataIndex: "content",
      render: (text, record, index) => {
        let other = null;
        try {
          if (record.other === "") {
            record.other = "{}";
          }
          other = JSON.parse(record.other);
        } catch (e) {
          return (
            <Tooltip content="This version does not support displaying calculation details">
              <Paragraph
                ellipsis={{
                  rows: 2,
                }}
              >
                {text}
              </Paragraph>
            </Tooltip>
          );
        }
        if (other == null) {
          return (
            <Paragraph
              ellipsis={{
                rows: 2,
                showTooltip: {
                  type: "popover",
                },
              }}
            >
              {text}
            </Paragraph>
          );
        }
        let content = renderModelPrice(
          record.prompt_tokens,
          record.completion_tokens,
          other.model_ratio,
          other.model_price,
          other.completion_ratio,
          other.group_ratio
        );
        return (
          <Tooltip content={content}>
            <Paragraph
              ellipsis={{
                rows: 2,
              }}
            >
              {text}
            </Paragraph>
          </Tooltip>
        );
      },
    },
  ];

  const copyTokenInfo = (e) => {
    e.stopPropagation();
    const activeTabData = tabData[activeTabKey] || {};
    const { balance, usage, accessdate } = activeTabData;
    const info = `Total Amount: ${
      balance === 100000000 ? "Unlimited" : `${balance.toFixed(3)}`
    }
Remaining Quota: ${
      balance === 100000000 ? "Unlimited制" : `${(balance - usage).toFixed(3)}`
    }
Used Quota: ${balance === 100000000 ? "Not calculated" : `${usage.toFixed(3)}`}
Valid Until: ${
      accessdate === 0 ? "Never Expires" : renderTimestamp(accessdate)
    }`;
    copyText(info);
  };

  const exportCSV = (e) => {
    e.stopPropagation();
    const activeTabData = tabData[activeTabKey] || { logs: [] };
    const { logs } = activeTabData;
    const csvData = logs.map((log) => ({
      Time: renderTimestamp(log.created_at),
      Model: log.model_name,
      "Time Consumed": log.use_time,
      Prompt: log.prompt_tokens,
      Completion: log.completion_tokens,
      Cost: log.quota,
      Details: log.content,
    }));
    const csvString = "\ufeff" + Papa.unparse(csvData);

    try {
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "data.csv";

      // For Safari compatibility
      if (
        navigator.userAgent.indexOf("Safari") > -1 &&
        navigator.userAgent.indexOf("Chrome") === -1
      ) {
        link.target = "_blank";
        link.setAttribute("target", "_blank");
      }

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err) {
      Toast.error("Export failed, please try again later");
      console.error("Export failed:", err);
    }
  };

  const activeTabData = tabData[activeTabKey] || {
    logs: [],
    balance: 0,
    usage: 0,
    accessdate: "Unknown",
    tokenValid: false,
  };

  const renderContent = () => (
    <>
      <Card style={{ marginTop: 24 }}>
        <Input
          showClear
          value={apikey}
          onChange={(value) => setAPIKey(value)}
          placeholder="Enter the token to query sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          prefix={<IconSearch />}
          suffix={
            <Button
              type="primary"
              theme="solid"
              onClick={fetchData}
              loading={loading}
              disabled={apikey === ""}
            >
              Query
            </Button>
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              fetchData();
            }
          }}
        />
      </Card>
      <Card style={{ marginTop: 24 }}>
        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(keys)}
        >
          {process.env.REACT_APP_SHOW_BALANCE === "true" && (
            <Panel
              header="Token Information"
              itemKey="1"
              extra={
                <Button
                  icon={<IconCopy />}
                  theme="borderless"
                  type="primary"
                  onClick={(e) => copyTokenInfo(e)}
                  disabled={!activeTabData.tokenValid}
                >
                  Copy Token Information
                </Button>
              }
            >
              <Spin spinning={loading}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    Total Amount (USD)： $
                    {activeTabData.balance === 100000000
                      ? "Unlimited"
                      : activeTabData.balance === "Unknown" ||
                        activeTabData.balance === undefined
                      ? "Unknown"
                      : `${activeTabData.balance.toFixed(3)}`}
                  </Text>
                  <br />
                  <br />
                  <Text type="secondary">
                    Remaining Quota (USD)： $
                    {activeTabData.balance === 100000000
                      ? "Unlimited制"
                      : activeTabData.balance === "Unknown" ||
                        activeTabData.usage === "Unknown" ||
                        activeTabData.balance === undefined ||
                        activeTabData.usage === undefined
                      ? "Unknown"
                      : `${(
                          activeTabData.balance - activeTabData.usage
                        ).toFixed(3)}`}
                  </Text>
                  <br />
                  <br />
                  <Text type="secondary">
                    Used Quota (USD): $
                    {activeTabData.balance === 100000000
                      ? "Not calculated"
                      : activeTabData.usage === "Unknown" ||
                        activeTabData.usage === undefined
                      ? "Unknown"
                      : `${activeTabData.usage.toFixed(3)}`}
                  </Text>
                  <br />
                  <br />
                  <Text type="secondary">
                    Valid Until：
                    {activeTabData.accessdate === 0
                      ? "Never Expires"
                      : activeTabData.accessdate === "Unknown"
                      ? "Unknown"
                      : renderTimestamp(activeTabData.accessdate)}
                  </Text>
                </div>
              </Spin>
            </Panel>
          )}
          {process.env.REACT_APP_SHOW_DETAIL === "true" && (
            <Panel
              header="Call Details"
              itemKey="2"
              extra={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Button
                    icon={<IconDownload />}
                    theme="borderless"
                    type="primary"
                    onClick={(e) => exportCSV(e)}
                    disabled={
                      !activeTabData.tokenValid ||
                      activeTabData.logs.length === 0
                    }
                  >
                    Export as CSV file
                  </Button>
                </div>
              }
            >
              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={activeTabData.logs}
                  pagination={{
                    pageSize: pageSize,
                    hideOnSinglePage: true,
                    showSizeChanger: true,
                    pageSizeOpts: [10, 20, 50, 100],
                    onPageSizeChange: (pageSize) => setPageSize(pageSize),
                    showTotal: (total) => `Total ${total} items`,
                    showQuickJumper: true,
                    total: activeTabData.logs.length,
                    style: { marginTop: 12 },
                  }}
                />
              </Spin>
            </Panel>
          )}
        </Collapse>
      </Card>
    </>
  );

  return (
    <>
      {Object.keys(baseUrls).length > 1 ? (
        <Tabs type="line" onChange={handleTabChange}>
          {Object.entries(baseUrls).map(([key, url]) => (
            <TabPane tab={key} itemKey={key} key={key}>
              {renderContent()}
            </TabPane>
          ))}
        </Tabs>
      ) : (
        renderContent()
      )}
    </>
  );
};

export default LogsTable;
