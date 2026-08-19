import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { OrgProvider } from "./context/OrgContext";
import { EmployeeProvider } from "./context/EmployeeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <OrgProvider>
      <EmployeeProvider>
        <App />
      </EmployeeProvider>
    </OrgProvider>
  </React.StrictMode>
);
