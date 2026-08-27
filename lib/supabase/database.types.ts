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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          bucket_key: string
          expires_at: string
          request_count: number
          scope: string
          window_started_at: string
        }
        Insert: {
          bucket_key: string
          expires_at: string
          request_count: number
          scope: string
          window_started_at: string
        }
        Update: {
          bucket_key?: string
          expires_at?: string
          request_count?: number
          scope?: string
          window_started_at?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          after_state: Json | null
          before_state: Json | null
          correlation_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: number
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: never
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: never
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          last_seen_at: string
          revoked_at: string | null
          token_hash: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          last_seen_at?: string
          revoked_at?: string | null
          token_hash: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          last_seen_at?: string
          revoked_at?: string | null
          token_hash?: string
          user_id?: string | null
        }
        Relationships: []
      }
      buyer_shortlist_items: {
        Row: {
          buyer_session_id: string
          created_at: string
          property_id: string
        }
        Insert: {
          buyer_session_id: string
          created_at?: string
          property_id: string
        }
        Update: {
          buyer_session_id?: string
          created_at?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_shortlist_items_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_shortlist_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_shortlist_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      content_entries: {
        Row: {
          body: Json
          content_type: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          publication_ends_at: string | null
          publication_status: string
          published_at: string | null
          slug: string
          source_name: string | null
          source_updated_at: string | null
          summary: string | null
          title: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          body?: Json
          content_type: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          slug: string
          source_name?: string | null
          source_updated_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          body?: Json
          content_type?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          slug?: string
          source_name?: string | null
          source_updated_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_messages: {
        Row: {
          content: string | null
          content_blocks: Json
          created_at: string
          id: number
          role: string
          session_id: string
        }
        Insert: {
          content?: string | null
          content_blocks?: Json
          created_at?: string
          id?: never
          role: string
          session_id: string
        }
        Update: {
          content?: string | null
          content_blocks?: Json
          created_at?: string
          id?: never
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          buyer_session_id: string | null
          channel: string
          ended_at: string | null
          id: string
          model: string | null
          organization_id: string | null
          started_at: string
          status: string
          user_id: string | null
        }
        Insert: {
          buyer_session_id?: string | null
          channel?: string
          ended_at?: string | null
          id?: string
          model?: string | null
          organization_id?: string | null
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          buyer_session_id?: string | null
          channel?: string
          ended_at?: string | null
          id?: string
          model?: string | null
          organization_id?: string | null
          started_at?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_sessions_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_outbox: {
        Row: {
          attempt_count: number
          available_at: string
          created_at: string
          delivered_at: string | null
          event_type: string
          id: number
          inquiry_id: string
          organization_id: string
          payload: Json
          status: string
        }
        Insert: {
          attempt_count?: number
          available_at?: string
          created_at?: string
          delivered_at?: string | null
          event_type: string
          id?: never
          inquiry_id: string
          organization_id: string
          payload?: Json
          status?: string
        }
        Update: {
          attempt_count?: number
          available_at?: string
          created_at?: string
          delivered_at?: string | null
          event_type?: string
          id?: never
          inquiry_id?: string
          organization_id?: string
          payload?: Json
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_outbox_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_outbox_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      advisor_evidence_feedback: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: string
          inquiry_id: string
          notes: string | null
          organization_id: string
          outcome: string | null
          property_id: string | null
          search_run_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          id?: string
          inquiry_id: string
          notes?: string | null
          organization_id: string
          outcome?: string | null
          property_id?: string | null
          search_run_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          inquiry_id?: string
          notes?: string | null
          organization_id?: string
          outcome?: string | null
          property_id?: string | null
          search_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisor_evidence_feedback_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_evidence_feedback_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_evidence_feedback_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisor_evidence_feedback_search_run_id_fkey"
            columns: ["search_run_id"]
            isOneToOne: false
            referencedRelation: "search_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_ledger_events: {
        Row: {
          buyer_session_id: string
          event_key: string
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          schema_version: string
          search_run_id: string
          summary: string
        }
        Insert: {
          buyer_session_id: string
          event_key: string
          event_type: string
          id?: string
          occurred_at?: string
          payload?: Json
          schema_version?: string
          search_run_id: string
          summary: string
        }
        Update: {
          buyer_session_id?: string
          event_key?: string
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          schema_version?: string
          search_run_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_ledger_events_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_ledger_events_search_run_id_fkey"
            columns: ["search_run_id"]
            isOneToOne: false
            referencedRelation: "search_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_assertions: {
        Row: {
          as_seen_value: Json | null
          assertion_key: string
          buyer_session_id: string
          content_hash: string
          created_at: string
          field: string
          id: string
          observed_at: string | null
          property_id: string | null
          schema_version: string
          search_run_id: string
          source_name: string | null
          state: string
        }
        Insert: {
          as_seen_value?: Json | null
          assertion_key: string
          buyer_session_id: string
          content_hash: string
          created_at?: string
          field: string
          id?: string
          observed_at?: string | null
          property_id?: string | null
          schema_version?: string
          search_run_id: string
          source_name?: string | null
          state: string
        }
        Update: {
          as_seen_value?: Json | null
          assertion_key?: string
          buyer_session_id?: string
          content_hash?: string
          created_at?: string
          field?: string
          id?: string
          observed_at?: string | null
          property_id?: string | null
          schema_version?: string
          search_run_id?: string
          source_name?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_assertions_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_assertions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_assertions_search_run_id_fkey"
            columns: ["search_run_id"]
            isOneToOne: false
            referencedRelation: "search_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_reconciliation_events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          provider_source_id: string
          resolved_at: string | null
          severity: string
          source_record_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          provider_source_id: string
          resolved_at?: string | null
          severity: string
          source_record_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          provider_source_id?: string
          resolved_at?: string | null
          severity?: string
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_reconciliation_events_provider_source_id_fkey"
            columns: ["provider_source_id"]
            isOneToOne: false
            referencedRelation: "provider_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_records_staging: {
        Row: {
          content_hash: string
          id: string
          media_rights_confirmed: boolean
          normalized_payload: Json | null
          permit_number: string | null
          provider_source_id: string
          publication_ends_at: string
          published_at: string | null
          published_property_id: string | null
          raw_payload: Json
          received_at: string
          source_observed_at: string
          source_record_id: string
          status: string
          validated_at: string | null
          validation_errors: Json
        }
        Insert: {
          content_hash: string
          id?: string
          media_rights_confirmed?: boolean
          normalized_payload?: Json | null
          permit_number?: string | null
          provider_source_id: string
          publication_ends_at: string
          published_at?: string | null
          published_property_id?: string | null
          raw_payload: Json
          received_at?: string
          source_observed_at: string
          source_record_id: string
          status?: string
          validated_at?: string | null
          validation_errors?: Json
        }
        Update: {
          content_hash?: string
          id?: string
          media_rights_confirmed?: boolean
          normalized_payload?: Json | null
          permit_number?: string | null
          provider_source_id?: string
          publication_ends_at?: string
          published_at?: string | null
          published_property_id?: string | null
          raw_payload?: Json
          received_at?: string
          source_observed_at?: string
          source_record_id?: string
          status?: string
          validated_at?: string | null
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "provider_records_staging_provider_source_id_fkey"
            columns: ["provider_source_id"]
            isOneToOne: false
            referencedRelation: "provider_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_records_staging_published_property_id_fkey"
            columns: ["published_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_sources: {
        Row: {
          attribution: string
          created_at: string
          enabled: boolean
          external_provider_id: string
          geography: string[]
          id: string
          legal_owner: string | null
          maximum_freshness_hours: number
          organization_id: string
          publication_rights_status: string
          rights_expires_at: string | null
          rights_reviewed_at: string | null
          source_name: string
          updated_at: string
        }
        Insert: {
          attribution: string
          created_at?: string
          enabled?: boolean
          external_provider_id: string
          geography?: string[]
          id?: string
          legal_owner?: string | null
          maximum_freshness_hours?: number
          organization_id: string
          publication_rights_status?: string
          rights_expires_at?: string | null
          rights_reviewed_at?: string | null
          source_name: string
          updated_at?: string
        }
        Update: {
          attribution?: string
          created_at?: string
          enabled?: boolean
          external_provider_id?: string
          geography?: string[]
          id?: string
          legal_owner?: string | null
          maximum_freshness_hours?: number
          organization_id?: string
          publication_rights_status?: string
          rights_expires_at?: string | null
          rights_reviewed_at?: string | null
          source_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      developments: {
        Row: {
          community: string
          completion_status: string
          created_at: string
          created_by: string
          description: string | null
          developer_name: string | null
          emirate: string
          id: string
          name: string
          organization_id: string
          publication_ends_at: string | null
          publication_status: string
          published_at: string | null
          slug: string
          source_name: string | null
          source_updated_at: string | null
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          community: string
          completion_status?: string
          created_at?: string
          created_by: string
          description?: string | null
          developer_name?: string | null
          emirate?: string
          id?: string
          name: string
          organization_id: string
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          slug: string
          source_name?: string | null
          source_updated_at?: string | null
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          community?: string
          completion_status?: string
          created_at?: string
          created_by?: string
          description?: string | null
          developer_name?: string | null
          emirate?: string
          id?: string
          name?: string
          organization_id?: string
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          slug?: string
          source_name?: string | null
          source_updated_at?: string | null
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "developments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      floor_plans: {
        Row: {
          area_sq_ft: number | null
          baths: number | null
          beds: number | null
          created_at: string
          created_by: string
          development_id: string | null
          id: string
          image_alt: string
          image_url: string
          is_default: boolean
          name: string
          organization_id: string
          property_id: string | null
          publication_ends_at: string | null
          publication_status: string
          published_at: string | null
          source_name: string | null
          source_updated_at: string | null
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          area_sq_ft?: number | null
          baths?: number | null
          beds?: number | null
          created_at?: string
          created_by: string
          development_id?: string | null
          id?: string
          image_alt: string
          image_url: string
          is_default?: boolean
          name: string
          organization_id: string
          property_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          area_sq_ft?: number | null
          baths?: number | null
          beds?: number | null
          created_at?: string
          created_by?: string
          development_id?: string | null
          id?: string
          image_alt?: string
          image_url?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          property_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "floor_plans_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "floor_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          assigned_to: string | null
          buyer_session_id: string | null
          consent_at: string
          consent_destination: string | null
          consent_policy_version: string | null
          consent_purpose: string | null
          correlation_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          idempotency_key: string | null
          message: string | null
          organization_id: string | null
          phone: string | null
          property_id: string | null
          search_run_id: string | null
          session_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          buyer_session_id?: string | null
          consent_at: string
          consent_destination?: string | null
          consent_policy_version?: string | null
          consent_purpose?: string | null
          correlation_id?: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          idempotency_key?: string | null
          message?: string | null
          organization_id?: string | null
          phone?: string | null
          property_id?: string | null
          search_run_id?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          buyer_session_id?: string | null
          consent_at?: string
          consent_destination?: string | null
          consent_policy_version?: string | null
          consent_purpose?: string | null
          correlation_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          idempotency_key?: string | null
          message?: string | null
          organization_id?: string | null
          phone?: string | null
          property_id?: string | null
          search_run_id?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_search_run_id_fkey"
            columns: ["search_run_id"]
            isOneToOne: false
            referencedRelation: "search_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          invited_by: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          organization_id: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_plan_installments: {
        Row: {
          created_at: string
          due_event: string | null
          due_offset_months: number | null
          id: string
          label: string
          payment_plan_id: string
          percentage: number
          sequence_no: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_event?: string | null
          due_offset_months?: number | null
          id?: string
          label: string
          payment_plan_id: string
          percentage: number
          sequence_no: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_event?: string | null
          due_offset_months?: number | null
          id?: string
          label?: string
          payment_plan_id?: string
          percentage?: number
          sequence_no?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          development_id: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          property_id: string | null
          publication_ends_at: string | null
          publication_status: string
          published_at: string | null
          source_name: string | null
          source_updated_at: string | null
          total_percentage: number
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          development_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          property_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          total_percentage?: number
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          development_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          property_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          total_percentage?: number
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          amenities: string[]
          area_sq_ft: number
          availability_status: string
          baths: number
          beds: number
          completion_status: string
          created_at: string
          created_by: string | null
          description: string | null
          development_id: string | null
          feature: string
          furnishing_status: string | null
          handover_at: string | null
          id: string
          image_alt: string
          image_url: string
          location: string
          match_reason: string
          name: string
          organization_id: string | null
          price_aed: number
          property_type: string
          provider_source_id: string | null
          publication_ends_at: string | null
          publication_status: string
          published_at: string | null
          service_charge_aed: number | null
          slug: string | null
          source_name: string | null
          source_updated_at: string | null
          status: string
          tenure: string | null
          updated_at: string
          updated_by: string | null
          version: number
          view_types: string[]
        }
        Insert: {
          amenities?: string[]
          area_sq_ft: number
          availability_status?: string
          baths: number
          beds: number
          completion_status?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          development_id?: string | null
          feature: string
          furnishing_status?: string | null
          handover_at?: string | null
          id: string
          image_alt: string
          image_url: string
          location: string
          match_reason?: string
          name: string
          organization_id?: string | null
          price_aed: number
          property_type?: string
          provider_source_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          service_charge_aed?: number | null
          slug?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          status?: string
          tenure?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          view_types?: string[]
        }
        Update: {
          amenities?: string[]
          area_sq_ft?: number
          availability_status?: string
          baths?: number
          beds?: number
          completion_status?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          development_id?: string | null
          feature?: string
          furnishing_status?: string | null
          handover_at?: string | null
          id?: string
          image_alt?: string
          image_url?: string
          location?: string
          match_reason?: string
          name?: string
          organization_id?: string | null
          price_aed?: number
          property_type?: string
          provider_source_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          service_charge_aed?: number | null
          slug?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          status?: string
          tenure?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: number
          view_types?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "properties_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_provider_source_id_fkey"
            columns: ["provider_source_id"]
            isOneToOne: false
            referencedRelation: "provider_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      property_documents: {
        Row: {
          created_at: string
          created_by: string
          development_id: string | null
          document_type: string
          file_url: string
          id: string
          mime_type: string
          organization_id: string
          property_id: string | null
          publication_ends_at: string | null
          publication_status: string
          published_at: string | null
          source_name: string
          source_updated_at: string
          title: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          development_id?: string | null
          document_type: string
          file_url: string
          id?: string
          mime_type?: string
          organization_id: string
          property_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          source_name: string
          source_updated_at: string
          title: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          development_id?: string | null
          document_type?: string
          file_url?: string
          id?: string
          mime_type?: string
          organization_id?: string
          property_id?: string | null
          publication_ends_at?: string | null
          publication_status?: string
          published_at?: string | null
          source_name?: string
          source_updated_at?: string
          title?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      search_briefs: {
        Row: {
          brief: string
          created_at: string
          criteria: string[]
          id: string
          result_ids: string[]
          source: string
          user_id: string
        }
        Insert: {
          brief: string
          created_at?: string
          criteria?: string[]
          id?: string
          result_ids?: string[]
          source: string
          user_id: string
        }
        Update: {
          brief?: string
          created_at?: string
          criteria?: string[]
          id?: string
          result_ids?: string[]
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      search_candidates: {
        Row: {
          created_at: string
          fact_snapshot: Json
          property_id: string
          property_version: number | null
          rank: number
          reasons: string[]
          score: number | null
          search_run_id: string
          source_observed_at: string | null
        }
        Insert: {
          created_at?: string
          fact_snapshot?: Json
          property_id: string
          property_version?: number | null
          rank: number
          reasons?: string[]
          score?: number | null
          search_run_id: string
          source_observed_at?: string | null
        }
        Update: {
          created_at?: string
          fact_snapshot?: Json
          property_id?: string
          property_version?: number | null
          rank?: number
          reasons?: string[]
          score?: number | null
          search_run_id?: string
          source_observed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_candidates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_candidates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_candidates_search_run_id_fkey"
            columns: ["search_run_id"]
            isOneToOne: false
            referencedRelation: "search_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      search_runs: {
        Row: {
          buyer_session_id: string | null
          confirmation_key: string | null
          conversation_id: string | null
          correlation_id: string
          created_at: string
          id: string
          normalized_criteria: Json
          organization_id: string | null
          raw_brief: string
          result_count: number
          source: string
          status: string
          user_id: string | null
        }
        Insert: {
          buyer_session_id?: string | null
          confirmation_key?: string | null
          conversation_id?: string | null
          correlation_id?: string
          created_at?: string
          id?: string
          normalized_criteria?: Json
          organization_id?: string | null
          raw_brief: string
          result_count?: number
          source: string
          status?: string
          user_id?: string | null
        }
        Update: {
          buyer_session_id?: string | null
          confirmation_key?: string | null
          conversation_id?: string | null
          correlation_id?: string
          created_at?: string
          id?: string
          normalized_criteria?: Json
          organization_id?: string | null
          raw_brief?: string
          result_count?: number
          source?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_runs_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_runs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shortlist_items: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shortlist_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shortlist_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_property_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          arguments: Json
          buyer_session_id: string | null
          completed_at: string | null
          correlation_id: string
          created_at: string
          duration_ms: number | null
          id: string
          organization_id: string | null
          result_summary: Json | null
          session_id: string | null
          status: string
          tool_name: string
          user_id: string | null
        }
        Insert: {
          arguments?: Json
          buyer_session_id?: string | null
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          organization_id?: string | null
          result_summary?: Json | null
          session_id?: string | null
          status?: string
          tool_name: string
          user_id?: string | null
        }
        Update: {
          arguments?: Json
          buyer_session_id?: string | null
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          organization_id?: string | null
          result_summary?: Json | null
          session_id?: string | null
          status?: string
          tool_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_runs_buyer_session_id_fkey"
            columns: ["buyer_session_id"]
            isOneToOne: false
            referencedRelation: "buyer_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_property_catalog: {
        Row: {
          amenities: string[] | null
          area_sq_ft: number | null
          availability_status: string | null
          baths: number | null
          beds: number | null
          completion_status: string | null
          description: string | null
          development_id: string | null
          feature: string | null
          furnishing_status: string | null
          handover_at: string | null
          id: string | null
          image_alt: string | null
          image_url: string | null
          location: string | null
          match_reason: string | null
          name: string | null
          organization_id: string | null
          price_aed: number | null
          property_type: string | null
          publication_ends_at: string | null
          publication_status: string | null
          published_at: string | null
          service_charge_aed: number | null
          slug: string | null
          source_name: string | null
          source_updated_at: string | null
          status: string | null
          tenure: string | null
          updated_at: string | null
          version: number | null
          view_types: string[] | null
        }
        Insert: {
          amenities?: string[] | null
          area_sq_ft?: number | null
          availability_status?: string | null
          baths?: number | null
          beds?: number | null
          completion_status?: string | null
          description?: string | null
          development_id?: string | null
          feature?: string | null
          furnishing_status?: string | null
          handover_at?: string | null
          id?: string | null
          image_alt?: string | null
          image_url?: string | null
          location?: string | null
          match_reason?: string | null
          name?: string | null
          organization_id?: string | null
          price_aed?: number | null
          property_type?: string | null
          publication_ends_at?: string | null
          publication_status?: string | null
          published_at?: string | null
          service_charge_aed?: number | null
          slug?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          status?: string | null
          tenure?: string | null
          updated_at?: string | null
          version?: number | null
          view_types?: string[] | null
        }
        Update: {
          amenities?: string[] | null
          area_sq_ft?: number | null
          availability_status?: string | null
          baths?: number | null
          beds?: number | null
          completion_status?: string | null
          description?: string | null
          development_id?: string | null
          feature?: string | null
          furnishing_status?: string | null
          handover_at?: string | null
          id?: string | null
          image_alt?: string | null
          image_url?: string | null
          location?: string | null
          match_reason?: string | null
          name?: string | null
          organization_id?: string | null
          price_aed?: number | null
          property_type?: string | null
          publication_ends_at?: string | null
          publication_status?: string | null
          published_at?: string | null
          service_charge_aed?: number | null
          slug?: string | null
          source_name?: string | null
          source_updated_at?: string | null
          status?: string | null
          tenure?: string | null
          updated_at?: string | null
          version?: number | null
          view_types?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_advisor_evidence_feedback: {
        Args: {
          p_actor_id: string
          p_category: string
          p_inquiry_id: string
          p_notes: string
          p_outcome: string
        }
        Returns: string
      }
      append_buyer_ledger_event: {
        Args: {
          p_event_type: string
          p_idempotency_key: string
          p_property_id: string | null
          p_search_run_id: string
          p_summary: string
          p_token_hash: string
        }
        Returns: string
      }
      read_buyer_ledger_events: {
        Args: {
          p_search_run_id: string
          p_token_hash: string
        }
        Returns: {
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          summary: string
        }[]
      }
      bootstrap_staff_workspace: {
        Args: { p_name: string; p_slug: string }
        Returns: string
      }
      consume_api_rate_limit: {
        Args: {
          p_bucket_key: string
          p_max_requests: number
          p_scope: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      complete_buyer_deletion_challenge: {
        Args: {
          p_authorization_hash: string
          p_challenge_hash: string
          p_session_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      claim_processor_deletion_jobs: {
        Args: { p_lease_seconds?: number; p_limit?: number; p_worker_id: string }
        Returns: {
          attempt_count: number
          destination: string
          id: number
          processor_record_id: string | null
          request_id: string
          resource_reference: string
          resource_type: string
          lease_token: string
          lease_expires_at: string
        }[]
      }
      complete_processor_deletion_job: {
        Args: {
          p_job_id: number
          p_lease_token: string
          p_outcome: string
          p_processor_record_id?: string | null
          p_worker_id: string
        }
        Returns: boolean
      }
      create_buyer_deletion_challenge: {
        Args: { p_challenge_hash: string; p_user_id: string }
        Returns: string
      }
      delete_anonymous_buyer_data: {
        Args: { p_confirmation: string; p_token_hash: string }
        Returns: Json
      }
      delete_authenticated_buyer_data: {
        Args: {
          p_authorization_hash: string
          p_confirmation: string
          p_user_id: string
        }
        Returns: Json
      }
      enforce_buyer_data_retention: {
        Args: { p_apply?: boolean; p_as_of?: string }
        Returns: Json
      }
      export_anonymous_buyer_data: {
        Args: { p_token_hash: string }
        Returns: Json
      }
      export_authenticated_buyer_data: {
        Args: { p_user_id: string }
        Returns: Json
      }
      fail_processor_deletion_job: {
        Args: {
          p_error_code: string
          p_job_id: number
          p_lease_token: string
          p_retry_delay_seconds?: number
          p_worker_id: string
        }
        Returns: boolean
      }
      create_buyer_inquiry: {
        Args: {
          p_consent_purpose: string
          p_correlation_id: string
          p_destination: string
          p_email: string
          p_full_name: string
          p_idempotency_key: string
          p_message: string
          p_next_token_hash: string
          p_phone: string
          p_policy_version: string
          p_property_id: string
          p_search_run_id: string
          p_token_hash: string
        }
        Returns: string
      }
      persist_buyer_search: {
        Args: {
          p_candidates: Json
          p_correlation_id: string
          p_idempotency_key: string
          p_write_evidence_v2?: boolean
          p_model?: string
          p_normalized_criteria: Json
          p_raw_brief: string
          p_source: string
          p_token_hash: string
          p_ttl_seconds?: number
        }
        Returns: Json
      }
      publish_validated_provider_record: {
        Args: { p_staging_id: string }
        Returns: string
      }
      rotate_buyer_session: {
        Args: {
          p_current_token_hash: string
          p_mode?: string
          p_next_token_hash: string
          p_reason?: string
          p_ttl_seconds?: number
          p_user_id?: string | null
        }
        Returns: Json
      }
      transition_inquiry_service: {
        Args: {
          p_actor_id: string
          p_assigned_to?: string
          p_inquiry_id: string
          p_status: string
        }
        Returns: {
          assigned_to: string | null
          buyer_session_id: string | null
          consent_at: string
          consent_destination: string | null
          consent_policy_version: string | null
          consent_purpose: string | null
          correlation_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          idempotency_key: string | null
          message: string | null
          organization_id: string | null
          phone: string | null
          property_id: string | null
          search_run_id: string | null
          session_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "inquiries"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_operational_security_posture: {
        Args: Record<PropertyKey, never>
        Returns: {
          anon_select: boolean
          rls_enabled: boolean
          table_name: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
