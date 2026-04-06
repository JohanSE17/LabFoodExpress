// TIP: Formateo de fechas duplicado y manual. ¿Reutilizar o duplicar?
// Pista: Una sola librería de fechas (como date-fns) en un lugar común ahorraría mucho mantenimiento.
export const simpleDate = (date: string) => {

    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};
