import { NextResponse } from "next/server";

import { AppError } from "@/server/shared/errors/app-error";

export function handleRouteError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Unexpected server error"
      }
    },
    { status: 500 }
  );
}
