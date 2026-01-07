import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./main.scss";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

const isDev = import.meta.env.DEV;

// Only use StrictMode in development to avoid double renders in production
ReactDOM.createRoot(rootElement).render(
  isDev ? (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  ) : (
    <App />
  ),
);
