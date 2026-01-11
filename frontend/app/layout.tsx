import { Outfit } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SoftBackdrop from "@/components/SoftBackdrop";
import LenisScroll from "@/components/lenis";
import { Metadata } from "next";

const outfit = Outfit({
    variable: "--font-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Pixel.io – Digital Agency Template | PrebuiltUI",
        template: "%s | Pixel.io",
    },
    description:
        "Pixel.io is a modern digital agency template by PrebuiltUI, built for startups and growing businesses. Includes discovery, UI/UX design, development, pricing plans, FAQs, and conversion-focused sections.",
    keywords: [
        "Pixel.io",
        "PrebuiltUI",
        "digital agency template",
        "Next.js agency website",
        "UI UX agency",
        "startup website template",
        "web development services",
        "design and development agency",
    ],
    authors: [{ name: "PrebuiltUI" }],
    creator: "PrebuiltUI",
    publisher: "PrebuiltUI",

    openGraph: {
        title: "Pixel.io – Digital Agency Template by PrebuiltUI",
        description:
            "Launch faster with Pixel.io, a modern digital agency template featuring strategy, design, development, pricing plans, and FAQs.",
        siteName: "PrebuiltUI",
        type: "website",
    },

    twitter: {
        card: "summary_large_image",
        title: "Pixel.io – Digital Agency Template",
        description:
            "A conversion-focused digital agency template built with Next.js. Perfect for startups, teams, and scalable brands.",
        creator: "@prebuiltui",
    },

    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <SoftBackdrop />
                <LenisScroll />
                <Navbar />
                {children}
                <Footer />
            </body>
        </html>
    );
}
