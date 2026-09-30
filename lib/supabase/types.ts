export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type Timestamped = { created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      products: Table<Timestamped & { id: string; slug: string; name: string; description: string | null; short_description: string | null; kind: 'ready' | 'custom'; status: 'draft' | 'active' | 'archived'; price: number; compare_at_price: number | null; cost_price: number | null; sku: string | null; material: string | null; collection: string | null; artwork_locked: boolean; metadata: Json }>;
      product_images: Table<{ id: string; product_id: string; storage_path: string; alt_text: string | null; sort_order: number; is_primary: boolean; created_at: string }>;
      phone_models: Table<Timestamped & { id: string; slug: string; name: string; brand: string; status: 'active' | 'inactive'; display_order: number; base_mockup_path: string | null; case_overlay_path: string | null; highlight_overlay_path: string | null; shadow_overlay_path: string | null; print_mask_path: string | null; camera_mask_path: string | null; print_area: Json; safe_area: Json; camera_exclusion: Json; metadata: Json }>;
      product_phone_models: Table<{ product_id: string; phone_model_id: string; sku: string | null; price_override: number | null; available: boolean; created_at: string }>;
      customers: Table<Timestamped & { id: string; email: string | null; phone: string | null; full_name: string | null; role: 'customer' | 'owner' | 'admin' | 'staff'; metadata: Json }>;
      addresses: Table<Timestamped & { id: string; customer_id: string; label: string | null; recipient_name: string; phone: string; line1: string; line2: string | null; landmark: string | null; city: string; state: string; postal_code: string; country_code: string; is_default: boolean }>;
      orders: Table<Timestamped & { id: string; order_number: number; customer_id: string | null; guest_email: string | null; status: string; payment_status: string; payment_method: string | null; currency: string; subtotal: number; shipping_amount: number; discount_amount: number; cod_fee: number; total: number; shipping_address: Json; tracking_id: string | null; courier: string | null; admin_note: string | null; metadata: Json }>;
      order_items: Table<{ id: string; order_id: string; product_id: string | null; phone_model_id: string | null; product_name: string; sku: string | null; quantity: number; unit_price: number; fixed_design_id: string | null; item_type: 'ready-design' | 'custom-case'; metadata: Json; created_at: string }>;
      customizations: Table<Timestamped & { id: string; order_item_id: string; customer_id: string | null; design_state: Json; customer_upload_paths: string[]; preview_path: string | null; print_ready_path: string | null; status: string; metadata: Json }>;
      coupons: Table<Timestamped & { id: string; code: string; discount_type: 'percentage' | 'fixed'; value: number; minimum_cart_value: number; usage_limit: number | null; usage_count: number; starts_at: string | null; ends_at: string | null; active: boolean; metadata: Json }>;
      reviews: Table<Timestamped & { id: string; product_id: string; customer_id: string; rating: number; title: string | null; body: string | null; status: 'pending' | 'approved' | 'hidden'; verified_purchase: boolean }>;
      store_settings: Table<Timestamped & { key: string; value: Json; is_public: boolean }>;
    };
    Views: Record<string, never>;
    Functions: {
      place_order: { Args: { payload: Json }; Returns: { id:string; order_number:string; status:string; payment_status:string; subtotal:number; shipping_amount:number; cod_fee:number; total:number } };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
