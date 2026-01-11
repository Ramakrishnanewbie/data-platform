'use client'
import Hero from "@/components/prebuilt/Hero";
import Features from "@/components/prebuilt/Features";
import Faq from "@/components/prebuilt/Faq";
import Navbar from "@/components/prebuilt/Navbar";
import Footer from "@/components/prebuilt/Footer";

export default function Page() {
    return (
        <>
            <Navbar />
            <Hero />
            <Features />
            <Faq />
            <Footer />
        </>
    );
}