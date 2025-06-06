/**
 * Test utilities for creating mock NextAuth sessions
 */

import { Session } from 'next-auth';

export interface MockSessionOptions {
  userId: string;
  tenantId: string;
  email?: string;
  name?: string;
}

export function createMockSession(options: MockSessionOptions): Session {
  return {
    user: {
      id: options.userId,
      email: options.email || 'pm1@test.com',
      name: options.name || 'Sarah Chen',
      image: null,
      role: 'user',
      tenantId: options.tenantId,
      allowedTenants: [options.tenantId],
      currentTenant: options.tenantId,
      tenantData: []
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}

export function createMockSessionWithoutTenant(userId: string): Session {
  return {
    user: {
      id: userId,
      email: 'pm1@test.com',
      name: 'Sarah Chen',
      image: null,
      role: 'user',
      tenantId: '',
      allowedTenants: [],
      currentTenant: '',
      tenantData: []
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}