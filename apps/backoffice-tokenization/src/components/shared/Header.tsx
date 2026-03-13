import Link from "next/link";
import Image from "next/image";

export const Header = () => {
  return (
    <header className="flex justify-between items-center w-full py-4">
      <Link href="/">
        <Image src="/favicon.ico" alt="logo" width={50} height={50} />
      </Link>
    </header>
  );
};
