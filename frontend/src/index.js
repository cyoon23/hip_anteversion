import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { CanvasProvider } from "./CanvasContext";
import BrowserRouter from 'react-router-dom/BrowserRouter';

ReactDOM.render(
  <BrowserRouter basename={process.env.PUBLIC_URL}>
  <React.StrictMode>
    <CanvasProvider>
      <App />
    </CanvasProvider>
  </React.StrictMode>
  </BrowserRouter>,
  document.getElementById("root")
);
