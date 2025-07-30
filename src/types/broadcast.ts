export interface BroadcastMessage {
  id: number;
  title: string;
  message: string;
  message_type: 'info' | 'warning' | 'success' | 'error' | 'maintenance' | 'promotion' | 'update';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'all' | 'role' | 'specific' | 'criteria';
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  is_active: boolean;
  requires_acknowledgment: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  sent_count: number;
  acknowledged_count: number;
  created_by_email?: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
}

export interface BroadcastMessageCreate {
  title: string;
  message: string;
  message_type?: 'info' | 'warning' | 'success' | 'error' | 'maintenance' | 'promotion' | 'update';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'all' | 'role' | 'specific' | 'criteria';
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgment?: boolean;
}

export interface BroadcastMessageUpdate {
  title?: string;
  message?: string;
  message_type?: 'info' | 'warning' | 'success' | 'error' | 'maintenance' | 'promotion' | 'update';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  target_audience?: 'all' | 'role' | 'specific' | 'criteria';
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgment?: boolean;
}

export interface MessageRecipient {
  id: number;
  broadcast_message_id: number;
  user_id: number;
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
  acknowledged_at?: string;
  status: 'sent' | 'delivered' | 'read' | 'acknowledged' | 'failed';
}

export interface UserMessage extends BroadcastMessage, MessageRecipient {
  recipient_sent_at: string;
  recipient_status: 'sent' | 'delivered' | 'read' | 'acknowledged' | 'failed';
}

export interface BroadcastStats {
  total_messages: number;
  active_messages: number;
  scheduled_messages: number;
  sent_messages: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  total_recipients: number;
  acknowledged_messages: number;
}

export interface UserMessageStats {
  total_received: number;
  unread: number;
  read: number;
  acknowledged: number;
  pending_acknowledgment: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface UserMessageCounts {
  unread_count: number;
  pending_acknowledgment: number;
  total_active: number;
}

export interface CategorizedMessages {
  unread: UserMessage[];
  read: UserMessage[];
  acknowledged: UserMessage[];
  all: UserMessage[];
}

export interface UserMessagesResponse {
  messages: UserMessage[];
  counts: UserMessageCounts;
  categorized: CategorizedMessages;
}

export interface TargetPreview {
  target_audience: string;
  estimated_recipients: number;
  preview_users: Array<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role?: string;
  }>;
  total_preview_shown: number;
}

// Message type options for dropdowns
export const MESSAGE_TYPES = {
  info: { label: 'Information', color: 'blue', icon: 'info' },
  warning: { label: 'Warning', color: 'yellow', icon: 'warning' },
  success: { label: 'Success', color: 'green', icon: 'check' },
  error: { label: 'Error', color: 'red', icon: 'error' },
  maintenance: { label: 'Maintenance', color: 'orange', icon: 'tool' },
  promotion: { label: 'Promotion', color: 'purple', icon: 'gift' },
  update: { label: 'Update', color: 'teal', icon: 'update' }
} as const;

// Priority options for dropdowns
export const PRIORITY_LEVELS = {
  low: { label: 'Low', color: 'gray', order: 1 },
  medium: { label: 'Medium', color: 'blue', order: 2 },
  high: { label: 'High', color: 'orange', order: 3 },
  urgent: { label: 'Urgent', color: 'red', order: 4 }
} as const;

// Target audience options
export const TARGET_AUDIENCES = {
  all: { label: 'All Users', description: 'Send to all active users' },
  role: { label: 'By Role', description: 'Send to users with specific roles' },
  specific: { label: 'Specific Users', description: 'Send to manually selected users' },
  criteria: { label: 'By Criteria', description: 'Send to users matching specific criteria' }
} as const;

// User roles for targeting
export const USER_ROLES = {
  user: { label: 'Regular Users', description: 'Standard trading platform users' },
  admin: { label: 'Administrators', description: 'Platform administrators' },
  premium: { label: 'Premium Users', description: 'Users with premium features' },
  vip: { label: 'VIP Users', description: 'High-value users' }
} as const;

// Criteria operators for advanced targeting
export const CRITERIA_OPERATORS = {
  equals: { label: 'Equals', symbol: '=' },
  not_equals: { label: 'Not equals', symbol: '≠' },
  greater_than: { label: 'Greater than', symbol: '>' },
  less_than: { label: 'Less than', symbol: '<' },
  greater_or_equal: { label: 'Greater or equal', symbol: '≥' },
  less_or_equal: { label: 'Less or equal', symbol: '≤' },
  contains: { label: 'Contains', symbol: '∈' },
  not_contains: { label: 'Does not contain', symbol: '∉' }
} as const;

// Bulk action result
export interface BulkActionResult {
  id: number;
  success: boolean;
  error?: string;
}

// Form validation types
export interface BroadcastFormData {
  title: string;
  message: string;
  message_type: keyof typeof MESSAGE_TYPES;
  priority: keyof typeof PRIORITY_LEVELS;
  target_audience: keyof typeof TARGET_AUDIENCES;
  target_criteria?: Record<string, any>;
  target_user_ids?: number[];
  target_roles?: string[];
  scheduled_at?: string;
  expires_at?: string;
  requires_acknowledgment: boolean;
}

export interface BroadcastFormErrors {
  title?: string;
  message?: string;
  target_audience?: string;
  target_user_ids?: string;
  target_roles?: string;
  target_criteria?: string;
  scheduled_at?: string;
  expires_at?: string;
}