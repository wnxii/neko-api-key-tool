import React from "react";
import ReactDOM from "react-dom/client";
import { Layout, LocaleProvider } from "@douyinfe/semi-ui";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import App from "./App";
import HeaderBar from "./components/HeaderBar";
import reportWebVitals from "./reportWebVitals";
import "semantic-ui-css/semantic.min.css";
import "./index.css";
import { ThemeProvider } from "./context/Theme";

const root = ReactDOM.createRoot(document.getElementById("root"));
const { Sider, Content, Header } = Layout;
root.render(
  <LocaleProvider locale={en_US}>
    <ThemeProvider>
      <Layout style={{ minHeight: "100vh" }}>
        <Header style={{ position: "sticky", top: 0, zIndex: 1 }}>
          <HeaderBar />
        </Header>
        <Layout>
          <Content
            style={{
              padding: "24px",
              "@media screen and (max-width: 768px)": {
                padding: "12px",
              },
            }}
          >
            <App />
          </Content>
        </Layout>
      </Layout>
    </ThemeProvider>
  </LocaleProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
