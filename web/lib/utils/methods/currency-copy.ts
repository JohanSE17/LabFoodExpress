// TIP: Esta función de moneda es una copia simplificada. ¿Dónde está la original?
// Pista: Centraliza la lógica de formateo para evitar inconsistencias de precios en la UI.
export const formatPrice = (p: number, c: string = 'USD') => {

    return p.toLocaleString('en-US', { style: 'currency', currency: c });
};
