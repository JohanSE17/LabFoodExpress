// TIP: ¿'formatMoney' aquí y 'formatPrice' en otro lado? ¿Y 'formatNumber' en admin?
// Pista: La falta de una capa de utilidades compartida entre 'admin' y 'web' genera inconsistencias.
export function formatMoney(amount: number) {

    return '$' + amount.toFixed(2);
}

export function toLocale(date: string) {
    return new Date(date).toLocaleString();
}
