import type { Metadata } from "next";
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Encontrar Tutor de IA — OpenLearn",
  description:
    "Pesquise e filtre tutores especialistas em Inteligência Artificial. Encontre o tutor perfeito para aulas 1:1 ao vivo.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Carregando catálogo de tutores...</div>}>
      <SearchClient />
    </Suspense>
  );
}

