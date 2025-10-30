import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ONama from "./pages/ONama";
import "./index.css";
import Kontakt from "./pages/Kontakt";


const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/o-nama", element: <ONama /> },
  { path: "/kontakt", element: <Kontakt /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
