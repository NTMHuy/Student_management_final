import { NextRequest, NextResponse } from "next/server";

// Chuyển tiếp mọi request /api/* sang Spring Boot. BACKEND_URL được đọc lúc chạy (runtime),
// nên đổi biến trên Railway chỉ cần redeploy, không phải build lại.
//   Local:   http://localhost:8080
//   Railway: http://<RAILWAY_PRIVATE_DOMAIN của service api>:<PORT>
export function proxy(request: NextRequest) {
  const backend = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/+$/, "");
  const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, backend);
  return NextResponse.rewrite(target);
}

export const config = {
  matcher: ["/api/:path*"],
};
