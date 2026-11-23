export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "business_owner" | "super_admin";

export type BookingStatus = "pending" | "confirmed" | "blocked" | "cancelled";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
};

export type BusinessRow = {
  id: string;
  name: string;
  zone: string | null;
  maps_url: string | null;
  phone: string | null;
  cover_image_url: string | null;
  amenities: Json;
  cancellation_policy: string | null;
  is_active: boolean;
  created_at: string;
  owner_id: string | null;
};

export type ServiceRow = {
  id: string;
  business_id: string;
  name: string;
  price: number;
  slot_duration_minutes: number;
  is_roofed: boolean;
  is_active: boolean;
  created_at: string;
};

export type ScheduleRow = {
  id: string;
  service_id: string;
  day_of_week: number; // 0 = domingo ... 6 = sábado
  open_time: string; // formato HH:MM:SS
  close_time: string; // formato HH:MM:SS
  is_closed: boolean;
};

export type BookingRow = {
  id: string;
  service_id: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  start_time: string; // timestamptz ISO
  end_time: string; // timestamptz ISO
  status: BookingStatus;
  total_price: number | null;
  notes: string | null;
  created_at: string;
};

export type MyCustomerRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
};

export type BusySlotRow = {
  slot_start: string;
  slot_end: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
        };
        Relationships: [];
      };
      businesses: {
        Row: BusinessRow;
        Insert: {
          id?: string;
          name: string;
          zone?: string | null;
          maps_url?: string | null;
          phone?: string | null;
          cover_image_url?: string | null;
          amenities?: Json;
          cancellation_policy?: string | null;
          is_active?: boolean;
          created_at?: string;
          owner_id?: string | null;
        };
        Update: {
          name?: string;
          zone?: string | null;
          maps_url?: string | null;
          phone?: string | null;
          cover_image_url?: string | null;
          amenities?: Json;
          cancellation_policy?: string | null;
          is_active?: boolean;
          owner_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: ServiceRow;
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          price: number;
          slot_duration_minutes?: number;
          is_roofed?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          price?: number;
          slot_duration_minutes?: number;
          is_roofed?: boolean;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: ScheduleRow;
        Insert: {
          id?: string;
          service_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed?: boolean;
        };
        Update: {
          day_of_week?: number;
          open_time?: string;
          close_time?: string;
          is_closed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: BookingRow;
        Insert: {
          id?: string;
          service_id: string;
          customer_id?: string | null;
          guest_name?: string | null;
          guest_phone?: string | null;
          start_time: string;
          end_time: string;
          status: BookingStatus;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          // Por reglas de BD/RLS, solo se puede actualizar status en reservas existentes
          status: BookingStatus;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      my_customers: {
        Row: MyCustomerRow;
        Relationships: [];
      };
    };
    Functions: {
      get_busy_slots: {
        Args: {
          p_service_id: string;
          p_from: string;
          p_to: string;
        };
        Returns: BusySlotRow[];
      };
    };
    Enums: {
      user_role: UserRole;
      booking_status: BookingStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};

export function parseAmenities(amenities: Json | null | undefined): string[] {
  if (!Array.isArray(amenities)) {
    return [];
  }
  return amenities
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
