import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function init() {
  const container = document.getElementById("root");

  if (!container) {
    console.error("Root element missing - check index.html");
    return;
  }

  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();