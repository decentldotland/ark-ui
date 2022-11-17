// 404.js
import Link from 'next/link'
import type { NextPage } from 'next'
import Button from "../components/Button";

const FourOhFour: NextPage = () => {
  return <>
    <div className="h-[45vw] flex flex-col items-center justify-center mt-20 px-8">
      <h1 className="text-xl sm:text-3xl text-white mb-8">404 - You were searching for decent land, but unfortunately it isn't here.</h1>
      <Link href="/" className="">
        <a>
          <Button>
            Go Back Home
          </Button>
        </a>
      </Link>

    </div>
  </>
}

export default FourOhFour