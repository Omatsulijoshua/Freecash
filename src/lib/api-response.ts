import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: Record<string, any>;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(message: string, statusCode = 400, errors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function successResponse<T>(data: T, message?: string, statusCode = 200, meta?: Record<string, any>) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success: true,
      message,
      data,
      meta,
    },
    { status: statusCode }
  );
}

export function errorResponse(message: string, statusCode = 400, errors?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: message,
      errors,
    },
    { status: statusCode }
  );
}
