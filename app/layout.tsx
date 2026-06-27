import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Embar — where people who love content find each other",
  description: "The community platform for YouTube, films, TV and beyond. Warm, human, and built around passion over performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var path = window.location.pathname;
            var cm = path.match(/^\\/channel\\/([^\\/]+)/);
            if (cm) {
              var cid = cm[1];
              var mode = localStorage.getItem('embar-channel-theme-' + cid);
              var theme;
              if (mode === 'light' || mode === 'dark') {
                theme = mode;
              } else {
                var preset = localStorage.getItem('embar-channel-preset-' + cid);
                theme = preset || localStorage.getItem('embar-theme') || 'light';
              }
              document.documentElement.setAttribute('data-theme', theme);
            } else {
              var t = localStorage.getItem('embar-theme') || 'light';
              document.documentElement.setAttribute('data-theme', t);
            }
          } catch(e) {}
        `}} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
