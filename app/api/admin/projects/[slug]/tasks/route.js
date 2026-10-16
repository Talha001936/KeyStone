import { makeTasksHandlers } from "@/lib/handlers";
const { GET, POST } = makeTasksHandlers(["admin"], { canCreate: true });
export { GET, POST };