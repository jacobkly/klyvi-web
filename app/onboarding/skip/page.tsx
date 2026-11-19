import { SkipChoice } from "./skip-choice";

export const metadata = { title: "Skip for now · Klyvi" };

export default function SkipPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <SkipChoice />
    </main>
  );
}
