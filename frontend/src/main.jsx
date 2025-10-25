import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "antd/dist/reset.css";
import "./index.css";
import "./styles/glass.css";
import "./styles/antd-overrides.css"
import { ConfigProvider, theme } from "antd";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#8A7DF0",
          colorInfo: "#8A7DF0",
          colorText: "rgba(255,255,255,0.92)",
          colorTextSecondary: "rgba(255,255,255,0.75)",
          colorBorder: "rgba(255,255,255,0.18)",
          colorBgContainer: "transparent",
          controlHeight: 36,
          borderRadius: 14,
          controlOutline: "transparent",
          controlItemBgHover: "rgba(255,255,255,0.08)",
          colorLink: "#CFAAEF"
        },
        components: {
          Layout: { headerBg: "transparent", bodyBg: "transparent" },
          Card: { colorBgContainer: "transparent", borderRadiusLG: 14 },
          Input: { colorBgContainer: "transparent", activeBorderColor: "rgba(255,255,255,0.28)" },
          Button: { borderRadiusSM: 999, borderRadius: 999 },
          Switch: { trackHeight: 22, trackMinWidth: 40 }
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
