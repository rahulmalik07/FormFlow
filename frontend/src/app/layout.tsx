import type { Metadata } from "next";
import "../../tailwind-built.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "FormFlow",
  description: "A Typeform clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
