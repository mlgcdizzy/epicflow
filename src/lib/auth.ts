import type { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './db';

// Microsoft Entra ID (Azure AD) SSO.
//
// Requires three environment variables, from an App Registration in the
// Azure Portal (Entra ID > App registrations > New registration):
//   AZURE_AD_CLIENT_ID      — Application (client) ID
//   AZURE_AD_CLIENT_SECRET  — a client secret created under Certificates & secrets
//   AZURE_AD_TENANT_ID      — Directory (tenant) ID, or "common" for multi-tenant
//
// Redirect URI to register in Azure: {your domain}/api/auth/callback/azure-ad
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
  ],
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        (session.user as { id: string; role?: string }).id = user.id;
        (session.user as { id: string; role?: string }).role = (user as { role?: string }).role ?? 'PRODUCT_MANAGER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
