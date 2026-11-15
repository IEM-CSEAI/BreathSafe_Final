import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { DataProvider } from "./context/DataContext";
import { ToastProvider } from "./context/ToastContext";
import { RotationProvider } from "./context/RotationContext";
import "./styles/theme.css";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <DataProvider>
        <ToastProvider>
          <BrowserRouter>
            <RotationProvider>
              <App />
            </RotationProvider>
          </BrowserRouter>
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  </React.StrictMode>
);