import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized: ({ token, req }) => {
      // Allow access to login page
      if (req.nextUrl.pathname === '/admin/login') {
        return true;
      }
      // Require authentication for all other dashboard routes
      return !!token;
    },
  },
});

export const config = {
  matcher: ['/admin/:path*'],
};
