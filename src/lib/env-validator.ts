import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).optional().default('development'),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid Production Environment Variables:', result.error.format());
    return { valid: false, errors: result.error.flatten() };
  }
  return { valid: true, data: result.data };
}
