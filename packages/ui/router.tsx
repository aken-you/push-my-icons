import { createMemoryRouter } from "react-router-dom";
import { Create } from "./pages/create";
import { Result } from "./pages/result";

export const router = createMemoryRouter([
  {
    path: "/",
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
