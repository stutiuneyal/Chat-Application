import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "antd/dist/reset.css";
import "./index.css";
import "./styles/glass.css";
import "./styles/room.css";
import "./styles/top-nav.css"
import "./styles/tour.css"
import "./styles/antd-overrides.css";
import "./styles/chat.css";
import { ConfigProvider, theme } from "antd";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#6FA2FF",
          colorInfo: "#6FA2FF",
          colorText: "#172033",
          colorTextSecondary: "rgba(23, 32, 51, 0.66)",
          colorBorder: "rgba(145, 160, 220, 0.24)",
          colorBgContainer: "rgba(255,255,255,0.78)",
          colorTextPlaceholder: "rgba(23, 32, 51, 0.42)",
          controlHeight: 40,
          borderRadius: 16,
          controlOutline: "transparent",
          controlItemBgHover: "rgba(111, 162, 255, 0.08)",
          colorLink: "#4E7DFF"
        },
        components: {
          Layout: {
            headerBg: "transparent",
            bodyBg: "transparent"
          },
          Card: {
            colorBgContainer: "rgba(255,255,255,0.72)",
            borderRadiusLG: 20
          },
          Input: {
            colorBgContainer: "rgba(255,255,255,0.88)",
            colorText: "#172033",
            colorTextPlaceholder: "rgba(23,32,51,0.42)",
            activeBorderColor: "rgba(111,162,255,0.45)",
            hoverBorderColor: "rgba(111,162,255,0.32)"
          },
          Button: {
            borderRadiusSM: 999,
            borderRadius: 999,
            defaultColor: "#172033",
            defaultBorderColor: "rgba(145,160,220,0.28)",
            defaultBg: "rgba(255,255,255,0.82)"
          },
          Switch: {
            trackHeight: 22,
            trackMinWidth: 40
          },
          Typography: {
            colorText: "#172033",
            colorTextSecondary: "rgba(23,32,51,0.66)"
          },
          Empty: {
            colorTextDescription: "rgba(23,32,51,0.56)"
          }
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);