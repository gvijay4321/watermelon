import Link from "next/link";

function ServerErrorPage() {
  return (
    <div className="d-flex flex-items-center flex-justify-center">
      <p>The server ran into an error</p>
      <p>
        <Link href="/">
          Go back home
        </Link>
      </p>
    </div>
  );
}

export default ServerErrorPage;