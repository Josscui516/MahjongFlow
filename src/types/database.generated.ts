export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_management_audit: {
        Row: {
          action: Database["public"]["Enums"]["account_management_action"]
          actor_profile_id: string
          created_at: string
          id: string
          new_can_manage_accounts: boolean | null
          new_is_active: boolean | null
          new_role: Database["public"]["Enums"]["committee_role"] | null
          previous_can_manage_accounts: boolean | null
          previous_is_active: boolean | null
          previous_role: Database["public"]["Enums"]["committee_role"] | null
          target_profile_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["account_management_action"]
          actor_profile_id: string
          created_at?: string
          id?: string
          new_can_manage_accounts?: boolean | null
          new_is_active?: boolean | null
          new_role?: Database["public"]["Enums"]["committee_role"] | null
          previous_can_manage_accounts?: boolean | null
          previous_is_active?: boolean | null
          previous_role?: Database["public"]["Enums"]["committee_role"] | null
          target_profile_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["account_management_action"]
          actor_profile_id?: string
          created_at?: string
          id?: string
          new_can_manage_accounts?: boolean | null
          new_is_active?: boolean | null
          new_role?: Database["public"]["Enums"]["committee_role"] | null
          previous_can_manage_accounts?: boolean | null
          previous_is_active?: boolean | null
          previous_role?: Database["public"]["Enums"]["committee_role"] | null
          target_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_management_audit_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_management_audit_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendance_status"]
          check_in_method: Database["public"]["Enums"]["check_in_method"]
          checked_in_at: string
          created_at: string
          event_id: string
          id: string
          participant_id: string
          recorded_by: string | null
          updated_at: string
        }
        Insert: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          check_in_method: Database["public"]["Enums"]["check_in_method"]
          checked_in_at?: string
          created_at?: string
          event_id: string
          id?: string
          participant_id: string
          recorded_by?: string | null
          updated_at?: string
        }
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          check_in_method?: Database["public"]["Enums"]["check_in_method"]
          checked_in_at?: string
          created_at?: string
          event_id?: string
          id?: string
          participant_id?: string
          recorded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dinner_eligibility_roster: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          recorded_by: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          recorded_by?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dinner_eligibility_roster_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dinner_roster: {
        Row: {
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          is_active: boolean
          recorded_by: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          is_active?: boolean
          recorded_by?: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          is_active?: boolean
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dinner_roster_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dinner_roster_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_points: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          position: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          position: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_points_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_check_in_tokens: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          revoked_at: string | null
          token_digest: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          revoked_at?: string | null
          token_digest: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          revoked_at?: string | null
          token_digest?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_check_in_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_check_in_tokens_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_dinner_issuance: {
        Row: {
          event_id: string
          issued_at: string | null
          issued_by: string | null
          participant_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          event_id: string
          issued_at?: string | null
          issued_by?: string | null
          participant_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          event_id?: string
          issued_at?: string | null
          issued_by?: string | null
          participant_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_dinner_issuance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dinner_issuance_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dinner_issuance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_dinner_issuance_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          check_in_closes_at: string | null
          check_in_opens_at: string | null
          created_at: string
          created_by: string
          description: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          location: string
          name: string
          requires_student_id: boolean
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          check_in_closes_at?: string | null
          check_in_opens_at?: string | null
          created_at?: string
          created_by: string
          description: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          location: string
          name: string
          requires_student_id?: boolean
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          check_in_closes_at?: string | null
          check_in_opens_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          location?: string
          name?: string
          requires_student_id?: boolean
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendees: {
        Row: {
          created_at: string
          meeting_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          meeting_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          meeting_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendees_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_decisions: {
        Row: {
          content: string
          created_at: string
          id: string
          meeting_id: string
          position: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          meeting_id: string
          position: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          meeting_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_decisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          starts_at: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          starts_at: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          starts_at?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          can_manage_accounts: boolean
          committee_position: string | null
          committee_role: Database["public"]["Enums"]["committee_role"]
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          can_manage_accounts?: boolean
          committee_position?: string | null
          committee_role: Database["public"]["Enums"]["committee_role"]
          created_at?: string
          display_name: string
          id: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          can_manage_accounts?: boolean
          committee_position?: string | null
          committee_role?: Database["public"]["Enums"]["committee_role"]
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          participant_id: string
          privacy_notice_acknowledged_at: string | null
          recorded_by: string | null
          registered_at: string
          registration_status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          participant_id: string
          privacy_notice_acknowledged_at?: string | null
          recorded_by?: string | null
          registered_at?: string
          registration_status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          participant_id?: string
          privacy_notice_acknowledged_at?: string | null
          recorded_by?: string | null
          registered_at?: string
          registration_status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_meetings: {
        Row: {
          created_at: string
          meeting_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          meeting_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          meeting_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_meetings_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_meetings_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string
          created_at: string
          created_by: string
          description: string
          due_date: string
          event_id: string | null
          id: string
          source_decision_id: string | null
          source_discussion_point_id: string | null
          source_meeting_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          created_by: string
          description: string
          due_date: string
          event_id?: string | null
          id?: string
          source_decision_id?: string | null
          source_discussion_point_id?: string | null
          source_meeting_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string
          event_id?: string | null
          id?: string
          source_decision_id?: string | null
          source_discussion_point_id?: string | null
          source_meeting_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_decision_id_fkey"
            columns: ["source_decision_id"]
            isOneToOne: false
            referencedRelation: "meeting_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_discussion_point_id_fkey"
            columns: ["source_discussion_point_id"]
            isOneToOne: false
            referencedRelation: "discussion_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_source_meeting_id_fkey"
            columns: ["source_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      configure_event_check_in_window: {
        Args: {
          actor_id: string
          closes_at: string
          opens_at: string
          target_event_id: string
        }
        Returns: {
          check_in_closes_at: string
          check_in_opens_at: string
        }[]
      }
      consume_check_in_rate_limit: {
        Args: {
          maximum_attempts?: number
          source_fingerprint: string
          window_seconds?: number
        }
        Returns: boolean
      }
      create_managed_profile: {
        Args: {
          target_can_manage_accounts?: boolean
          target_committee_position?: string
          target_display_name: string
          target_profile_id: string
          target_role: Database["public"]["Enums"]["committee_role"]
        }
        Returns: undefined
      }
      create_meeting_record: {
        Args: {
          attendee_ids: string[]
          meeting_starts_at: string
          meeting_summary: string
          meeting_title: string
        }
        Returns: string
      }
      delete_meeting_record: {
        Args: { target_meeting_id: string }
        Returns: string
      }
      delete_task_record: { Args: { target_task_id: string }; Returns: string }
      get_check_in_context: {
        Args: { check_in_token: string }
        Returns: {
          event_id: string
          event_name: string
          location: string
          result: string
          starts_at: string
          student_id_required: boolean
          window_status: string
        }[]
      }
      get_event_check_in_token_status: {
        Args: { actor_id: string; target_event_id: string }
        Returns: {
          active: boolean
          check_in_closes_at: string
          check_in_opens_at: string
          created_at: string
          revoked_at: string
        }[]
      }
      get_event_participation_totals: {
        Args: { event_ids: string[] }
        Returns: {
          attendance_count: number
          event_id: string
          registration_count: number
        }[]
      }
      list_event_dinner_service: {
        Args: { target_event_id: string }
        Returns: {
          eligible: boolean
          email: string
          event_id: string
          full_name: string
          issued_at: string
          participant_id: string
        }[]
      }
      list_matched_dinner_attendees: {
        Args: { target_event_id: string }
        Returns: {
          email: string
          event_id: string
          full_name: string
          participant_id: string
        }[]
      }
      record_account_recovery_sent: {
        Args: { target_profile_id: string }
        Returns: undefined
      }
      revoke_event_check_in_token: {
        Args: { actor_id: string; target_event_id: string }
        Returns: string
      }
      rotate_event_check_in_token: {
        Args: { actor_id: string; target_event_id: string }
        Returns: {
          created_at: string
          token: string
        }[]
      }
      save_meeting_agenda: {
        Args: {
          decision_items: Json
          discussion_items: Json
          target_meeting_id: string
        }
        Returns: undefined
      }
      save_task_with_meetings: {
        Args: {
          related_meeting_ids: string[]
          target_task_id?: string
          task_values: Json
        }
        Returns: string
      }
      set_event_dinner_issued: {
        Args: {
          desired_issued: boolean
          expected_issued: boolean
          target_event_id: string
          target_participant_id: string
        }
        Returns: string
      }
      set_managed_profile_active: {
        Args: { target_is_active: boolean; target_profile_id: string }
        Returns: undefined
      }
      submit_event_check_in: {
        Args: {
          check_in_token: string
          participant_email: string
          participant_student_id?: string
        }
        Returns: string
      }
      submit_event_registration: {
        Args: {
          participant_email: string
          participant_name: string
          participant_student_id?: string
          privacy_accepted: boolean
          registration_token: string
        }
        Returns: string
      }
      submit_event_self_check_in: {
        Args: {
          participant_email: string
          participant_name: string
          participant_student_id?: string
          privacy_accepted: boolean
          registration_token: string
        }
        Returns: string
      }
      update_managed_profile: {
        Args: {
          target_can_manage_accounts?: boolean
          target_committee_position?: string
          target_display_name: string
          target_profile_id: string
          target_role: Database["public"]["Enums"]["committee_role"]
        }
        Returns: undefined
      }
      update_meeting_record: {
        Args: {
          attendee_ids: string[]
          meeting_id: string
          meeting_starts_at: string
          meeting_summary: string
          meeting_title: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_management_action:
        | "invited"
        | "profile_updated"
        | "disabled"
        | "reactivated"
        | "recovery_sent"
      attendance_status: "confirmed" | "voided"
      check_in_method: "qr" | "manual"
      committee_role: "committee" | "authorised"
      event_status: "scheduled" | "completed" | "cancelled"
      event_type: "weekly_session" | "tournament"
      registration_status: "registered" | "cancelled"
      task_status: "not_started" | "in_progress" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_management_action: [
        "invited",
        "profile_updated",
        "disabled",
        "reactivated",
        "recovery_sent",
      ],
      attendance_status: ["confirmed", "voided"],
      check_in_method: ["qr", "manual"],
      committee_role: ["committee", "authorised"],
      event_status: ["scheduled", "completed", "cancelled"],
      event_type: ["weekly_session", "tournament"],
      registration_status: ["registered", "cancelled"],
      task_status: ["not_started", "in_progress", "completed"],
    },
  },
} as const

