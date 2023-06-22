import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { CanvasProvider } from "./CanvasContext";
import 'semantic-ui-css/semantic.min.css';

ReactDOM.render(
  <React.StrictMode>
    <CanvasProvider>
      <App />
    </CanvasProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
