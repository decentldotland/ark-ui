import Link from "next/link";
import Button from "./Button";
import { useRouter } from "next/router";

const Footer = () => {
  const router = useRouter();

  return(
    <div className="fixed w-full bg-black/75 backdrop-blur-md z-[500] h-14 text-white flex text-center items-center flex-row gap-x-4 pl-4">
      <Link href="/">
        <Button disabled={router.pathname === '/'}>Ark Protocol</Button>
      </Link>
      <Link href="/connections">
        <Button disabled={router.pathname === '/connections'}>My Ark ID</Button>
      </Link>
    </div>
  );
}
export default Footer;