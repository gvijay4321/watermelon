"use client";
import Image from "next/image";
export default function Header({ userEmail, userToken }) {
  return (
    <div className="Header d-flex flex-items-center flex-justify-between">
      <a href="/" className="Header-link">
        <div className="Header-item">
          <Image
            src="/logos/watermelon.png"
            alt="Watermelon Tools"
            width="36"
            height="23"
          />
        </div>
      </a>
      <div className="Header-item mr-0">
        <div>
          <details className="dropdown details-reset details-overlay d-inline-block">
            <summary className="btn" aria-haspopup="true">
              Account
              <div className="dropdown-caret"></div>
            </summary>

            <ul className="dropdown-menu dropdown-menu-sw">
              <li>
                <a className="dropdown-item" href="#url">
                  {userEmail}
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href={"https://github.com/apps/watermelon-context"}
                >
                  GitHub App
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href={`vscode://watermelontools.watermelon-tools?email=${
                    userEmail ?? ""
                  }&token=${userToken ? userToken : ""}`}
                >
                  VSCode Extension
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href={`https://docs.watermelontools.com/`}
                >
                  API Docs
                </a>
              </li>
              <li>
                <a
                  className="dropdown-item"
                  href={`https://app.watermelontools.com/settings`}
                >
                  Settings
                </a>
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
