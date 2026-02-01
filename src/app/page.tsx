import { Suspense } from "react";
import { PasteEditor } from "./_components/paste-editor";

function PasteLoadingFallback() {
  return <div className="h-screen w-full animate-pulse" />;
}

export default function Home() {
  return (
    <main className="h-screen w-full">
      <Suspense fallback={<PasteLoadingFallback />}>
        <PasteEditor />
      </Suspense>
    </main>
  );
}
