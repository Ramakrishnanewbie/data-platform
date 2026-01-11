import { Outfit } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SoftBackdrop from "@/components/SoftBackdrop";
import LenisScroll from "@/components/lenis";
import { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import {ScrollProgress} from "@/components/ui/scroll-progress";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Particles } from "@/components/ui/particles";


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
        
        <html lang="en">
            <ScrollProgress />
            <body className={`${outfit.variable} ${geistSans.variable} ${geistMono.variable}`}>
            <SoftBackdrop />
            <LenisScroll />
            {children}        
            </body>
        </html>
    );
}
