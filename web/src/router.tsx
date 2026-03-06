import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { CreateInvoicePage } from "./pages/CreateInvoicePage";
import { InvoicePage } from "./pages/InvoicePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <CreateInvoicePage />
      },
      {
        path: "i/:id",
        element: <InvoicePage />
      }
    ]
  }
]);
