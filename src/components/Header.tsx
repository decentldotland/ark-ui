import Link from "next/link";
import Button from "./Button";
import { useRouter } from "next/router";

const Footer = () => {
  const router = useRouter();

  return(
    <div className="fixed w-full bg-black/75 backdrop-blur-md z-[500] h-14 text-white flex text-center items-center flex-row gap-x-4 pl-4">
      <Link href="/">
        <button className={`background-none ${router.pathname === '/' ? "text-teal-500 font-bold" : ""}`} disabled={router.pathname === '/'}>Ark Protocol</button>
      </Link>
      <Link href="/connections">
        <button className={`background-none ${router.pathname === '/connections' ? "text-teal-500 font-bold" : ""}`} disabled={router.pathname === '/connections'}>My Ark ID</button>
      </Link>
    </div>
  );
}
export default Footer;