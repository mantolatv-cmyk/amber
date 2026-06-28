import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Encontrar Tutor de IA — OpenLearn",
  description:
    "Pesquise e filtre tutores especialistas em Inteligência Artificial. Encontre o tutor perfeito para aulas 1:1 ao vivo.",
};

export default function SearchPage() {
  return <SearchClient />;
}
