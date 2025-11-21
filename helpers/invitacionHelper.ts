// JUAN-MODIFICACION: Helper para validaciones de invitaciones (HU40)

export function validarCorreo(email: string): boolean {
  if (!email || email.trim() === "") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function eliminarDuplicados(correos: string[]): string[] {
  return [...new Set(correos.map(c => c.trim().toLowerCase()))];
}
