import Image from "next/image";

export default function Main() {
  return (
    <div className="flex flex-col items-center justify-center min-w-screen min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-4 items-center justify-center border-gray-200 border-solid border rounded-md px-8 py-16">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <form className="flex gap-4 flex-col font-[family-name:var(--font-geist-mono)]">
          <input type="email" name="id" className="border-gray-200 border-solid border rounded-md outline-blue-500 outline-1 py-1 px-2 " />
          <input type="password" name="id" className="border-gray-200 border-solid border rounded-md outline-blue-500 outline-1 py-1 px-2 " />
        </form>

        <a
          className="rounded-md cursor-pointer border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 py-2 w-fit"
          href="/dashboard"
        >
          <Image
            className="dark:invert"
            src="https://nextjs.org/icons/vercel.svg"
            alt="Vercel logomark"
            width={20}
            height={20}
          />
          로그인
        </a>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">

      </footer>
    </div>
  );
}
