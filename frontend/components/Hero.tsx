import { ArrowRightIcon, PlayIcon, ZapIcon, CheckIcon } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
import { motion } from 'framer-motion'; 
import { DottedMap } from "@/components/ui/dotted-map"  
import { Ripple } from './ui/ripple';
import { Particles } from "@/components/ui/particles"
import { BorderBeam } from "@/components/ui/border-beam"


export default function Hero() {

    

    const mainImageUrl = 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=1600&auto=format&fit=crop';

    const galleryStripImages = [
        'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=100',
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=100',
        'https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=100',
    ];

    const trustedLogosText = [
        'Startups',
        'Scale-ups',
        'Founders',
        'Global teams',
        'Creative brands'
    ];

    return (
        <div className="relative">
    {/* Particles - lowest layer */}
    <div className="absolute inset-0 z-0">
        <Particles /> 
    </div>
    
    {/* Ripple - middle layer */}
    <div className="absolute inset-0 z-5">
        <Ripple />
    </div>
    
    {/* Hero section - top layer */}
    <section id="home" className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 min-h-screen max-md:w-screen max-md:overflow-hidden pt-32 md:pt-26 flex items-center justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                <div className="text-left">
                    <motion.h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
                        initial={{ y: 60, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 }}
                    >
                        Welcome To <br />
                        <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-300 to-indigo-400">
                            Data Platform
                        </span>
                    </motion.h1>

                    <motion.p className="text-gray-300 max-w-lg mb-8"
                        initial={{ y: 60, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.2 }}
                    >
                        A unified data platform helping teams build faster throug
                        integrated analytics, intelligent cataloging and AI-powered insights.
                    </motion.p>

                    <motion.div className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                        initial={{ y: 60, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.3 }}
                    >
                        <a href="/" className="w-full sm:w-auto">
                            <PrimaryButton className="max-sm:w-full py-3 px-7">
                                Login
                                <ArrowRightIcon className="size-4" />
                            </PrimaryButton>
                        </a>

                        <GhostButton className="max-sm:w-full max-sm:justify-center py-3 px-5">
                            <PlayIcon className="size-4" />
                            How to Use the features
                        </GhostButton>
                    </motion.div>
                </div>

                {/* Right: modern mockup card */}
                <motion.div className="mx-auto w-full max-w-lg"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.5 }}
                >
                    
                    <motion.div className="rounded-3xl overflow-hidden border border-white/6 shadow-2xl bg-linear-to-b from-black/50 to-transparent">
                    
                        <div className="relative aspect-16/10 bg-gray-900">
                        <BorderBeam />
                            <img
                                src="/img.jpg"
                                alt="Hero Image"
                                className="w-full h-full object-cover object-center"        
                            />
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    </section>

    {/* LOGO MARQUEE */}
    <motion.section className="relative z-10 border-y border-white/6 bg-white/1 max-md:mt-10"
        initial={{ y: 60, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
    >
        <div className="max-w-6xl mx-auto px-6">
            <div className="w-full overflow-hidden py-6">
                <div className="flex gap-14 items-center justify-center animate-marquee whitespace-nowrap">
                    {trustedLogosText.concat(trustedLogosText).map((logo, i) => (
                        <span
                            key={i}
                            className="mx-6 text-sm md:text-base font-semibold text-gray-400 hover:text-gray-300 tracking-wide transition-colors"
                        >
                            {logo}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    </motion.section>
</div>
    );
};