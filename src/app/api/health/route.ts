import { healthController } from "@/server/modules/health/health.controller";

export function GET() {
  return healthController.check();
}
