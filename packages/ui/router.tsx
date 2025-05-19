import { createMemoryRouter, Outlet } from "react-router-dom";
import { Create } from "./pages/create";
import { Result } from "./pages/result";

export const router = createMemoryRouter([
  {
    path: "/",
    element: (
      <div className="p-4">
        <Outlet />
      </div>
    ),
    children: [
      {
        index: true,
        element: <Create />,
      },
      {
        path: "result",
        element: <Result />,
      },
    ],
  },
]);
