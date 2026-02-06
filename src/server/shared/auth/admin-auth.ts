import { AppError } from "@/server/shared/errors/app-error";

function extractToken(request: Request): string | null {
  const tokenFromHeader = request.headers.get("x-admin-token");
  if (tokenFromHeader) {
    return tokenFromHeader;
  }

  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, value] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) {
    return null;
  }

  return value;
}

export function assertAdminRequest(request: Request) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  if (!configuredToken) {
    throw new AppError("Admin API is not configured", 500, "admin_not_configured");
  }

  const token = extractToken(request);
  if (!token || token !== configuredToken) {
    throw new AppError("Unauthorized", 401, "unauthorized");
  }
}
