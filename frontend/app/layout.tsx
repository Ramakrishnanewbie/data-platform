import { Outfit } from "next/font/google";
import "./styles.css";
import Footer from "@/components/prebuilt/Footer";
import Navbar from "@/components/prebuilt/Navbar";
import SoftBackdrop from "@/components/prebuilt/SoftBackdrop";
import LenisScroll from "@/components/prebuilt/lenis";
import { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import {ScrollProgress} from "@/components/ui/scroll-progress";
import { ClerkProvider } from '@clerk/nextjs'
import { Particles } from "@/components/ui/particles";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ReactQueryProvider } from './providers'

const outfit = Outfit({
    variable: "--font-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Data Pulse",
        template: "%s | Data Pulse",
    },
    description: "Data Pulse - Your Gateway to Data Excellence",
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
            <html lang="en" suppressHydrationWarning>
                <body className={`${outfit.variable} ${geistSans.variable} ${geistMono.variable}`}>
                    <ScrollProgress />
                    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
                      <ReactQueryProvider>
                        <SoftBackdrop />
                        <LenisScroll />
                        {children}        
                      </ReactQueryProvider>
                    </ThemeProvider>
                </body>
            </html>

    );
}