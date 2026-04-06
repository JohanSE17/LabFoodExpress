'use client';
import React from "react";
import RestaurantDetailsScreen from "@/lib/ui/screens/protected/resturant-store/restaurant";

// This component is intentionally disorganized for the maintenance lab
// Ticket: [P7] Rutas de restaurantes sin tipado – Mezclar lógica en el componente

export default function RestaurantDetailPage({ params }: any) {
  // Lógica de rutas y datos mezclada (Bad Practice)
  const { slug, id } = params;

  // Función de datos definida inline (Deuda Técnica)
  const getRestaurantData = (id: any) => {
    console.log("Fetching restaurant data for ID:", id);
    // Lógica que debería estar en lib/services
    return { name: "Mock Restaurant", id };
  };

  const data = getRestaurantData(id);

  return (
    <div>
      <div style={{ display: 'none' }}>Debug: {JSON.stringify(data)} {slug}</div>
      <RestaurantDetailsScreen />
    </div>
  );
}
