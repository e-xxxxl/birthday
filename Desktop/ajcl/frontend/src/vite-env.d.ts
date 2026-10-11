/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_PAYSTACK_CURRENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
