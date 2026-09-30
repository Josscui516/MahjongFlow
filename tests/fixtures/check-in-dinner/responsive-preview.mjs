// Chrome 扩展的视口覆盖不可用时，用真实 iframe 视口验证响应式页面。
import { createServer } from "node:http";

const event = "77000000-0000-4000-8000-000000000001";
const routes = {
  dinner: `/dinner-verification/${event}`,
  attendance: `/attendance/${event}`,
  event: `/events/${event}`,
};
createServer((request, response) => {
  const route = routes[new URL(request.url, "http://localhost:3108").searchParams.get("page")] ?? routes.dinner;
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(`<!doctype html><html lang="en"><title>Sprint 7 fictional responsive verification</title><style>body{margin:20px;background:#eee;font:16px system-ui}iframe{width:390px;height:844px;border:1px solid #777;background:white}</style><h1>Chrome: 390 × 844 app viewport</h1><p>Isolated fictional local environment</p><iframe title="Mobile application" src="http://localhost:3107${route}"></iframe></html>`);
}).listen(3108, "localhost", () => console.log("Responsive verification: http://localhost:3108 (fictional local app only)"));
