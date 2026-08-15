import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "Quick Test Login",
      credentials: {
        email: { label: "Email", type: "email" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string) || "test@notu.ai";
        const name = (credentials?.name as string) || "Test User";
        const googleId = "dev_" + email.replace(/[^a-zA-Z0-9]/g, "_");

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId,
              email,
              name,
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
            }),
          });

          if (!response.ok) {
            console.error('Backend dev auth failed:', response.status);
            return null;
          }

          const data = await response.json();

          if (data.success && data.data?.token) {
            return {
              id: data.data.user.id || data.data.user._id,
              name: data.data.user.name,
              email: data.data.user.email,
              image: data.data.user.image,
              backendToken: data.data.token,
              backendUser: data.data.user,
            };
          }
          return null;
        } catch (error) {
          console.error("Dev login authorize error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") {
        return true;
      }
      if (account?.provider === "google") {
        try {
          // Send user data to backend to create/update user
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleId: profile?.sub,
              email: user.email,
              name: user.name,
              image: user.image,
            }),
          });

          if (!response.ok) {
            console.error('Backend auth failed:', response.status);
            return false;
          }

          const data = await response.json();
          
          // Store backend token in user object
          if (data.success && data.data?.token) {
            (user as any).backendToken = data.data.token;
            (user as any).backendUser = data.data.user;
            return true;
          } else {
            console.error('Backend did not return valid token');
            return false;
          }
        } catch (error) {
          console.error('Error syncing with backend:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        return {
          ...token,
          accessToken: account?.access_token,
          backendToken: (user as any).backendToken,
          backendUser: (user as any).backendUser,
          picture: user.image || token.picture,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken,
        backendToken: token.backendToken,
        user: {
          ...session.user,
          id: (token.backendUser as any)?.id || (token.backendUser as any)?._id,
          plan: (token.backendUser as any)?.plan || 'free',
          image: (token.picture as string) || session.user?.image,
        },
      };
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
})
