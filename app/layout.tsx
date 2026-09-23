import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Topic Spin — by Crawling Thoughts",
  authors: [{ name: "Crawling Thoughts", url: "https://www.instagram.com/crawling.thoughts/" }],
  description: "Pull the lever. Find your voice. A playful topic arcade with hundreds of speaking prompts, creative challenges, and a practice timer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head><script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('speak-easy-theme')==='dark'?'dark':'light'}catch{}" }}/></head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
