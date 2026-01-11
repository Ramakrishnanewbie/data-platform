'use client'
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Faq from "@/components/Faq";
import CTA from "@/components/CTA";


export default function Page() {
    return (
        <>
            <Hero />
            <Features />
            <Pricing />
            <Faq />
            <CTA />
        </>
    );
}