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
          company_id: string | null
          created_at: string | null
          engagement_score: number | null
          id: string
          impression_type: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          ad_campaign_id?: string | null
          company_id?: string | null
          created_at?: string | null
          engagement_score?: number | null
          id?: string
          impression_type?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          ad_campaign_id?: string | null
          company_id?: string | null
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
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      company_platform_configs: {
        Row: {
          api_key: string | null
          api_secret: string | null
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
          api_key?: string | null
          api_secret?: string | null
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
          api_key?: string | null
          api_secret?: string | null
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
      landing_page_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          section_key: string
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          section_key: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          section_key?: string
          updated_at?: string | null
        }
        Relationships: []
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
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
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
          content: string
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
          content: string
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
          content?: string
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
          content: string
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
          content: string
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
          content?: string
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
      social_media_metrics: {
        Row: {
          account_id: string
          created_at: string | null
          engagement_rate: number | null
          followers_count: number | null
          id: string
          last_synced_at: string | null
          posts_count: number | null
        }
        Insert: {
          account_id: string
          created_at?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          last_synced_at?: string | null
          posts_count?: number | null
        }
        Update: {
          account_id?: string
          created_at?: string | null
          engagement_rate?: number | null
          followers_count?: number | null
          id?: string
          last_synced_at?: string | null
          posts_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "social_media_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_media_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          company_id: string | null
          content: string
          created_at: string | null
          id: string
          platform_post_ids: Json | null
          platforms: string[]
          scheduled_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          platform_post_ids?: Json | null
          platforms: string[]
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          platform_post_ids?: Json | null
          platforms?: string[]
          scheduled_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
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
          requires_api_key: boolean | null
          requires_oauth: boolean | null
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
          requires_api_key?: boolean | null
          requires_oauth?: boolean | null
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
          requires_api_key?: boolean | null
          requires_oauth?: boolean | null
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
      user_engagement: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          interactions: Json | null
          page_visited: string
          session_id: string
          time_spent: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          interactions?: Json | null
          page_visited: string
          session_id: string
          time_spent?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          interactions?: Json | null
          page_visited?: string
          session_id?: string
          time_spent?: number | null
          user_id?: string | null
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
          company_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
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
          smtp_password: string | null
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
          smtp_password?: never
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
          smtp_password?: never
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
      get_user_company_id: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
