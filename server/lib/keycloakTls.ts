let configured = false;

function isTrue(value?: string): boolean {
  return ['1', 'true', 'yes', 'on'].includes((value || '').trim().toLowerCase());
}

export function configureKeycloakTls() {
  if (configured) return;
  configured = true;

  if (isTrue(process.env.KEYCLOAK_TLS_INSECURE)) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    console.warn('[keycloak] TLS certificate verification disabled (KEYCLOAK_TLS_INSECURE=true)');
  }
}
