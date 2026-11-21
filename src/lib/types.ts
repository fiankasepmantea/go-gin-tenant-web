// Shapes of the Go API (see docs/http-api.md, docs/authentication.md and docs/users-api.md).

export interface Envelope<T> {
  success: boolean;
  code: number;
  data: T;
  message?: string;
}

export interface Page<T> {
  total_data: number;
  total_pages: number;
  curr_page: number;
  next_page?: number;
  prev_page?: number;
  data_per_page: number;
  data: T[];
}

export interface FieldDetail {
  field: string;
  rule: string;
}

export interface ErrorEnvelope {
  success: false;
  code: number;
  error: { code: string; message: string; details?: FieldDetail[] };
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export interface Me {
  user_id: string;
  level: string;
  tenant_id?: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  name: string;
  group_id: string | null;
  is_active: boolean;
  level: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  group_id: string;
  name: string;
  description: string;
}

export interface ImportResult {
  rows: number;
  created: number;
  dry_run: boolean;
}
