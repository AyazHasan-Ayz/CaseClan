import type { CaseClanFulfillmentOrder, QikinkOrderPayload } from './types';

const money = (value: number) => {
  if (!Number.isFinite(value) || value < 0) throw new Error('Qikink monetary values must be non-negative numbers.');
  return value.toFixed(2).replace(/\.00$/, '');
};

const positiveInteger = (value: number, field: string) => {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${field} must be a positive integer.`);
  return String(value);
};

const publicHttpsUrl = (value: string, field: string) => {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${field} must be a valid URL.`); }
  if (url.protocol !== 'https:') throw new Error(`${field} must use HTTPS.`);
  if (['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error(`${field} must be publicly reachable.`);
  return url.toString();
};

/** Qikink accepts at most 15 alphanumeric characters for the merchant order number. */
export function qikinkOrderNumber(orderId: string) {
  const normalized = orderId.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) throw new Error('A CASECLAN order ID is required.');
  return normalized.length <= 15 ? normalized : `CC${normalized.slice(-13)}`;
}

export function buildQikinkOrderPayload(order: CaseClanFulfillmentOrder): QikinkOrderPayload {
  if (!order.items.length) throw new Error('At least one order item is required.');
  if (!/^\d{6}$/.test(order.shippingAddress.postalCode)) throw new Error('Shipping PIN code must contain 6 digits.');
  if (!/^\d{10}$/.test(order.shippingAddress.phone.replace(/\D/g, '').slice(-10))) throw new Error('Shipping phone must contain 10 digits.');

  return {
    order_number: qikinkOrderNumber(order.orderId), qikink_shipping: '1', gateway: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid', total_order_value: money(order.total),
    line_items: order.items.map((item, index) => {
      if (!item.qikinkSku.trim()) throw new Error(`Missing Qikink Store SKU for item ${index + 1}.`);
      if (!Number.isInteger(item.printTypeId) || item.printTypeId < 1) throw new Error(`Invalid Qikink print type for item ${index + 1}.`);
      return { search_from_my_products: 0, quantity: positiveInteger(item.quantity, `Item ${index + 1} quantity`), print_type_id: item.printTypeId, price: money(item.price), sku: item.qikinkSku.trim(), designs: [{ design_code: item.designCode.trim() || `CC${index + 1}`, width_inches: '', height_inches: '', placement_sku: item.placementSku, design_link: publicHttpsUrl(item.printArtworkUrl, `Item ${index + 1} print artwork URL`), mockup_link: publicHttpsUrl(item.previewUrl, `Item ${index + 1} preview URL`) }] };
    }),
    shipping_address: { first_name: order.shippingAddress.firstName, last_name: order.shippingAddress.lastName || '', address1: order.shippingAddress.address1, address2: order.shippingAddress.address2 || '', phone: order.shippingAddress.phone.replace(/\D/g, '').slice(-10), email: order.shippingAddress.email, city: order.shippingAddress.city, zip: order.shippingAddress.postalCode, province: order.shippingAddress.state, country_code: 'IN' },
  };
}

/** Store SKUs already own their artwork in Qikink My Products; its API rejects design fields for this mode. */
export function buildQikinkStoreOrderPayload(order: CaseClanFulfillmentOrder): QikinkOrderPayload {
  const direct = buildQikinkOrderPayload(order);
  return {
    ...direct,
    line_items: direct.line_items.map(item => ({
      search_from_my_products: 1,
      quantity: item.quantity,
      price: item.price,
      sku: item.sku,
    })),
  };
}
