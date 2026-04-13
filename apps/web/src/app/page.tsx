import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-start justify-center gap-6 p-8">
      <p className="text-sm text-muted-foreground">Wrectifai Monorepo</p>
      <h1 className="text-4xl font-semibold tracking-tight">
        Next.js App Router frontend is ready.
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground">
        This web app is configured for component-first development with Tailwind
        and shadcn-compatible structure.
      </p>
      <div className="flex gap-3">
        <Button>Primary Action</Button>
        <Button variant="secondary">Secondary Action</Button>
      </div>
    </main>
  );
}
