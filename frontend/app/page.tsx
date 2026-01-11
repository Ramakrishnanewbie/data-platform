'use client'
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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