const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const baseUrl = required('QIKINK_SANDBOX_BASE_URL');
if (process.env.QIKINK_ENVIRONMENT !== 'sandbox' || baseUrl !== 'https://sandbox.qikink.com') {
  throw new Error('Diagnostic is locked to the Qikink sandbox.');
}

const clientId = required('QIKINK_SANDBOX_CLIENT_ID');
const clientSecret = required('QIKINK_SANDBOX_CLIENT_SECRET');
const models = [
  ['iPhone 17', 'QIKINK_SANDBOX_PHONE_SKU_IPHONE_17', 'CC171001A'],
  ['iPhone 17 Pro', 'QIKINK_SANDBOX_PHONE_SKU_IPHONE_17_PRO', 'CC171001B'],
  ['iPhone 17 Pro Max', 'QIKINK_SANDBOX_PHONE_SKU_IPHONE_17_PRO_MAX', 'CC171001C'],
];

const tokenResponse = await fetch(`${baseUrl}/api/token`, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ ClientId: clientId, client_secret: clientSecret }),
});
const tokenBody = await tokenResponse.json();
if (!tokenResponse.ok || !tokenBody.Accesstoken) {
  throw new Error(`Token request failed with HTTP ${tokenResponse.status}: ${JSON.stringify(tokenBody)}`);
}

for (const [model, envName, orderNumber] of models) {
  const payload = {
    order_number: orderNumber,
    qikink_shipping: '1',
    gateway: 'Prepaid',
    total_order_value: '1299',
    line_items: [{
      search_from_my_products: 1,
      quantity: '1',
      price: '1299',
      sku: required(envName),
    }],
    shipping_address: {
      first_name: 'CASECLAN',
      last_name: 'Sandbox',
      address1: 'Test Address',
      address2: '',
      phone: '9999999999',
      email: 'sandbox@caseclan.test',
      city: 'Chennai',
      zip: '600001',
      province: 'Tamil Nadu',
      country_code: 'IN',
    },
  };

  const response = await fetch(`${baseUrl}/api/order/create`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ClientId: clientId,
      Accesstoken: tokenBody.Accesstoken,
    },
    body: JSON.stringify(payload),
  });
  const responseText = await response.text();
  let responseBody;
  try { responseBody = JSON.parse(responseText); } catch { responseBody = responseText; }
  console.log(JSON.stringify({ model, orderNumber, httpStatus: response.status, response: responseBody }));
}
