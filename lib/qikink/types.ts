export type QikinkGateway = 'COD' | 'Prepaid';

export type QikinkDesign = { design_code: string; width_inches: string; height_inches: string; placement_sku: string; design_link: string; mockup_link: string };
export type QikinkLineItem =
  | { search_from_my_products: 0; quantity: string; print_type_id: number; price: string; sku: string; designs: QikinkDesign[] }
  | { search_from_my_products: 1; quantity: string; price: string; sku: string };
export type QikinkShippingAddress = { first_name: string; last_name: string; address1: string; address2: string; phone: string; email: string; city: string; zip: string; province: string; country_code: 'IN' };
export type QikinkOrderPayload = { order_number: string; qikink_shipping: '1'; gateway: QikinkGateway; total_order_value: string; line_items: QikinkLineItem[]; shipping_address: QikinkShippingAddress };

export type CaseClanFulfillmentOrder = {
  orderId: string;
  paymentMethod: 'cod' | 'prepaid' | 'upi' | 'card';
  total: number;
  shippingAddress: { firstName: string; lastName?: string; address1: string; address2?: string; phone: string; email: string; city: string; postalCode: string; state: string };
  items: Array<{ qikinkSku: string; quantity: number; price: number; printTypeId: number; designCode: string; placementSku: string; printArtworkUrl: string; previewUrl: string }>;
};

export type QikinkApiResponse = Record<string, unknown>;
