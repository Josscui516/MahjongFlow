// 仅本地验收容器，不增加应用路由或修改权限。对传入虚构资源 UUID 作格式约束。
import { createServer } from "node:http";

const [event, task, meeting] = process.argv.slice(2);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (![event, task, meeting].every(value => uuid.test(value ?? ""))) throw new Error("Supply fictional event, task and meeting UUIDs.");
const routes = {
  dinner: `/dinner-verification/${event}`,
  attendance: `/attendance/${event}`,
  registration: `/registrations/${event}`,
  event: `/events/${event}`,
  task: `/tasks/${task}`,
  meeting: `/meetings/${meeting}`,
  dashboard: "/dashboard",
};
createServer((request, response) => {
  const route = routes[new URL(request.url, "http://localhost:3128").searchParams.get("page")] ?? routes.dinner;
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  response.end(`<!doctype html><html lang="en"><title>Week 8 fictional responsive verification</title><style>body{margin:20px;background:#eee;font:16px system-ui}iframe{width:390px;height:844px;border:1px solid #777;background:white}</style><h1>Chrome: 390 × 844 app viewport</h1><p>Isolated fictional local environment</p><iframe title="Mobile application" src="http://localhost:3107${route}"></iframe></html>`);
}).listen(3128, "localhost", () => console.log("Fictional responsive verification on localhost:3128"));
