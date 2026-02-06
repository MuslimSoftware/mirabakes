import { NextResponse } from "next/server";

import { healthService } from "@/server/modules/health/health.service";

export class HealthController {
  check() {
    const data = healthService.check();
    return NextResponse.json({ data });
  }
}

export const healthController = new HealthController();
