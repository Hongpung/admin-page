import Image from "next/image";
import { Suspense } from "react";
import { LoginForm } from "@admin/features/auth";

import LogoImage from "@public/logo.png";

export default function Main() {
  return (
    <div className="flex h-full w-full items-center justify-center px-4 py-6 font-[family-name:var(--font-geist-sans)]">
      <main className="flex w-full max-w-md flex-col items-center justify-center gap-6 rounded-md border-2 border-solid border-gray-200/80 px-12 py-12">
        <Image
          className="dark:invert mb-4"
          src={LogoImage}
          alt="Next.js logo"
          width={100}
          height={38}
          priority
        />
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
