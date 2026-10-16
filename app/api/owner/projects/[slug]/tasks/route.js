import { makeTasksHandlers } from "@/lib/handlers";
const { GET, POST } = makeTasksHandlers(["owner"], { canCreate: true });
export { GET, POST };