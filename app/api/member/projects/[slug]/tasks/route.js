import { makeTasksHandlers } from "@/lib/handlers";
const { GET } = makeTasksHandlers(["member"], { canCreate: false });
export { GET };