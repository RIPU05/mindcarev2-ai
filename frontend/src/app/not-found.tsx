import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#faf9f6] px-6 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <Card className="max-w-md text-center">
        <p className="text-sm font-medium text-stone-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">This space is quiet.</h1>
        <p className="mt-3 text-sm text-stone-500">The page you are looking for does not exist or has moved.</p>
        <Link href="/dashboard" className="mt-6 inline-block"><Button>Return to dashboard</Button></Link>
      </Card>
    </main>
  );
}
