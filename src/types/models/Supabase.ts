/**
 * @file Supabase.ts
 * @description Type definitions for Supabase database tables and operations
 * These types match the PostgreSQL schema in Supabase
 */

/**
 * Database table definitions matching Supabase schema
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID
          email: string;
          name: string;
          role: 'admin' | 'pm' | 'user';
          password_hash: string;
          created_at: string; // ISO timestamp
          updated_at: string; // ISO timestamp
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role: 'admin' | 'pm' | 'user';
          password_hash: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          role?: 'admin' | 'pm' | 'user';
          password_hash?: string;
          updated_at?: string;
        };
      };
      
      tenants: {
        Row: {
          id: string; // UUID
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          updated_at?: string;
        };
      };
      
      user_tenants: {
        Row: {
          user_id: string; // UUID
          tenant_id: string; // UUID
          created_at: string;
        };
        Insert: {
          user_id: string;
          tenant_id: string;
          created_at?: string;
        };
        Update: {
          // Junction table - no updates allowed
        };
      };
      
      products: {
        Row: {
          id: string; // UUID
          name: string;
          description: string | null;
          tenant_id: string; // UUID
          is_saved: boolean;
          saved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          tenant_id: string;
          is_saved?: boolean;
          saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          is_saved?: boolean;
          saved_at?: string;
          updated_at?: string;
        };
      };
      
      interfaces: {
        Row: {
          id: string; // UUID
          name: string;
          description: string | null;
          product_id: string | null; // UUID
          tenant_id: string; // UUID
          is_saved: boolean;
          saved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          product_id?: string;
          tenant_id: string;
          is_saved?: boolean;
          saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          product_id?: string;
          is_saved?: boolean;
          saved_at?: string;
          updated_at?: string;
        };
      };
      
      features: {
        Row: {
          id: string; // UUID
          name: string;
          priority: 'high' | 'medium' | 'low';
          description: string | null;
          interface_id: string | null; // UUID
          tenant_id: string; // UUID
          is_saved: boolean;
          saved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          priority: 'high' | 'medium' | 'low';
          description?: string;
          interface_id?: string;
          tenant_id: string;
          is_saved?: boolean;
          saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          priority?: 'high' | 'medium' | 'low';
          description?: string;
          interface_id?: string;
          is_saved?: boolean;
          saved_at?: string;
          updated_at?: string;
        };
      };
      
      releases: {
        Row: {
          id: string; // UUID
          name: string;
          description: string | null;
          release_date: string; // DATE in PostgreSQL
          priority: 'high' | 'medium' | 'low';
          feature_id: string | null; // UUID
          tenant_id: string; // UUID
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          release_date: string;
          priority: 'high' | 'medium' | 'low';
          feature_id?: string;
          tenant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          release_date?: string;
          priority?: 'high' | 'medium' | 'low';
          feature_id?: string;
          updated_at?: string;
        };
      };
      
      requirements: {
        Row: {
          id: string; // UUID
          name: string;
          owner: string | null;
          description: string | null;
          priority: 'high' | 'medium' | 'low' | null;
          feature_id: string; // UUID
          release_id: string | null; // UUID
          cuj: string | null;
          acceptance_criteria: string | null;
          tenant_id: string; // UUID
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner?: string;
          description?: string;
          priority?: 'high' | 'medium' | 'low';
          feature_id: string;
          release_id?: string;
          cuj?: string;
          acceptance_criteria?: string;
          tenant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          owner?: string;
          description?: string;
          priority?: 'high' | 'medium' | 'low' | null;
          feature_id?: string;
          release_id?: string;
          cuj?: string;
          acceptance_criteria?: string;
          updated_at?: string;
        };
      };
      
      documents: {
        Row: {
          id: string; // UUID
          title: string;
          content: any; // JSONB
          feature_id: string | null; // UUID
          release_id: string | null; // UUID
          requirement_id: string | null; // UUID
          tenant_id: string; // UUID
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: any;
          feature_id?: string;
          release_id?: string;
          requirement_id?: string;
          tenant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: any;
          feature_id?: string;
          release_id?: string;
          requirement_id?: string;
          updated_at?: string;
        };
      };
      
      attachments: {
        Row: {
          id: string; // UUID
          title: string;
          url: string;
          type: string;
          thumbnail_url: string | null;
          entity_id: string; // UUID
          entity_type: 'feature' | 'release' | 'requirement' | 'document';
          metadata: any | null; // JSONB
          tenant_id: string; // UUID
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          url: string;
          type: string;
          thumbnail_url?: string;
          entity_id: string;
          entity_type: 'feature' | 'release' | 'requirement' | 'document';
          metadata?: any;
          tenant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          url?: string;
          type?: string;
          thumbnail_url?: string;
          metadata?: any;
          updated_at?: string;
        };
      };
      
      tabs: {
        Row: {
          id: string; // UUID
          title: string;
          type: string;
          item_id: string; // UUID
          user_id: string; // UUID
          tenant_id: string; // UUID
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: string;
          item_id: string;
          user_id: string;
          tenant_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          type?: string;
          item_id?: string;
          updated_at?: string;
        };
      };
      
      active_tabs: {
        Row: {
          user_id: string; // UUID
          tab_id: string; // UUID
          tenant_id: string; // UUID
          updated_at: string;
        };
        Insert: {
          user_id: string;
          tab_id: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          tab_id?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      role_type: 'admin' | 'pm' | 'user';
      priority_level: 'high' | 'medium' | 'low';
      entity_type: 'feature' | 'release' | 'requirement' | 'document';
    };
  };
}

// Type helpers for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T];
export type Row<T extends keyof Database['public']['Tables']> = Tables<T>['Row'];
export type Insert<T extends keyof Database['public']['Tables']> = Tables<T>['Insert'];
export type Update<T extends keyof Database['public']['Tables']> = Tables<T>['Update'];