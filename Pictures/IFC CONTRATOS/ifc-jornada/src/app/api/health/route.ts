import { APP_NAME } from "@/lib/constants";

export async function GET() {
  return Response.json({
    app: APP_NAME,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}