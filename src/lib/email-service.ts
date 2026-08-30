export interface EmailParams {
  to: string;
  subject: string;
  template: 'WITHDRAWAL_RECEIPT' | 'TASK_APPROVED' | 'SECURITY_ALERT' | 'WELCOME';
  data: Record<string, any>;
}

export async function sendTransactionalEmail(params: EmailParams): Promise<boolean> {
  console.log(`[Email Service] Sending ${params.template} to ${params.to}: "${params.subject}"`, params.data);
  // Production integration: SendGrid / Resend / AWS SES adapter
  return true;
}
