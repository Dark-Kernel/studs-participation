import "./globals.css";

export const metadata = {
  title: "ITSA Events Board - IT Department",
  description: "ITSA College Club Events Management System - Track student participation across Scrollconnect, Unstop, and college events",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
