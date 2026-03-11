import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Doorprize - List Hadiah",
  description: "Daftar hadiah untuk undian doorprize",
};

export default function HadiahLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
