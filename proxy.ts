import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/dashboard"]

function getApplicationOrigin(request: NextRequest): string {
  const configuredAuthUrl = process.env.AUTH_URL

  if (!configuredAuthUrl) {
    return request.nextUrl.origin
  }

  try {
    return new URL(configuredAuthUrl).origin
  } catch {
    return request.nextUrl.origin
  }
}

export default async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", getApplicationOrigin(request)))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
