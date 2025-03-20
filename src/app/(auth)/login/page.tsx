import Image from "next/image";
import { LoginForm } from "./loginform";

import LogoImage from "@public/logo.png"

export default function Main() {
  return (
    <div className="flex flex-col items-center justify-center min-w-screen h-full gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-6 items-center justify-center border-gray-100 border-solid border-2 rounded-md px-12 py-12">
        <Image
          className="dark:invert mb-4"
          src={LogoImage}
          alt="Next.js logo"
          width={100}
          height={38}
          priority
        />
        <LoginForm />
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">

      </footer>
    </div>
  );
}
