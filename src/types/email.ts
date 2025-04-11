export interface EmailRequest {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}