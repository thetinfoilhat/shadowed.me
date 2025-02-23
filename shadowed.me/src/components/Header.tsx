import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <nav className="flex justify-between items-center px-8 py-4">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.svg"
          alt="Shadowed.me logo"
          width={32}
          height={32}
          priority
        />
        <span className="font-semibold text-[#725A44]">shadowed.me</span>
      </div>
      <div className="flex gap-4">
        <Link href="/" className="text-[#725A44] hover:text-[#8B6D54]">Home</Link>
        <Link href="/school-clubs" className="text-[#725A44] hover:text-[#8B6D54]">School Clubs</Link>
        <Link href="/volunteering" className="text-[#725A44] hover:text-[#8B6D54]">Volunteering</Link>
        <Link href="/about" className="text-[#725A44] hover:text-[#8B6D54]">About</Link>
      </div>
      <div className="flex gap-4">
        <button className="px-4 py-2 text-[#725A44] border border-[#725A44] rounded-md hover:bg-[#725A44] hover:text-white transition-colors">
          Login
        </button>
        <button className="px-4 py-2 bg-[#725A44] text-white rounded-md hover:bg-[#8B6D54] transition-colors">
          Sign Up
        </button>
      </div>
    </nav>
  );
} 