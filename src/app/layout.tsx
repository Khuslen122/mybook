import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeEffect } from "@/components/theme-effect";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Bookshelf — a quiet place to read",
  description: "A minimalist, multi-book reading library.",
};

// Applied before paint to avoid a theme flash on load.
const themeBootstrap = `(function(){try{
  var s=JSON.parse(localStorage.getItem('nw-reader')||'{}');
  var st=(s&&s.state&&s.state.settings)||{};
  var d=document.documentElement;
  d.setAttribute('data-theme', st.theme||'light');
  d.setAttribute('data-font', st.font||'serif');
  d.setAttribute('data-align', st.align||'left');
  d.classList.toggle('dark', ['dark','night','forest'].indexOf(st.theme)>=0);
  if(st.size) d.style.setProperty('--reading-size', st.size+'rem');
  if(st.leading) d.style.setProperty('--reading-leading', String(st.leading));
  if(st.paraGap) d.style.setProperty('--reading-para-gap', st.paraGap+'em');
  if(st.measure) d.style.setProperty('--reading-measure', st.measure);
}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className="min-h-full bg-(--reading-bg) text-(--reading-fg)">
        <ThemeEffect />
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
