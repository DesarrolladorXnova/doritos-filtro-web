// Configuración compartida entre la página del cliente (index.html)
// y la página de pruebas Push-to-Web (dev.html).

// Cambia a true cuando Snap apruebe la app y pega el token de Production abajo.
export const USE_PRODUCTION = false;

export const STAGING_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzkxOTA3ODM3LCJzdWIiOiI4ZDgwYjMxNS1iNjk1LTRkMGEtYjM3NC0xYjc5NjlmYTUwYTl-U1RBR0lOR34zMzY2ZDE2NC02NjgzLTRmMDktYmZhOS0yOTBhMWVmMmJmYzEifQ.NcHagxB6aa_vf3LnIS1nNMbH2zi5HsATd32se8oqKDg';
export const PRODUCTION_API_TOKEN = 'PEGA_AQUI_EL_TOKEN_DE_PRODUCTION';

export const LENS_GROUP_ID = 'b22f656b-6703-4d84-bffb-de04b99f8f6e';
export const LENS_ID = '4724530d-4b41-4868-a856-7b5c3f4f5deb';

// ===== Solo para la página de pruebas Push-to-Web (dev.html) =====
// OAuth Client ID de STAGING de Login Kit (portal de Snap Kit → app "Doritos Web Ar").
export const LOGIN_KIT_STAGING_CLIENT_ID = 'b37debec-2183-4b51-b3b6-957e9effec9a';
// Debe coincidir EXACTAMENTE con el Redirect URI registrado en el portal.
export const LOGIN_KIT_REDIRECT_URI = 'https://desarrolladorxnova.github.io/doritos-filtro-web/dev.html';
