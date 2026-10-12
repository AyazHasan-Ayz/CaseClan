/** Add a design here and its images under public/. All storefront sections share this source. */
export type CaseDesign = {
 id:string;name:string;slug:string;shortDescription:string;price:number;compareAtPrice?:number;
 images:string[];category:string;tags:string[];compatiblePhones:string[];featured:boolean;bestSeller:boolean;active:boolean;createdAt:string;
 description?:string;material?:string;style?:string;imageDevice?:string;
 /** Existing database-managed products retain their live availability/pricing. Omit for new file designs. */
 managedRemotely?:boolean;
};
export const designs:CaseDesign[] = [
  {
    "id": "minimal-name",
    "name": "Minimal Name Case",
    "slug": "minimal-name",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 1299,
    "images": [
      "/assets/designs/minimal-name.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Minimal Name"
    ],
    "compatiblePhones": [
      "iPhone 17",
      "iPhone 17 Pro",
      "iPhone 17 Pro Max",
      "iPhone 16",
      "iPhone 16 Plus",
      "iPhone 16 Pro",
      "iPhone 16 Pro Max",
      "iPhone 15",
      "iPhone 15 Plus",
      "iPhone 15 Pro",
      "iPhone 15 Pro Max"
    ],
    "featured": true,
    "bestSeller": true,
    "active": true,
    "createdAt": "2026-09-01T00:00:00.000Z",
    "style": "Minimal Name",
    "imageDevice": "iphone-17",
    "managedRemotely": true
  },
  {
    "id": "signature-style",
    "name": "Signature Style Case",
    "slug": "signature-style",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 1499,
    "images": [
      "/assets/designs/signature-style.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Signature Style"
    ],
    "compatiblePhones": [
      "iphone-17",
      "iphone-17-pro",
      "iphone-17-pro-max",
      "iphone-16",
      "iphone-16-plus",
      "iphone-16-pro",
      "iphone-16-pro-max",
      "iphone-15",
      "iphone-15-plus",
      "iphone-15-pro",
      "iphone-15-pro-max"
    ],
    "featured": true,
    "bestSeller": true,
    "active": true,
    "createdAt": "2026-09-29T17:21:02.491995+00:00",
    "style": "Signature Style",
    "imageDevice": "iphone-17-pro",
    "managedRemotely": true,
    "material": "Premium printed case"
  },
  {
    "id": "initial-name",
    "name": "Initial + Name Case",
    "slug": "initial-name",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 1499,
    "images": [
      "/assets/designs/initial-name.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Initial + Name"
    ],
    "compatiblePhones": [
      "iphone-17",
      "iphone-17-pro",
      "iphone-17-pro-max",
      "iphone-16",
      "iphone-16-plus",
      "iphone-16-pro",
      "iphone-16-pro-max",
      "iphone-15",
      "iphone-15-plus",
      "iphone-15-pro",
      "iphone-15-pro-max"
    ],
    "featured": true,
    "bestSeller": false,
    "active": true,
    "createdAt": "2026-09-29T17:21:02.491995+00:00",
    "style": "Initial + Name",
    "imageDevice": "iphone-17-pro-max",
    "managedRemotely": true,
    "material": "Premium printed case"
  },
  {
    "id": "word-cloud",
    "name": "Word Cloud Case",
    "slug": "word-cloud",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 1699,
    "images": [
      "/assets/designs/word-cloud.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Word Cloud"
    ],
    "compatiblePhones": [
      "iphone-17",
      "iphone-17-pro",
      "iphone-17-pro-max",
      "iphone-16",
      "iphone-16-plus",
      "iphone-16-pro",
      "iphone-16-pro-max",
      "iphone-15",
      "iphone-15-plus",
      "iphone-15-pro",
      "iphone-15-pro-max"
    ],
    "featured": false,
    "bestSeller": false,
    "active": true,
    "createdAt": "2026-09-29T17:21:02.491995+00:00",
    "style": "Word Cloud",
    "imageDevice": "iphone-16",
    "managedRemotely": true,
    "material": "Premium printed case"
  },
  {
    "id": "photo-collage",
    "name": "Photo Collage Case",
    "slug": "photo-collage",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 1799,
    "images": [
      "/assets/designs/photo-collage.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Photo Collage"
    ],
    "compatiblePhones": [
      "iPhone 17",
      "iPhone 17 Pro",
      "iPhone 17 Pro Max",
      "iPhone 16",
      "iPhone 16 Plus",
      "iPhone 16 Pro",
      "iPhone 16 Pro Max",
      "iPhone 15",
      "iPhone 15 Plus",
      "iPhone 15 Pro",
      "iPhone 15 Pro Max"
    ],
    "featured": false,
    "bestSeller": false,
    "active": true,
    "createdAt": "2026-09-01T00:00:00.000Z",
    "style": "Photo Collage",
    "imageDevice": "iphone-16-plus",
    "managedRemotely": true
  },
  {
    "id": "ayaz-word-cloud",
    "name": "Ayaz Word Cloud Case",
    "slug": "ayaz-word-cloud",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 1699,
    "images": [
      "/assets/designs/word-cloud.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Word Cloud"
    ],
    "compatiblePhones": [
      "iphone-17",
      "iphone-17-pro",
      "iphone-17-pro-max",
      "iphone-16",
      "iphone-16-plus",
      "iphone-16-pro",
      "iphone-16-pro-max",
      "iphone-15",
      "iphone-15-plus",
      "iphone-15-pro",
      "iphone-15-pro-max"
    ],
    "featured": false,
    "bestSeller": false,
    "active": true,
    "createdAt": "2026-09-29T17:21:02.491995+00:00",
    "style": "Word Cloud",
    "imageDevice": "iphone-16-pro",
    "managedRemotely": true,
    "material": "Premium printed case"
  },
  {
    "id": "mercedes-collage-clear-case",
    "name": "Mercedes Collage Clear Case",
    "slug": "mercedes-collage-clear-case",
    "shortDescription": "Premium clear protective case with a bold Mercedes-inspired collage design and raised camera protection.",
    "price": 599,
    "compareAtPrice": 999,
    "images": [
      "https://ftjucooznvhpdcjsfngr.supabase.co/storage/v1/object/public/product-images/catalog/initial-name/4c721f8e-53da-4ffd-a081-86a48e399a67.webp",
      "https://ftjucooznvhpdcjsfngr.supabase.co/storage/v1/object/public/product-images/catalog/mercedes-collage-clear-case/914e2114-6f02-4579-8461-ccc0b8462b10.webp",
      "https://ftjucooznvhpdcjsfngr.supabase.co/storage/v1/object/public/product-images/catalog/mercedes-collage-clear-case/0bcc325e-3f7c-41c3-bd27-2c8c6cad52a9.webp",
      "https://ftjucooznvhpdcjsfngr.supabase.co/storage/v1/object/public/product-images/catalog/mercedes-collage-clear-case/a037c30e-198a-4a16-835b-7b9a4aa0b08e.webp",
      "https://ftjucooznvhpdcjsfngr.supabase.co/storage/v1/object/public/product-images/catalog/mercedes-collage-clear-case/e9f8621a-d8e7-490c-a9ff-7c25ff73d011.webp",
      "https://ftjucooznvhpdcjsfngr.supabase.co/storage/v1/object/public/product-images/catalog/mercedes-collage-clear-case/6f48a8ce-947e-440d-bd2e-e1e9515e7008.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Initial + Name"
    ],
    "compatiblePhones": [
      "iphone-17",
      "iphone-17-pro",
      "iphone-17-pro-max",
      "iphone-16",
      "iphone-16-plus",
      "iphone-16-pro",
      "iphone-16-pro-max",
      "iphone-15",
      "iphone-15-plus",
      "iphone-15-pro",
      "iphone-15-pro-max"
    ],
    "featured": false,
    "bestSeller": false,
    "active": true,
    "createdAt": "2026-10-06T14:43:45.384443+00:00",
    "style": "Initial + Name",
    "imageDevice": "iphone-17-pro-max",
    "description": "A premium clear phone case designed for those who like bold automotive-inspired aesthetics.\n\nFeatures:\n• Premium transparent protective shell\n• Raised camera lip\n• Shock-absorbing corners\n• Precise button and port cutouts\n• High-quality printed back design\n• Slim and lightweight profile\n\nDesigned for everyday protection without compromising style.",
    "material": "Premium printed case",
    "managedRemotely": true
  },
  {
    "id": "catalog-verification-20261006",
    "name": "Catalog verification - not for sale",
    "slug": "catalog-verification-20261006",
    "shortDescription": "Finished artwork, fitted to your phone.",
    "price": 599,
    "images": [
      "/assets/designs/minimal-name.webp"
    ],
    "category": "Ready Designs",
    "tags": [
      "Minimal Name"
    ],
    "compatiblePhones": [
      "iphone-17",
      "iphone-17-pro",
      "iphone-17-pro-max",
      "iphone-16",
      "iphone-16-plus",
      "iphone-16-pro",
      "iphone-16-pro-max",
      "iphone-15",
      "iphone-15-plus",
      "iphone-15-pro",
      "iphone-15-pro-max"
    ],
    "featured": true,
    "bestSeller": true,
    "active": true,
    "createdAt": "2026-10-06T14:23:32.645412+00:00",
    "style": "Minimal Name",
    "imageDevice": "iphone-17",
    "material": "Premium printed case",
    "managedRemotely": true
  }
];
