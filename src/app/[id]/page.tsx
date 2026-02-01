import { Suspense } from "react";
import { PasteViewer } from "../_components/paste-viewer";

interface PastePageProps {
  params: Promise<{ id: string }>;
}

export default async function PastePage({ params }: PastePageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <main className="h-screen w-full p-8">
          <p className="text-[#888888]">loading...</p>
        </main>
      }
    >
      <PasteViewer pasteId={id} />
    </Suspense>
  );
}
