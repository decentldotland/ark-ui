import Link from "next/link";

const buttonStyle = 'hover:text-gray-300 cursor-pointer';

const Footer = () => (
  <div className="fixed w-full bg-black/75 backdrop-blur-md z-[500] h-14 text-white flex text-center items-center flex-row gap-x-4 pl-4">
    <Link href="/">
      <button className={buttonStyle}>Ark Protocol</button>
    </Link>
    <Link href="/connections">
      <button className={buttonStyle}>My Ark ID</button>
    </Link>
  </div>
);

export default Footer;