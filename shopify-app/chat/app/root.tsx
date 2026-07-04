import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function isMissingRouteError(error: unknown): boolean {
  if (isRouteErrorResponse(error) && error.status === 404) {
    return true;
  }
  if (error instanceof Error) {
    const lower = error.message.toLowerCase();
    return lower.includes("404") && lower.includes("not found");
  }
  return false;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";

  if (isRouteErrorResponse(error) && error.status === 410) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Bybelt · Shopify</title>
        </head>
        <body style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 32 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Open from Shopify Admin</h1>
          <p style={{ color: "#5F6D7F", maxWidth: 480 }}>
            Install or open Bybelt Chat from your Shopify admin in a normal browser tab to
            connect your store.
          </p>
        </body>
      </html>
    );
  }

  const status = isRouteErrorResponse(error) ? error.status : 500;

  if (isMissingRouteError(error)) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <title>Bybelt · Shopify</title>
          <meta httpEquiv="refresh" content="0;url=https://chat.bybelt.com/initiate/login" />
        </head>
        <body style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 32 }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Sign in to Bybelt</h1>
          <p style={{ color: "#5F6D7F", maxWidth: 480 }}>
            Open this page from Shopify Admin, or{" "}
            <a href="https://chat.bybelt.com/initiate/login">sign in to Bybelt</a> and retry the
            Shopify connection.
          </p>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Bybelt · Shopify</title>
      </head>
      <body style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Application error ({status})</h1>
        <p style={{ color: "#5F6D7F", maxWidth: 480 }}>{message}</p>
      </body>
    </html>
  );
}
