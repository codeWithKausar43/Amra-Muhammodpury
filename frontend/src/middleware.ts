import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  // In cross-domain deployment (Vercel frontend + Render backend),
  // authentication session cookies belong to the backend origin (Render) and
  // cannot be read by Next.js Edge middleware on Vercel.
  // Route protection is handled client-side in (dashboard)/layout.tsx and (auth)/layout.tsx
  // using Better Auth's useSession() hook.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/auth (Better Auth routes — must be accessible without middleware)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
};

