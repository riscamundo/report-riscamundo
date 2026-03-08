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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anuncios: {
        Row: {
          cliente_id: string
          cliques: number | null
          conversoes: number | null
          created_at: string
          custo_total: number | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          impressoes: number | null
          investimento: number
          observacoes: string | null
          palavras_chave: string[] | null
          plataforma: string
          status: string
          tipo_anuncio: string
          titulo: string
          updated_at: string
          url_destino: string | null
        }
        Insert: {
          cliente_id: string
          cliques?: number | null
          conversoes?: number | null
          created_at?: string
          custo_total?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          impressoes?: number | null
          investimento?: number
          observacoes?: string | null
          palavras_chave?: string[] | null
          plataforma: string
          status?: string
          tipo_anuncio: string
          titulo: string
          updated_at?: string
          url_destino?: string | null
        }
        Update: {
          cliente_id?: string
          cliques?: number | null
          conversoes?: number | null
          created_at?: string
          custo_total?: number | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          impressoes?: number | null
          investimento?: number
          observacoes?: string | null
          palavras_chave?: string[] | null
          plataforma?: string
          status?: string
          tipo_anuncio?: string
          titulo?: string
          updated_at?: string
          url_destino?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anuncios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          canal: string
          created_at: string
          id: string
          investimento: number
          nome_campanha: string
          periodo_fim: string | null
          periodo_inicio: string | null
          procedimento_foco: string | null
          status: string
          updated_at: string
        }
        Insert: {
          canal: string
          created_at?: string
          id?: string
          investimento?: number
          nome_campanha: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          procedimento_foco?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          canal?: string
          created_at?: string
          id?: string
          investimento?: number
          nome_campanha?: string
          periodo_fim?: string | null
          periodo_inicio?: string | null
          procedimento_foco?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_procedimento_foco_fkey"
            columns: ["procedimento_foco"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          razao_social: string | null
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          razao_social?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          razao_social?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      equipe_members: {
        Row: {
          created_at: string
          equipe_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          equipe_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          equipe_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipe_members_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          created_at: string
          gestor_id: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gestor_id: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gestor_id?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          campanha_id: string | null
          created_at: string
          created_by: string | null
          id: string
          nivel_interesse: string
          nome: string
          origem: string | null
          procedimento_interesse: string | null
          status_funil: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nivel_interesse?: string
          nome: string
          origem?: string | null
          procedimento_interesse?: string | null
          status_funil?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          campanha_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nivel_interesse?: string
          nome?: string
          origem?: string | null
          procedimento_interesse?: string | null
          status_funil?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_procedimento_interesse_fkey"
            columns: ["procedimento_interesse"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_reports: {
        Row: {
          cliente_id: string
          cliques_ads: number | null
          conversoes_ads: number | null
          created_at: string
          custo_ads: number | null
          engajamento_rate: number | null
          id: string
          impressoes_ads: number | null
          leads_gerados: number | null
          leads_qualificados: number | null
          novos_seguidores: number | null
          observacoes: string | null
          palavras_chave_top10: number | null
          periodo_mes: string
          posts_publicados: number | null
          seguidores_total: number | null
          updated_at: string
          visitas_organicas: number | null
          visitas_pagas: number | null
          visitas_site: number | null
        }
        Insert: {
          cliente_id: string
          cliques_ads?: number | null
          conversoes_ads?: number | null
          created_at?: string
          custo_ads?: number | null
          engajamento_rate?: number | null
          id?: string
          impressoes_ads?: number | null
          leads_gerados?: number | null
          leads_qualificados?: number | null
          novos_seguidores?: number | null
          observacoes?: string | null
          palavras_chave_top10?: number | null
          periodo_mes: string
          posts_publicados?: number | null
          seguidores_total?: number | null
          updated_at?: string
          visitas_organicas?: number | null
          visitas_pagas?: number | null
          visitas_site?: number | null
        }
        Update: {
          cliente_id?: string
          cliques_ads?: number | null
          conversoes_ads?: number | null
          created_at?: string
          custo_ads?: number | null
          engajamento_rate?: number | null
          id?: string
          impressoes_ads?: number | null
          leads_gerados?: number | null
          leads_qualificados?: number | null
          novos_seguidores?: number | null
          observacoes?: string | null
          palavras_chave_top10?: number | null
          periodo_mes?: string
          posts_publicados?: number | null
          seguidores_total?: number | null
          updated_at?: string
          visitas_organicas?: number | null
          visitas_pagas?: number | null
          visitas_site?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_reports_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimentos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          margem_estimada: number
          nome_procedimento: string
          prioridade_vendas: string
          status: string
          ticket_medio: number
          updated_at: string
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          margem_estimada?: number
          nome_procedimento: string
          prioridade_vendas?: string
          status?: string
          ticket_medio?: number
          updated_at?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          margem_estimada?: number
          nome_procedimento?: string
          prioridade_vendas?: string
          status?: string
          ticket_medio?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          cliente_id: string
          created_at: string
          dificuldade: string | null
          id: string
          palavra_chave: string
          posicao_anterior: number | null
          posicao_atual: number | null
          status: string | null
          updated_at: string
          url_rankeada: string | null
          volume_busca: number | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          dificuldade?: string | null
          id?: string
          palavra_chave: string
          posicao_anterior?: number | null
          posicao_atual?: number | null
          status?: string | null
          updated_at?: string
          url_rankeada?: string | null
          volume_busca?: number | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          dificuldade?: string | null
          id?: string
          palavra_chave?: string
          posicao_anterior?: number | null
          posicao_atual?: number | null
          status?: string | null
          updated_at?: string
          url_rankeada?: string | null
          volume_busca?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_keywords_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_pages: {
        Row: {
          cliente_id: string
          cliques: number | null
          created_at: string
          ctr: number | null
          id: string
          impressoes: number | null
          periodo_mes: string
          posicao_media: number | null
          status: string | null
          taxa_rejeicao: number | null
          tempo_medio_pagina: string | null
          titulo: string
          updated_at: string
          url: string
          visitas_mes: number | null
          visitas_mes_anterior: number | null
        }
        Insert: {
          cliente_id: string
          cliques?: number | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressoes?: number | null
          periodo_mes?: string
          posicao_media?: number | null
          status?: string | null
          taxa_rejeicao?: number | null
          tempo_medio_pagina?: string | null
          titulo: string
          updated_at?: string
          url: string
          visitas_mes?: number | null
          visitas_mes_anterior?: number | null
        }
        Update: {
          cliente_id?: string
          cliques?: number | null
          created_at?: string
          ctr?: number | null
          id?: string
          impressoes?: number | null
          periodo_mes?: string
          posicao_media?: number | null
          status?: string | null
          taxa_rejeicao?: number | null
          tempo_medio_pagina?: string | null
          titulo?: string
          updated_at?: string
          url?: string
          visitas_mes?: number | null
          visitas_mes_anterior?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_pages_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_cliente: {
        Row: {
          cliente_id: string
          created_at: string
          descricao: string | null
          id: string
          prioridade: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendas: {
        Row: {
          created_at: string
          data_venda: string
          forma_pagamento: string | null
          id: string
          lead_id: string | null
          procedimento_vendido: string | null
          status: string
          updated_at: string
          valor_venda: number
          vendedor: string | null
        }
        Insert: {
          created_at?: string
          data_venda?: string
          forma_pagamento?: string | null
          id?: string
          lead_id?: string | null
          procedimento_vendido?: string | null
          status?: string
          updated_at?: string
          valor_venda?: number
          vendedor?: string | null
        }
        Update: {
          created_at?: string
          data_venda?: string
          forma_pagamento?: string | null
          id?: string
          lead_id?: string | null
          procedimento_vendido?: string | null
          status?: string
          updated_at?: string
          valor_venda?: number
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendas_procedimento_vendido_fkey"
            columns: ["procedimento_vendido"]
            isOneToOne: false
            referencedRelation: "procedimentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vendas_cliente: {
        Row: {
          categoria: string | null
          data_venda: string | null
          forma_pagamento: string | null
          id: string | null
          nome_procedimento: string | null
          status: string | null
          valor_venda: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_same_equipe: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      is_gestor_of: {
        Args: { _gestor_id: string; _member_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "gestor" | "equipe" | "cliente"
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
      app_role: ["master", "gestor", "equipe", "cliente"],
    },
  },
} as const
