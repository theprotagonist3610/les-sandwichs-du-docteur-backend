import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LoaderProvider } from "./context/LoaderContext.jsx";
import App from "./App.jsx";
import "./index.css";
createRoot(document.getElementById("root")).render(
  <LoaderProvider>
    <BrowserRouter>
      <StrictMode>
        <App />
      </StrictMode>
    </BrowserRouter>
  </LoaderProvider>
);
