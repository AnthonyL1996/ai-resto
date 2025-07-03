import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/kitchen.tsx"),
  route("about", "routes/about.tsx"),
  route("users/:id", "routes/user.tsx"),
  route("kiosk", "routes/kiosk.tsx"),
] satisfies RouteConfig;