import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-preto text-white/70">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-8 text-sm">
        <Image
          src="/logo-du-bebidas.svg"
          alt="Du Bebidas"
          width={40}
          height={40}
          className="rounded-full shrink-0"
        />
        <div>
          <p className="text-white">Du Bebidas — destilados, vinhos e cerveja. Aberto 24h.</p>
          <p className="mt-1">
            Alameda das Acácias, 530 · Alfenas-MG · (35) 91003-4182
          </p>
        </div>
      </div>
    </footer>
  );
}
