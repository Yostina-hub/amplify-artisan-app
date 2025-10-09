export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          block_reason: string | null
          company_id: string | null
          created_at: string | null
          id: string
          ip_address: string
          is_blocked: boolean | null
          request_path: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          block_reason?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          ip_address: string
          is_blocked?: boolean | null
          request_path?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          block_reason?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string
          is_blocked?: boolean | null
          request_path?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      accounts: {
        Row: {
          account_type: string | null
          annual_revenue: number | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          company_id: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          industry: string | null
          metadata: Json | null
          name: string
          number_of_employees: number | null
          owner_id: string | null
          parent_account_id: string | null
          phone: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_state: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_type?: string | null
          annual_revenue?: number | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          name: string
          number_of_employees?: number | null
          owner_id?: string | null
          parent_account_id?: string | null
          phone?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_type?: string | null
          annual_revenue?: number | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          name?: string
          number_of_employees?: number | null
          owner_id?: string | null
          parent_account_id?: string | null
          phone?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          activity_type: string
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          priority: string | null
          related_to_id: string | null
          related_to_type: string | null
          status: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          status?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          priority?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_campaigns: {
        Row: {
          budget: number
          clicks: number | null
          company_id: string | null
          conversions: number | null
          created_at: string | null
          end_date: string | null
          id: string
          impressions: number | null
          name: string
          platform: string
          start_date: string
          status: string | null
          target_audience: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget: number
          clicks?: number | null
          company_id?: string | null
          conversions?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name: string
          platform: string
          start_date: string
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number
          clicks?: number | null
          company_id?: string | null
          conversions?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          name?: string
          platform?: string
          start_date?: string
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          ad_campaign_id: string | null
          city: string | null
          company_id: string | null
          continent: string | null
          country: string | null
          created_at: string | null
          engagement_score: number | null
          id: string
          impression_type: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          ad_campaign_id?: string | null
          city?: string | null
          company_id?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          impression_type?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          ad_campaign_id?: string | null
          city?: string | null
          company_id?: string | null
          continent?: string | null
          country?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          impression_type?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_ad_campaign_id_fkey"
            columns: ["ad_campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_impressions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          ai_model: string | null
          company_id: string | null
          content_type: string
          created_at: string | null
          generated_images: Json | null
          generated_text: string
          hashtags: string[] | null
          id: string
          language: string | null
          metadata: Json | null
          platform: string
          post_id: string | null
          posted_at: string | null
          prompt: string
          scheduled_for: string | null
          status: string | null
          tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model?: string | null
          company_id?: string | null
          content_type?: string
          created_at?: string | null
          generated_images?: Json | null
          generated_text: string
          hashtags?: string[] | null
          id?: string
          language?: string | null
          metadata?: Json | null
          platform: string
          post_id?: string | null
          posted_at?: string | null
          prompt: string
          scheduled_for?: string | null
          status?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model?: string | null
          company_id?: string | null
          content_type?: string
          created_at?: string | null
          generated_images?: Json | null
          generated_text?: string
          hashtags?: string[] | null
          id?: string
          language?: string | null
          metadata?: Json | null
          platform?: string
          post_id?: string | null
          posted_at?: string | null
          prompt?: string
          scheduled_for?: string | null
          status?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_content_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generated_content_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_media_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integration_fields: {
        Row: {
          created_at: string
          default_value: string | null
          field_label: string
          field_name: string
          field_order: number | null
          field_type: string
          id: string
          integration_id: string
          is_required: boolean | null
          options: Json | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          field_label: string
          field_name: string
          field_order?: number | null
          field_type: string
          id?: string
          integration_id: string
          is_required?: boolean | null
          options?: Json | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          field_label?: string
          field_name?: string
          field_order?: number | null
          field_type?: string
          id?: string
          integration_id?: string
          is_required?: boolean | null
          options?: Json | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "api_integration_fields_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integration_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          integration_id: string
          request_body: Json | null
          request_headers: Json | null
          request_method: string | null
          request_url: string | null
          response_body: Json | null
          response_status: number | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          integration_id: string
          request_body?: Json | null
          request_headers?: Json | null
          request_method?: string | null
          request_url?: string | null
          response_body?: Json | null
          response_status?: number | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          integration_id?: string
          request_body?: Json | null
          request_headers?: Json | null
          request_method?: string | null
          request_url?: string | null
          response_body?: Json | null
          response_status?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_integration_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "api_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_integrations: {
        Row: {
          auth_config: Json | null
          auth_type: string | null
          base_url: string | null
          company_id: string | null
          created_at: string
          description: string | null
          headers: Json | null
          id: string
          integration_type: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          rate_limit: number | null
          retry_attempts: number | null
          timeout_seconds: number | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: string | null
          base_url?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          headers?: Json | null
          id?: string
          integration_type: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          rate_limit?: number | null
          retry_attempts?: number | null
          timeout_seconds?: number | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          auth_config?: Json | null
          auth_type?: string | null
          base_url?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          headers?: Json | null
          id?: string
          integration_type?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          rate_limit?: number | null
          retry_attempts?: number | null
          timeout_seconds?: number | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          actions_executed: Json | null
          company_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          execution_time_ms: number | null
          id: string
          metadata: Json | null
          status: string
          trigger_data: Json
          workflow_id: string
        }
        Insert: {
          actions_executed?: Json | null
          company_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          trigger_data: Json
          workflow_id: string
        }
        Update: {
          actions_executed?: Json | null
          company_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          execution_time_ms?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          trigger_data?: Json
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "automation_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_workflows: {
        Row: {
          actions: Json
          company_id: string
          conditions: Json | null
          created_at: string | null
          created_by: string
          description: string | null
          error_count: number | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          success_count: number | null
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          company_id: string
          conditions?: Json | null
          created_at?: string | null
          created_by: string
          description?: string | null
          error_count?: number | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          success_count?: number | null
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          company_id?: string
          conditions?: Json | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          error_count?: number | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          success_count?: number | null
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_workflows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          branch_type: string
          code: string
          company_id: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          is_active: boolean | null
          level: number
          manager_id: string | null
          metadata: Json | null
          name: string
          parent_branch_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          branch_type?: string
          code: string
          company_id: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          manager_id?: string | null
          metadata?: Json | null
          name: string
          parent_branch_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          branch_type?: string
          code?: string
          company_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          level?: number
          manager_id?: string | null
          metadata?: Json | null
          name?: string
          parent_branch_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branches_parent_branch_id_fkey"
            columns: ["parent_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: string[] | null
          category: string
          company_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          category: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          location?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          category?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      call_campaigns: {
        Row: {
          call_window_end: string | null
          call_window_start: string | null
          calls_completed: number | null
          calls_failed: number | null
          calls_made: number | null
          campaign_type: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          leads_generated: number | null
          max_attempts: number | null
          metadata: Json | null
          name: string
          recurrence_pattern: string | null
          retry_interval_hours: number | null
          scheduled_at: string | null
          script_id: string | null
          start_date: string | null
          status: string | null
          target_audience: Json | null
          total_contacts: number | null
          updated_at: string
        }
        Insert: {
          call_window_end?: string | null
          call_window_start?: string | null
          calls_completed?: number | null
          calls_failed?: number | null
          calls_made?: number | null
          campaign_type?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          max_attempts?: number | null
          metadata?: Json | null
          name: string
          recurrence_pattern?: string | null
          retry_interval_hours?: number | null
          scheduled_at?: string | null
          script_id?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          total_contacts?: number | null
          updated_at?: string
        }
        Update: {
          call_window_end?: string | null
          call_window_start?: string | null
          calls_completed?: number | null
          calls_failed?: number | null
          calls_made?: number | null
          campaign_type?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          max_attempts?: number | null
          metadata?: Json | null
          name?: string
          recurrence_pattern?: string | null
          retry_interval_hours?: number | null
          scheduled_at?: string | null
          script_id?: string | null
          start_date?: string | null
          status?: string | null
          target_audience?: Json | null
          total_contacts?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_campaigns_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "call_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      call_center_integrations: {
        Row: {
          account_sid: string | null
          api_key_encrypted: string | null
          company_id: string
          configuration: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          phone_number: string | null
          provider: string
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          account_sid?: string | null
          api_key_encrypted?: string | null
          company_id: string
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          provider: string
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          account_sid?: string | null
          api_key_encrypted?: string | null
          company_id?: string
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string | null
          provider?: string
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_center_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      call_logs: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          call_duration_seconds: number | null
          call_ended_at: string | null
          call_notes: string | null
          call_outcome: string | null
          call_recording_url: string | null
          call_started_at: string | null
          call_status: string | null
          campaign_id: string | null
          company_id: string
          contact_id: string | null
          contact_name: string | null
          created_at: string
          engagement_score: number | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          lead_id: string | null
          metadata: Json | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_notes?: string | null
          call_outcome?: string | null
          call_recording_url?: string | null
          call_started_at?: string | null
          call_status?: string | null
          campaign_id?: string | null
          company_id: string
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          engagement_score?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          call_duration_seconds?: number | null
          call_ended_at?: string | null
          call_notes?: string | null
          call_outcome?: string | null
          call_recording_url?: string | null
          call_started_at?: string | null
          call_status?: string | null
          campaign_id?: string | null
          company_id?: string
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          engagement_score?: number | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "call_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_scripts: {
        Row: {
          closing_message: string | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          name: string
          objection_handling: Json | null
          opening_message: string | null
          script_content: string
          script_type: string | null
          updated_at: string
        }
        Insert: {
          closing_message?: string | null
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          name: string
          objection_handling?: Json | null
          opening_message?: string | null
          script_content: string
          script_type?: string | null
          updated_at?: string
        }
        Update: {
          closing_message?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          name?: string
          objection_handling?: Json | null
          opening_message?: string | null
          script_content?: string
          script_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_scripts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_influencers: {
        Row: {
          agreed_price: number | null
          campaign_id: string
          content_approved_at: string | null
          content_submitted_at: string | null
          created_at: string | null
          deliverables: Json | null
          id: string
          influencer_id: string
          notes: string | null
          performance_metrics: Json | null
          posted_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agreed_price?: number | null
          campaign_id: string
          content_approved_at?: string | null
          content_submitted_at?: string | null
          created_at?: string | null
          deliverables?: Json | null
          id?: string
          influencer_id: string
          notes?: string | null
          performance_metrics?: Json | null
          posted_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agreed_price?: number | null
          campaign_id?: string
          content_approved_at?: string | null
          content_submitted_at?: string | null
          created_at?: string | null
          deliverables?: Json | null
          id?: string
          influencer_id?: string
          notes?: string | null
          performance_metrics?: Json | null
          posted_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_influencers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "influencer_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_assignments: {
        Row: {
          assigned_by: string
          commission_plan_id: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          commission_plan_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          commission_plan_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_assignments_commission_plan_id_fkey"
            columns: ["commission_plan_id"]
            isOneToOne: false
            referencedRelation: "commission_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_plans: {
        Row: {
          applies_to: string | null
          base_rate: number | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          effective_from: string
          effective_to: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          plan_type: string | null
          product_ids: string[] | null
          tiers: Json | null
          updated_at: string
        }
        Insert: {
          applies_to?: string | null
          base_rate?: number | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          plan_type?: string | null
          product_ids?: string[] | null
          tiers?: Json | null
          updated_at?: string
        }
        Update: {
          applies_to?: string | null
          base_rate?: number | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          plan_type?: string | null
          product_ids?: string[] | null
          tiers?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          applied_at: string
          approved_at: string | null
          approved_by: string | null
          company_size: string | null
          created_at: string
          email: string
          id: string
          industry: string | null
          name: string
          phone: string | null
          pricing_plan_id: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          id?: string
          industry?: string | null
          name: string
          phone?: string | null
          pricing_plan_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          applied_at?: string
          approved_at?: string | null
          approved_by?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          id?: string
          industry?: string | null
          name?: string
          phone?: string | null
          pricing_plan_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_platform_configs: {
        Row: {
          access_token: string | null
          api_key: string | null
          api_secret: string | null
          channel_id: string | null
          client_id: string | null
          client_secret: string | null
          company_id: string
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          platform_id: string
          redirect_url: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          channel_id?: string | null
          client_id?: string | null
          client_secret?: string | null
          company_id: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_id: string
          redirect_url?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          api_key?: string | null
          api_secret?: string | null
          channel_id?: string | null
          client_id?: string | null
          client_secret?: string | null
          company_id?: string
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_id?: string
          redirect_url?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_platform_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_platform_configs_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "social_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      company_platform_subscriptions: {
        Row: {
          company_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          platform_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          subscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          platform_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_platform_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_platform_subscriptions_platform_id_fkey"
            columns: ["platform_id"]
            isOneToOne: false
            referencedRelation: "social_platforms"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tts_settings: {
        Row: {
          company_id: string
          created_at: string
          elevenlabs_api_key: string | null
          id: string
          openai_api_key: string | null
          updated_at: string
          use_custom_keys: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string
          elevenlabs_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          updated_at?: string
          use_custom_keys?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string
          elevenlabs_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          updated_at?: string
          use_custom_keys?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "company_tts_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string | null
          address: string | null
          avatar_url: string | null
          city: string | null
          company_id: string | null
          country: string | null
          created_at: string
          created_by: string
          department: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_source: string | null
          linkedin_url: string | null
          metadata: Json | null
          mobile: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          title: string | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_id?: string | null
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          department?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_source?: string | null
          linkedin_url?: string | null
          metadata?: Json | null
          mobile?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_id?: string | null
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_source?: string | null
          linkedin_url?: string | null
          metadata?: Json | null
          mobile?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_contacts_account"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      content_recommendations: {
        Row: {
          ai_confidence: number | null
          company_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_interacted: boolean | null
          is_viewed: boolean | null
          post_id: string
          recommendation_reason: string | null
          recommendation_score: number
          recommended_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_interacted?: boolean | null
          is_viewed?: boolean | null
          post_id: string
          recommendation_reason?: string | null
          recommendation_score?: number
          recommended_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          company_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_interacted?: boolean | null
          is_viewed?: boolean | null
          post_id?: string
          recommendation_reason?: string | null
          recommendation_score?: number
          recommended_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contract_amendments: {
        Row: {
          amendment_content: string | null
          amendment_number: string
          amendment_type: string
          approved_at: string | null
          approved_by: string | null
          contract_id: string
          created_at: string
          created_by: string
          description: string
          effective_date: string
          id: string
          new_value: string | null
          previous_value: string | null
        }
        Insert: {
          amendment_content?: string | null
          amendment_number: string
          amendment_type: string
          approved_at?: string | null
          approved_by?: string | null
          contract_id: string
          created_at?: string
          created_by: string
          description: string
          effective_date: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
        }
        Update: {
          amendment_content?: string | null
          amendment_number?: string
          amendment_type?: string
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string
          created_at?: string
          created_by?: string
          description?: string
          effective_date?: string
          id?: string
          new_value?: string | null
          previous_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_compliance: {
        Row: {
          compliance_type: string
          contract_id: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          requirement: string
          status: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          compliance_type: string
          contract_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          requirement: string
          status?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          compliance_type?: string
          contract_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          requirement?: string
          status?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_compliance_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_milestones: {
        Row: {
          amount: number | null
          completed_at: string | null
          contract_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          name: string
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          completed_at?: string | null
          contract_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          name: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          completed_at?: string | null
          contract_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          name?: string
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_renewals: {
        Row: {
          contract_id: string
          created_at: string
          id: string
          new_end_date: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          renewal_date: string
          renewal_value: number | null
          status: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          id?: string
          new_end_date: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          renewal_date: string
          renewal_value?: number | null
          status?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          id?: string
          new_end_date?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          renewal_date?: string
          renewal_value?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_renewals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_category: string
          template_content: string
          terms_and_conditions: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_category: string
          template_content: string
          terms_and_conditions?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_category?: string
          template_content?: string
          terms_and_conditions?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          account_id: string | null
          auto_renewal: boolean | null
          client_signatory_date: string | null
          client_signatory_name: string | null
          company_id: string
          company_signatory_date: string | null
          company_signatory_name: string | null
          contact_id: string | null
          contract_content: string | null
          contract_file_url: string | null
          contract_number: string
          contract_type: string
          contract_value: number | null
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          end_date: string
          id: string
          metadata: Json | null
          owner_id: string
          payment_terms: string | null
          renewal_date: string | null
          renewal_notice_days: number | null
          signed_by_client: boolean | null
          signed_by_company: boolean | null
          start_date: string
          status: string | null
          tags: string[] | null
          template_id: string | null
          terms_and_conditions: string | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          auto_renewal?: boolean | null
          client_signatory_date?: string | null
          client_signatory_name?: string | null
          company_id: string
          company_signatory_date?: string | null
          company_signatory_name?: string | null
          contact_id?: string | null
          contract_content?: string | null
          contract_file_url?: string | null
          contract_number: string
          contract_type: string
          contract_value?: number | null
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          end_date: string
          id?: string
          metadata?: Json | null
          owner_id: string
          payment_terms?: string | null
          renewal_date?: string | null
          renewal_notice_days?: number | null
          signed_by_client?: boolean | null
          signed_by_company?: boolean | null
          start_date: string
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          terms_and_conditions?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          auto_renewal?: boolean | null
          client_signatory_date?: string | null
          client_signatory_name?: string | null
          company_id?: string
          company_signatory_date?: string | null
          company_signatory_name?: string | null
          contact_id?: string | null
          contract_content?: string | null
          contract_file_url?: string | null
          contract_number?: string
          contract_type?: string
          contract_value?: number | null
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          end_date?: string
          id?: string
          metadata?: Json | null
          owner_id?: string
          payment_terms?: string | null
          renewal_date?: string | null
          renewal_notice_days?: number | null
          signed_by_client?: boolean | null
          signed_by_company?: boolean | null
          start_date?: string
          status?: string | null
          tags?: string[] | null
          template_id?: string | null
          terms_and_conditions?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_module_data: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          data: Json
          id: string
          module_id: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          data?: Json
          id?: string
          module_id: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          data?: Json
          id?: string
          module_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_module_data_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "custom_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_module_fields: {
        Row: {
          created_at: string | null
          default_value: string | null
          display_name: string
          field_name: string
          field_options: Json | null
          field_order: number | null
          field_type: string
          help_text: string | null
          id: string
          is_required: boolean | null
          is_unique: boolean | null
          module_id: string
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          display_name: string
          field_name: string
          field_options?: Json | null
          field_order?: number | null
          field_type: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          is_unique?: boolean | null
          module_id: string
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          display_name?: string
          field_name?: string
          field_options?: Json | null
          field_order?: number | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          is_unique?: boolean | null
          module_id?: string
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_module_fields_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "custom_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_module_relationships: {
        Row: {
          created_at: string | null
          id: string
          relationship_name: string
          relationship_type: string
          source_module_id: string
          target_module_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          relationship_name: string
          relationship_type: string
          source_module_id: string
          target_module_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          relationship_name?: string
          relationship_type?: string
          source_module_id?: string
          target_module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_module_relationships_source_module_id_fkey"
            columns: ["source_module_id"]
            isOneToOne: false
            referencedRelation: "custom_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_module_relationships_target_module_id_fkey"
            columns: ["target_module_id"]
            isOneToOne: false
            referencedRelation: "custom_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_modules: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          description: string | null
          display_name: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          display_name: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          display_name?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_satisfaction_surveys: {
        Row: {
          comments: string | null
          company_id: string
          created_at: string
          customer_id: string | null
          id: string
          nps_score: number | null
          overall_rating: number | null
          professionalism: number | null
          response_quality: number | null
          response_time: number | null
          submitted_at: string | null
          survey_type: string | null
          ticket_id: string | null
          would_recommend: boolean | null
        }
        Insert: {
          comments?: string | null
          company_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          nps_score?: number | null
          overall_rating?: number | null
          professionalism?: number | null
          response_quality?: number | null
          response_time?: number | null
          submitted_at?: string | null
          survey_type?: string | null
          ticket_id?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          comments?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          nps_score?: number | null
          overall_rating?: number | null
          professionalism?: number | null
          response_quality?: number | null
          response_time?: number | null
          submitted_at?: string | null
          survey_type?: string | null
          ticket_id?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_satisfaction_surveys_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_satisfaction_surveys_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_satisfaction_surveys_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_logs: {
        Row: {
          action: string
          created_at: string
          document_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          document_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          document_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_access_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          file_size: number
          file_type: string
          file_url: string
          folder_path: string | null
          id: string
          is_shared: boolean | null
          metadata: Json | null
          name: string
          parent_document_id: string | null
          related_to_id: string | null
          related_to_type: string | null
          shared_with: string[] | null
          tags: string[] | null
          updated_at: string
          version: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          file_size: number
          file_type: string
          file_url: string
          folder_path?: string | null
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          name: string
          parent_document_id?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          shared_with?: string[] | null
          tags?: string[] | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          file_size?: number
          file_type?: string
          file_url?: string
          folder_path?: string | null
          id?: string
          is_shared?: boolean | null
          metadata?: Json | null
          name?: string
          parent_document_id?: string | null
          related_to_id?: string | null
          related_to_type?: string | null
          shared_with?: string[] | null
          tags?: string[] | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_whitelist: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          domain: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_whitelist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          bounced_count: number | null
          clicked_count: number | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          metadata: Json | null
          name: string
          opened_count: number | null
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string
          target_audience: Json | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          bounced_count?: number | null
          clicked_count?: number | null
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          metadata?: Json | null
          name: string
          opened_count?: number | null
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject: string
          target_audience?: Json | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          bounced_count?: number | null
          clicked_count?: number | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          metadata?: Json | null
          name?: string
          opened_count?: number | null
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string
          target_audience?: Json | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_configurations: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          sender_email: string | null
          sender_name: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_username: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          company_id: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          company_id: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          company_id?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          company_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          subject: string
          template_type: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          subject: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          subject?: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      industries: {
        Row: {
          benefits: Json | null
          case_study: Json | null
          created_at: string | null
          description: string | null
          display_name: string
          display_order: number | null
          features: Json | null
          icon_name: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
          use_cases: Json | null
        }
        Insert: {
          benefits?: Json | null
          case_study?: Json | null
          created_at?: string | null
          description?: string | null
          display_name: string
          display_order?: number | null
          features?: Json | null
          icon_name: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
          use_cases?: Json | null
        }
        Update: {
          benefits?: Json | null
          case_study?: Json | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          display_order?: number | null
          features?: Json | null
          icon_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
          use_cases?: Json | null
        }
        Relationships: []
      }
      influencer_campaigns: {
        Row: {
          budget: number
          company_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          goals: Json | null
          id: string
          name: string
          start_date: string
          status: string | null
          target_audience: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget: number
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          name: string
          start_date: string
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          goals?: Json | null
          id?: string
          name?: string
          start_date?: string
          status?: string | null
          target_audience?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_campaigns_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_communications: {
        Row: {
          communication_type: string | null
          created_at: string | null
          direction: string
          id: string
          influencer_id: string
          message: string
          subject: string | null
          user_id: string
        }
        Insert: {
          communication_type?: string | null
          created_at?: string | null
          direction: string
          id?: string
          influencer_id: string
          message: string
          subject?: string | null
          user_id: string
        }
        Update: {
          communication_type?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          influencer_id?: string
          message?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_communications_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_contracts: {
        Row: {
          campaign_influencer_id: string
          contract_url: string | null
          created_at: string | null
          id: string
          notes: string | null
          payment_amount: number
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          signed_at: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_influencer_id: string
          contract_url?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount: number
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          signed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_influencer_id?: string
          contract_url?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          signed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_contracts_campaign_influencer_id_fkey"
            columns: ["campaign_influencer_id"]
            isOneToOne: false
            referencedRelation: "campaign_influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencers: {
        Row: {
          avatar_url: string | null
          avg_post_price: number | null
          bio: string | null
          category: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          engagement_rate: number | null
          follower_count: number | null
          id: string
          location: string | null
          name: string
          phone: string | null
          platform: string
          platform_handle: string
          platform_url: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          avg_post_price?: number | null
          bio?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          location?: string | null
          name: string
          phone?: string | null
          platform: string
          platform_handle: string
          platform_url?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          avg_post_price?: number | null
          bio?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          engagement_rate?: number | null
          follower_count?: number | null
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          platform?: string
          platform_handle?: string
          platform_url?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_whitelist: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_whitelist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          author_id: string
          category: string
          company_id: string
          content: string
          created_at: string
          helpful_count: number | null
          id: string
          is_public: boolean | null
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          metadata: Json | null
          not_helpful_count: number | null
          related_articles: string[] | null
          status: string
          subcategory: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          category: string
          company_id: string
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_public?: boolean | null
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          metadata?: Json | null
          not_helpful_count?: number | null
          related_articles?: string[] | null
          status?: string
          subcategory?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          category?: string
          company_id?: string
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_public?: boolean | null
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          metadata?: Json | null
          not_helpful_count?: number | null
          related_articles?: string[] | null
          status?: string
          subcategory?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          scheduled_publish: string | null
          section_key: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scheduled_publish?: string | null
          section_key: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scheduled_publish?: string | null
          section_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          city: string | null
          company: string | null
          company_id: string | null
          converted: boolean | null
          converted_account_id: string | null
          converted_at: string | null
          converted_contact_id: string | null
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          lead_score: number | null
          lead_source: string | null
          lead_status: string | null
          metadata: Json | null
          phone: string | null
          state: string | null
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          converted?: boolean | null
          converted_account_id?: string | null
          converted_at?: string | null
          converted_contact_id?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          metadata?: Json | null
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          converted?: boolean | null
          converted_account_id?: string | null
          converted_at?: string | null
          converted_contact_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          lead_score?: number | null
          lead_source?: string | null
          lead_status?: string | null
          metadata?: Json | null
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_account_id_fkey"
            columns: ["converted_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_contact_id_fkey"
            columns: ["converted_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          company_id: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_pinned: boolean | null
          metadata: Json | null
          related_to_id: string
          related_to_type: string
          title: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          related_to_id: string
          related_to_type: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_pinned?: boolean | null
          metadata?: Json | null
          related_to_id?: string
          related_to_type?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_provider_settings: {
        Row: {
          client_id: string | null
          client_secret: string | null
          config: Json | null
          created_at: string | null
          display_name: string
          id: string
          is_configured: boolean | null
          is_enabled: boolean | null
          provider_name: string
          redirect_url: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          client_secret?: string | null
          config?: Json | null
          created_at?: string | null
          display_name: string
          id?: string
          is_configured?: boolean | null
          is_enabled?: boolean | null
          provider_name: string
          redirect_url?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          client_secret?: string | null
          config?: Json | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_configured?: boolean | null
          is_enabled?: boolean | null
          provider_name?: string
          redirect_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          account_id: string | null
          amount: number | null
          closed_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          description: string | null
          expected_close_date: string | null
          id: string
          lead_source: string | null
          metadata: Json | null
          name: string
          next_step: string | null
          owner_id: string | null
          probability: number | null
          stage_id: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount?: number | null
          closed_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_source?: string | null
          metadata?: Json | null
          name: string
          next_step?: string | null
          owner_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number | null
          closed_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_source?: string | null
          metadata?: Json | null
          name?: string
          next_step?: string | null
          owner_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_date: string | null
          payment_method: string
          phone_number: string | null
          status: string | null
          subscription_request_id: string | null
          transaction_reference: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method: string
          phone_number?: string | null
          status?: string | null
          subscription_request_id?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_date?: string | null
          payment_method?: string
          phone_number?: string | null
          status?: string | null
          subscription_request_id?: string | null
          transaction_reference?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_request_id_fkey"
            columns: ["subscription_request_id"]
            isOneToOne: false
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          module_name: string
          permission_key: string
          permission_name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          module_name: string
          permission_key: string
          permission_name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          module_name?: string
          permission_key?: string
          permission_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          company_id: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          probability: number | null
          stage_type: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          probability?: number | null
          stage_type?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          probability?: number | null
          stage_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      price_book_entries: {
        Row: {
          created_at: string
          discount_percentage: number | null
          id: string
          list_price: number
          price_book_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          list_price: number
          price_book_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          list_price?: number
          price_book_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_book_entries_price_book_id_fkey"
            columns: ["price_book_id"]
            isOneToOne: false
            referencedRelation: "price_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_book_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_books: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_books_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_plans: {
        Row: {
          billing_period: string | null
          created_at: string | null
          cta_text: string | null
          currency: string | null
          custom_integrations: boolean | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          includes_ai: boolean | null
          is_active: boolean | null
          is_popular: boolean | null
          max_social_accounts: number | null
          max_team_members: number | null
          name: string
          price: number
          slug: string
          support_level: string | null
          updated_at: string | null
        }
        Insert: {
          billing_period?: string | null
          created_at?: string | null
          cta_text?: string | null
          currency?: string | null
          custom_integrations?: boolean | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          includes_ai?: boolean | null
          is_active?: boolean | null
          is_popular?: boolean | null
          max_social_accounts?: number | null
          max_team_members?: number | null
          name: string
          price: number
          slug: string
          support_level?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_period?: string | null
          created_at?: string | null
          cta_text?: string | null
          currency?: string | null
          custom_integrations?: boolean | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          includes_ai?: boolean | null
          is_active?: boolean | null
          is_popular?: boolean | null
          max_social_accounts?: number | null
          max_team_members?: number | null
          name?: string
          price?: number
          slug?: string
          support_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          company_id: string
          cost_price: number | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          manufacturer: string | null
          metadata: Json | null
          product_code: string | null
          product_name: string
          product_type: string | null
          quantity_in_stock: number | null
          reorder_level: number | null
          sku: string | null
          tax_rate: number | null
          unit_of_measure: string | null
          unit_price: number
          updated_at: string
          vendor: string | null
        }
        Insert: {
          category_id?: string | null
          company_id: string
          cost_price?: number | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          metadata?: Json | null
          product_code?: string | null
          product_name: string
          product_type?: string | null
          quantity_in_stock?: number | null
          reorder_level?: number | null
          sku?: string | null
          tax_rate?: number | null
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          category_id?: string | null
          company_id?: string
          cost_price?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          metadata?: Json | null
          product_code?: string | null
          product_name?: string
          product_type?: string | null
          quantity_in_stock?: number | null
          reorder_level?: number | null
          sku?: string | null
          tax_rate?: number | null
          unit_of_measure?: string | null
          unit_price?: number
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          deliverables: Json | null
          description: string | null
          due_date: string
          id: string
          is_completed: boolean | null
          milestone_order: number | null
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          due_date: string
          id?: string
          is_completed?: boolean | null
          milestone_order?: number | null
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deliverables?: Json | null
          description?: string | null
          due_date?: string
          id?: string
          is_completed?: boolean | null
          milestone_order?: number | null
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          dependencies: Json | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          milestone_id: string | null
          priority: string | null
          project_id: string
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string | null
          project_id: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          dependencies?: Json | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          milestone_id?: string | null
          priority?: string | null
          project_id?: string
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_team_members: {
        Row: {
          assigned_at: string
          hourly_rate: number | null
          id: string
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          hourly_rate?: number | null
          id?: string
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          hourly_rate?: number | null
          id?: string
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          actual_start_date: string | null
          budget: number | null
          budget_spent: number | null
          client_account_id: string | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          name: string
          priority: string | null
          progress_percentage: number | null
          project_manager_id: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          budget?: number | null
          budget_spent?: number | null
          client_account_id?: string | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name: string
          priority?: string | null
          progress_percentage?: number | null
          project_manager_id?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          actual_start_date?: string | null
          budget?: number | null
          budget_spent?: number | null
          client_account_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          priority?: string | null
          progress_percentage?: number | null
          project_manager_id?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          item_name: string
          line_total: number
          product_id: string | null
          quantity: number
          quote_id: string
          sort_order: number | null
          tax_percentage: number | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          item_name: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          quote_id: string
          sort_order?: number | null
          tax_percentage?: number | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          item_name?: string
          line_total?: number
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sort_order?: number | null
          tax_percentage?: number | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          account_id: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          created_by: string
          discount_amount: number | null
          id: string
          metadata: Json | null
          notes: string | null
          opportunity_id: string | null
          quote_name: string
          quote_number: string
          rejected_at: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          terms_and_conditions: string | null
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          accepted_at?: string | null
          account_id?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          created_by: string
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          opportunity_id?: string | null
          quote_name: string
          quote_number: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          accepted_at?: string | null
          account_id?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          opportunity_id?: string | null
          quote_name?: string
          quote_number?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          terms_and_conditions?: string | null
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          company_id: string | null
          created_at: string
          granted_by: string | null
          id: string
          permission_id: string
          role: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id: string
          role: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean | null
          role_key: string
          role_name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          role_key: string
          role_name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          role_key?: string
          role_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_performance: {
        Row: {
          activities_completed: number | null
          average_deal_size: number | null
          calls_made: number | null
          commission_earned: number | null
          company_id: string
          created_at: string
          deals_closed: number | null
          deals_lost: number | null
          deals_won: number | null
          emails_sent: number | null
          id: string
          leads_converted: number | null
          leads_generated: number | null
          meetings_held: number | null
          metadata: Json | null
          period_end: string
          period_start: string
          period_type: string
          pipeline_value: number | null
          quota_achieved: number | null
          quota_assigned: number | null
          revenue_generated: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          activities_completed?: number | null
          average_deal_size?: number | null
          calls_made?: number | null
          commission_earned?: number | null
          company_id: string
          created_at?: string
          deals_closed?: number | null
          deals_lost?: number | null
          deals_won?: number | null
          emails_sent?: number | null
          id?: string
          leads_converted?: number | null
          leads_generated?: number | null
          meetings_held?: number | null
          metadata?: Json | null
          period_end: string
          period_start: string
          period_type: string
          pipeline_value?: number | null
          quota_achieved?: number | null
          quota_assigned?: number | null
          revenue_generated?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          activities_completed?: number | null
          average_deal_size?: number | null
          calls_made?: number | null
          commission_earned?: number | null
          company_id?: string
          created_at?: string
          deals_closed?: number | null
          deals_lost?: number | null
          deals_won?: number | null
          emails_sent?: number | null
          id?: string
          leads_converted?: number | null
          leads_generated?: number | null
          meetings_held?: number | null
          metadata?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          pipeline_value?: number | null
          quota_achieved?: number | null
          quota_assigned?: number | null
          revenue_generated?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_performance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_teams: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          metadata: Json | null
          name: string
          parent_team_id: string | null
          team_type: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          metadata?: Json | null
          name: string
          parent_team_id?: string | null
          team_type?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          metadata?: Json | null
          name?: string
          parent_team_id?: string | null
          team_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "sales_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sentiment_analysis: {
        Row: {
          ai_model: string | null
          analyzed_at: string | null
          company_id: string
          confidence: number
          content_id: string
          content_text: string | null
          content_type: string
          created_at: string | null
          emotions: Json | null
          id: string
          keywords: string[] | null
          language: string | null
          metadata: Json | null
          platform: string
          sentiment: string
          sentiment_score: number
          topics: string[] | null
        }
        Insert: {
          ai_model?: string | null
          analyzed_at?: string | null
          company_id: string
          confidence: number
          content_id: string
          content_text?: string | null
          content_type: string
          created_at?: string | null
          emotions?: Json | null
          id?: string
          keywords?: string[] | null
          language?: string | null
          metadata?: Json | null
          platform: string
          sentiment: string
          sentiment_score: number
          topics?: string[] | null
        }
        Update: {
          ai_model?: string | null
          analyzed_at?: string | null
          company_id?: string
          confidence?: number
          content_id?: string
          content_text?: string | null
          content_type?: string
          created_at?: string | null
          emotions?: Json | null
          id?: string
          keywords?: string[] | null
          language?: string | null
          metadata?: Json | null
          platform?: string
          sentiment?: string
          sentiment_score?: number
          topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "sentiment_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          applies_to_categories: string[] | null
          business_hours_only: boolean | null
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          first_response_time_hours: number
          id: string
          is_active: boolean | null
          name: string
          priority_level: string
          resolution_time_hours: number
          updated_at: string
        }
        Insert: {
          applies_to_categories?: string[] | null
          business_hours_only?: boolean | null
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          first_response_time_hours: number
          id?: string
          is_active?: boolean | null
          name: string
          priority_level: string
          resolution_time_hours: number
          updated_at?: string
        }
        Update: {
          applies_to_categories?: string[] | null
          business_hours_only?: boolean | null
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          first_response_time_hours?: number
          id?: string
          is_active?: boolean | null
          name?: string
          priority_level?: string
          resolution_time_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_conversations: {
        Row: {
          company_id: string
          content: string
          conversation_id: string
          created_at: string | null
          direction: string
          id: string
          is_automated: boolean | null
          media_urls: Json | null
          message_type: string
          metadata: Json | null
          participant_avatar: string | null
          participant_id: string
          participant_name: string
          platform: string
          responded_at: string | null
          responded_by: string | null
          sentiment_score: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content: string
          conversation_id: string
          created_at?: string | null
          direction: string
          id?: string
          is_automated?: boolean | null
          media_urls?: Json | null
          message_type?: string
          metadata?: Json | null
          participant_avatar?: string | null
          participant_id: string
          participant_name: string
          platform: string
          responded_at?: string | null
          responded_by?: string | null
          sentiment_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          id?: string
          is_automated?: boolean | null
          media_urls?: Json | null
          message_type?: string
          metadata?: Json | null
          participant_avatar?: string | null
          participant_id?: string
          participant_name?: string
          platform?: string
          responded_at?: string | null
          responded_by?: string | null
          sentiment_score?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          platform: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_name: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_comments: {
        Row: {
          account_id: string
          author_id: string
          author_name: string
          city: string | null
          content: string
          continent: string | null
          country: string | null
          created_at: string | null
          id: string
          platform_comment_id: string
          post_id: string | null
          replied: boolean | null
          replied_at: string | null
          reply_content: string | null
        }
        Insert: {
          account_id: string
          author_id: string
          author_name: string
          city?: string | null
          content: string
          continent?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          platform_comment_id: string
          post_id?: string | null
          replied?: boolean | null
          replied_at?: string | null
          reply_content?: string | null
        }
        Update: {
          account_id?: string
          author_id?: string
          author_name?: string
          city?: string | null
          content?: string
          continent?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          platform_comment_id?: string
          post_id?: string | null
          replied?: boolean | null
          replied_at?: string | null
          reply_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_comments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_comments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_media_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_mentions: {
        Row: {
          account_id: string
          author_id: string
          author_name: string
          city: string | null
          content: string
          continent: string | null
          country: string | null
          created_at: string | null
          engagement_count: number | null
          id: string
          keyword_id: string | null
          mention_type: string | null
          mentioned_at: string
          platform: string
          post_url: string | null
          sentiment: string | null
        }
        Insert: {
          account_id: string
          author_id: string
          author_name: string
          city?: string | null
          content: string
          continent?: string | null
          country?: string | null
          created_at?: string | null
          engagement_count?: number | null
          id?: string
          keyword_id?: string | null
          mention_type?: string | null
          mentioned_at: string
          platform: string
          post_url?: string | null
          sentiment?: string | null
        }
        Update: {
          account_id?: string
          author_id?: string
          author_name?: string
          city?: string | null
          content?: string
          continent?: string | null
          country?: string | null
          created_at?: string | null
          engagement_count?: number | null
          id?: string
          keyword_id?: string | null
          mention_type?: string | null
          mentioned_at?: string
          platform?: string
          post_url?: string | null
          sentiment?: string | null
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          clicks: number | null
          company_id: string | null
          content: string
          created_at: string | null
          engagement_rate: number | null
          flag_reason: string | null
          flagged: boolean | null
          id: string
          likes: number | null
          media_urls: Json | null
          metrics_last_synced_at: string | null
          moderated_at: string | null
          moderated_by: string | null
          platform_post_ids: Json | null
          platforms: string[]
          reach: number | null
          saves: number | null
          scheduled_at: string | null
          shares: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          video_watch_time_seconds: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          company_id?: string | null
          content: string
          created_at?: string | null
          engagement_rate?: number | null
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          likes?: number | null
          media_urls?: Json | null
          metrics_last_synced_at?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          platform_post_ids?: Json | null
          platforms: string[]
          reach?: number | null
          saves?: number | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          video_watch_time_seconds?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          company_id?: string | null
          content?: string
          created_at?: string | null
          engagement_rate?: number | null
          flag_reason?: string | null
          flagged?: boolean | null
          id?: string
          likes?: number | null
          media_urls?: Json | null
          metrics_last_synced_at?: string | null
          moderated_at?: string | null
          moderated_by?: string | null
          platform_post_ids?: Json | null
          platforms?: string[]
          reach?: number | null
          saves?: number | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          video_watch_time_seconds?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_platform_tokens: {
        Row: {
          access_token: string
          account_id: string
          account_name: string
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          metadata: Json | null
          permissions: Json | null
          platform: string
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          account_id: string
          account_name: string
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          permissions?: Json | null
          platform: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          metadata?: Json | null
          permissions?: Json | null
          platform?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_platform_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_platforms: {
        Row: {
          api_base_url: string | null
          config: Json | null
          created_at: string | null
          display_name: string
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          oauth_authorize_url: string | null
          oauth_scopes: string | null
          oauth_token_url: string | null
          pricing_info: string | null
          requires_api_key: boolean | null
          requires_oauth: boolean | null
          subscription_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          api_base_url?: string | null
          config?: Json | null
          created_at?: string | null
          display_name: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          oauth_authorize_url?: string | null
          oauth_scopes?: string | null
          oauth_token_url?: string | null
          pricing_info?: string | null
          requires_api_key?: boolean | null
          requires_oauth?: boolean | null
          subscription_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          api_base_url?: string | null
          config?: Json | null
          created_at?: string | null
          display_name?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          oauth_authorize_url?: string | null
          oauth_scopes?: string | null
          oauth_token_url?: string | null
          pricing_info?: string | null
          requires_api_key?: boolean | null
          requires_oauth?: boolean | null
          subscription_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_requests: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          industry: string | null
          is_trial: boolean | null
          message: string | null
          metadata: Json | null
          payment_instructions: string | null
          payment_method: string | null
          phone: string
          pricing_plan_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          trial_converted: boolean | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          industry?: string | null
          is_trial?: boolean | null
          message?: string | null
          metadata?: Json | null
          payment_instructions?: string | null
          payment_method?: string | null
          phone: string
          pricing_plan_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          trial_converted?: boolean | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          industry?: string | null
          is_trial?: boolean | null
          message?: string | null
          metadata?: Json | null
          payment_instructions?: string | null
          payment_method?: string | null
          phone?: string
          pricing_plan_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          trial_converted?: boolean | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_requests_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_team_members: {
        Row: {
          added_by: string
          created_at: string
          id: string
          is_active: boolean | null
          max_tickets_per_day: number | null
          role: string | null
          specializations: string[] | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_tickets_per_day?: number | null
          role?: string | null
          specializations?: string[] | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_tickets_per_day?: number | null
          role?: string | null
          specializations?: string[] | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "support_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      support_teams: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          specialization: string[] | null
          team_email: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          specialization?: string[] | null
          team_email?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          specialization?: string[] | null
          team_email?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          account_id: string | null
          assigned_team: string | null
          assigned_to: string | null
          category: string | null
          channel: string | null
          closed_at: string | null
          company_id: string
          created_at: string
          customer_id: string | null
          description: string
          due_date: string | null
          first_response_at: string | null
          id: string
          metadata: Json | null
          priority: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          satisfaction_comment: string | null
          satisfaction_rating: number | null
          sla_breach: boolean | null
          status: string
          subject: string
          tags: string[] | null
          ticket_number: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_team?: string | null
          assigned_to?: string | null
          category?: string | null
          channel?: string | null
          closed_at?: string | null
          company_id: string
          created_at?: string
          customer_id?: string | null
          description: string
          due_date?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          sla_breach?: boolean | null
          status?: string
          subject: string
          tags?: string[] | null
          ticket_number: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_team?: string | null
          assigned_to?: string | null
          category?: string | null
          channel?: string | null
          closed_at?: string | null
          company_id?: string
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          sla_breach?: boolean | null
          status?: string
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_by: string
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean | null
          join_date: string
          leave_date: string | null
          notes: string | null
          quota: number | null
          role: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_by: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          join_date?: string
          leave_date?: string | null
          notes?: string | null
          quota?: number | null
          role?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_by?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          join_date?: string
          leave_date?: string | null
          notes?: string | null
          quota?: number | null
          role?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "sales_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          account_size_range: string | null
          annual_revenue_max: number | null
          annual_revenue_min: number | null
          city: string | null
          company_id: string
          country: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          industry_focus: string[] | null
          is_active: boolean | null
          metadata: Json | null
          name: string
          postal_codes: string[] | null
          region: string | null
          state: string | null
          target_quota: number | null
          territory_type: string | null
          updated_at: string
        }
        Insert: {
          account_size_range?: string | null
          annual_revenue_max?: number | null
          annual_revenue_min?: number | null
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          industry_focus?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          postal_codes?: string[] | null
          region?: string | null
          state?: string | null
          target_quota?: number | null
          territory_type?: string | null
          updated_at?: string
        }
        Update: {
          account_size_range?: string | null
          annual_revenue_max?: number | null
          annual_revenue_min?: number | null
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          industry_focus?: string[] | null
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          postal_codes?: string[] | null
          region?: string | null
          state?: string | null
          target_quota?: number | null
          territory_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "territories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      territory_assignments: {
        Row: {
          assigned_by: string
          commission_rate: number | null
          created_at: string
          end_date: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          quota: number | null
          role: string | null
          start_date: string
          territory_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by: string
          commission_rate?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          quota?: number | null
          role?: string | null
          start_date?: string
          territory_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string
          commission_rate?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          quota?: number | null
          role?: string | null
          start_date?: string
          territory_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "territory_assignments_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          attachments: Json | null
          comment_text: string
          created_at: string
          created_by: string
          id: string
          is_internal: boolean | null
          is_solution: boolean | null
          ticket_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          comment_text: string
          created_at?: string
          created_by: string
          id?: string
          is_internal?: boolean | null
          is_solution?: boolean | null
          ticket_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          comment_text?: string
          created_at?: string
          created_by?: string
          id?: string
          is_internal?: boolean | null
          is_solution?: boolean | null
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable_rate: number | null
          company_id: string
          created_at: string
          description: string | null
          entry_date: string
          hours: number
          id: string
          is_billable: boolean | null
          project_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billable_rate?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          entry_date?: string
          hours: number
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billable_rate?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          hours?: number
          id?: string
          is_billable?: boolean | null
          project_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracked_keywords: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          keyword: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keyword?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracked_keywords_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_topics: {
        Row: {
          category: string | null
          detected_at: string | null
          growth_rate: number | null
          hashtag: string | null
          id: string
          last_updated: string | null
          platform: string
          topic: string
          volume: number | null
        }
        Insert: {
          category?: string | null
          detected_at?: string | null
          growth_rate?: number | null
          hashtag?: string | null
          id?: string
          last_updated?: string | null
          platform: string
          topic: string
          volume?: number | null
        }
        Update: {
          category?: string | null
          detected_at?: string | null
          growth_rate?: number | null
          hashtag?: string | null
          id?: string
          last_updated?: string | null
          platform?: string
          topic?: string
          volume?: number | null
        }
        Relationships: []
      }
      trial_settings: {
        Row: {
          created_at: string | null
          id: string
          is_trial_enabled: boolean
          trial_duration_days: number
          trial_features: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_trial_enabled?: boolean
          trial_duration_days?: number
          trial_features?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_trial_enabled?: boolean
          trial_duration_days?: number
          trial_features?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_content_preferences: {
        Row: {
          ai_analysis: Json | null
          company_id: string | null
          created_at: string
          engagement_score: number | null
          id: string
          last_analyzed_at: string | null
          optimal_engagement_times: Json | null
          preferred_content_types: Json | null
          preferred_topics: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          company_id?: string | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          last_analyzed_at?: string | null
          optimal_engagement_times?: Json | null
          preferred_content_types?: Json | null
          preferred_topics?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          company_id?: string | null
          created_at?: string
          engagement_score?: number | null
          id?: string
          last_analyzed_at?: string | null
          optimal_engagement_times?: Json | null
          preferred_content_types?: Json | null
          preferred_topics?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_engagement: {
        Row: {
          company_id: string | null
          created_at: string
          device_type: string | null
          engagement_duration: number | null
          engagement_metadata: Json | null
          engagement_type: string
          id: string
          ip_address: string | null
          location_data: Json | null
          post_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          device_type?: string | null
          engagement_duration?: number | null
          engagement_metadata?: Json | null
          engagement_type: string
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          post_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          device_type?: string | null
          engagement_duration?: number | null
          engagement_metadata?: Json | null
          engagement_type?: string
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          post_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_reach_scores: {
        Row: {
          created_at: string | null
          engagement_level: string | null
          id: string
          interests: Json | null
          last_calculated_at: string | null
          reach_score: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          engagement_level?: string | null
          id?: string
          interests?: Json | null
          last_calculated_at?: string | null
          reach_score?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          engagement_level?: string | null
          id?: string
          interests?: Json | null
          last_calculated_at?: string | null
          reach_score?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          branch_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          end_date: string | null
          id: string
          pricing_plan_id: string | null
          start_date: string | null
          status: string | null
          subscription_request_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          pricing_plan_id?: string | null
          start_date?: string | null
          status?: string | null
          subscription_request_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          pricing_plan_id?: string | null
          start_date?: string | null
          status?: string | null
          subscription_request_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_pricing_plan_id_fkey"
            columns: ["pricing_plan_id"]
            isOneToOne: false
            referencedRelation: "pricing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_subscription_request_id_fkey"
            columns: ["subscription_request_id"]
            isOneToOne: false
            referencedRelation: "subscription_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_log_view: {
        Row: {
          action: string | null
          company_id: string | null
          created_at: string | null
          details: Json | null
          id: string | null
          ip_address: string | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_configurations_safe: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          sender_email: string | null
          sender_name: string | null
          smtp_host: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_username: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          sender_email?: string | null
          sender_name?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_username?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_configurations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_safe: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_accounts_safe: {
        Row: {
          account_id: string | null
          account_name: string | null
          company_id: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          platform: string | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          account_name?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          platform?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          account_name?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          platform?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_branch: {
        Args: { _branch_id: string; _user_id: string }
        Returns: boolean
      }
      get_branch_hierarchy: {
        Args: { branch_uuid: string }
        Returns: {
          branch_id: string
          level: number
        }[]
      }
      get_user_accessible_branches: {
        Args: { _user_id: string }
        Returns: {
          branch_id: string
        }[]
      }
      get_user_company_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: string
        }[]
      }
      get_user_trial_info: {
        Args: { _user_id: string }
        Returns: {
          days_remaining: number
          is_trial: boolean
          trial_converted: boolean
          trial_ends_at: string
        }[]
      }
      has_active_trial: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { _role: string; _user_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "agent", "user"],
    },
  },
} as const
