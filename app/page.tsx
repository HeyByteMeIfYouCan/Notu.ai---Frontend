"use client";
import Image from "next/image";
import Page from "./dashboard/page";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ShieldCheck, Activity, Share2, Link2, Users, BarChart, Star, ChevronDown, Check, CheckCircle2, Twitter, Linkedin, Github } from "lucide-react";
import styles from "./styles/WhySection.module.scss";
import allInOneStyles from "./styles/AllInOneSection.module.scss";
import trustStyles from "./styles/TrustSection.module.scss";
import testimonialStyles from "./styles/TestimonialSection.module.scss";
import faqStyles from "./styles/FaqSection.module.scss";
import pricingStyles from "./styles/PricingSection.module.scss";
import footerStyles from "./styles/Footer.module.scss";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <HeroSection />
      <StepsSection />
      <WhySection />
      <AllInOneSection />
      <TrustSection />
      <TestimonialsSection />
      <FAQSection />
      <PricingSection />
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  const [atTop, setAtTop] = useState(true);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      setAtTop(window.scrollY < 20);
      
      // Scroll spy logic
      const sections = document.querySelectorAll("section[id]");
      let current = "";
      sections.forEach((section) => {
        const sectionTop = (section as HTMLElement).offsetTop;
        if (window.scrollY >= sectionTop - 250) {
          current = section.getAttribute("id") || "";
        }
      });
      if (current) setActiveSection(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { id: "home", label: "Beranda" },
    { id: "how", label: "Solusi" },
    { id: "features", label: "Fitur" },
    { id: "faq", label: "FAQ" },
    { id: "pricing", label: "Harga" }
  ];

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 w-full z-50 transition-colors duration-200 border-b ${
        atTop
          ? "bg-transparent border-transparent"
          : "bg-[#060818]/95 backdrop-blur-sm border-white/10 shadow-sm"
      }`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[4.5rem]">
        <a href="#home" className="flex items-center gap-3 cursor-pointer">
          <img src={"/logo.png"} width={36} height={36} alt="logo" className="rounded-md" />
          <span className="font-bold tracking-tight text-2xl text-white">Notu.ai</span>
        </a>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={() => setActiveSection(link.id)}
              className={`transition-colors relative py-1 ${
                activeSection === link.id 
                  ? "text-white font-semibold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-primary after:rounded-full" 
                  : "text-white/70 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="h-10 px-4 flex items-center justify-center rounded-md text-sm font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors hidden sm:flex">
            Log in
          </Link>
          <Link href="/login">
            <Button className="h-10 px-6 bg-white text-[#0f1222] hover:bg-white/90 rounded-md font-semibold transition-colors shadow-sm">
              Coba Gratis
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden bg-[#060818]">
      <StarBackground />
      <div className="bg-[url(/hero-bg.png)] bg-cover bg-center">
        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-32 pb-16 md:pt-40 md:pb-24 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/80 mb-8 backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            Notu 1.0 Kini Telah Tersedia!
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight"
          >
            Asisten AI untuk <br className="hidden md:block"/> catat otomatis meeting Anda
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto"
          >
            Fokus pada percakapan, biarkan Notu menangkap ringkasan, aksi, dan insight secara real‑time.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base">Mulai sekarang</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="h-12 px-8 text-base">Uji coba gratis</Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
            className="mt-16 md:mt-24 mx-auto max-w-5xl"
          >
            {/* Elegant Glassmorphism Frame around the dashboard image */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-2 shadow-[0_0_80px_-20px_rgba(107,78,255,0.4)] backdrop-blur-md">
              <div className="overflow-hidden rounded-lg border border-white/5 bg-[#060818]">
                <Image src="/hero-features.png" alt="Hero Feature" width={1600} height={900} className="w-full h-auto object-cover" priority />
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Seamlessly integrated Marquee inside Hero */}
        <MarqueeBar />

        {/* Soft bottom edge to blend with the next section */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent absolute bottom-0 left-0" />
      </div>
    </section>
  );
}

function StarBackground() {
  // subtle layered radial gradients + star field using CSS mask
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_-10%,#2a22a8_0%,transparent_60%),radial-gradient(60%_50%_at_20%_0%,#1a145d_0%,transparent_60%),radial-gradient(60%_50%_at_80%_-10%,#0f0b3b_0%,transparent_60%)]" />
      <div className="absolute inset-0 opacity-60" style={{backgroundImage:
        "radial-gradient(1px 1px at 20% 10%, rgba(255,255,255,0.6) 50%, transparent 51%),"+
        "radial-gradient(1px 1px at 40% 30%, rgba(255,255,255,0.5) 50%, transparent 51%),"+
        "radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.4) 50%, transparent 51%),"+
        "radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.5) 50%, transparent 51%),"+
        "radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.4) 50%, transparent 51%),"+
        "radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.5) 50%, transparent 51%),"+
        "radial-gradient(1px 1px at 70% 75%, rgba(255,255,255,0.4) 50%, transparent 51%)"
      }} />
    </div>
  );
}

function MarqueeBar() {
  const logos = [
    { src: "https://cdn.simpleicons.org/github", alt: "GitHub" },
    { src: "https://cdn.simpleicons.org/stripe", alt: "Stripe" },
    { src: "https://cdn.simpleicons.org/notion", alt: "Notion" },
    { src: "https://cdn.simpleicons.org/figma", alt: "Figma" },
    { src: "https://cdn.simpleicons.org/dropbox", alt: "Dropbox" },
    { src: "https://cdn.simpleicons.org/zoom", alt: "Zoom" },
    { src: "https://cdn.simpleicons.org/vercel", alt: "Vercel" },
    { src: "https://cdn.simpleicons.org/google", alt: "Google" },
  ];
  return (
    <div className="w-full relative z-10 pt-4 pb-16">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 font-semibold mb-8">
          Dipercaya oleh tim inovatif di seluruh dunia
        </p>
        <div className="relative overflow-hidden">
            <div className="[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
              <div className="flex items-center gap-16 md:gap-24 will-change-transform whitespace-nowrap animate-[trusted-marquee_28s_linear_infinite] lg:w-[160%] w-[500%]">
                <div className="flex items-center justify-around gap-12 md:gap-20 w-1/2">
                  {logos.map((l, i) => (
                    <div key={`t-a-${l.alt}-${i}`} className="h-16 flex items-center">
                      <img src={l.src} alt={l.alt} className="h-10 sm:h-11 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 brightness-0 invert" />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-around gap-12 md:gap-20 w-1/2">
                  {logos.map((l, i) => (
                    <div key={`t-b-${l.alt}-${i}`} className="h-16 flex items-center">
                      <img src={l.src} alt={l.alt} className="h-10 sm:h-11 w-auto opacity-40 hover:opacity-100 transition-opacity duration-300 brightness-0 invert" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </div>
      <style>{"@keyframes trusted-marquee {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}"}</style>
    </div>
  );
}

function TrustedLogosMarquee() {
  const logos = [
    { src: "/next.svg", alt: "Next.js" },
    { src: "/vercel.svg", alt: "Vercel" },
    { src: "/globe.svg", alt: "Globe" },
    { src: "/window.svg", alt: "Window" },
    { src: "/file.svg", alt: "File" },
  ];
  const track = [...logos, ...logos];
  return (
    <div className="relative overflow-hidden py-4">
      <div className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex items-center gap-10 sm:gap-12 md:gap-14 will-change-transform whitespace-nowrap animate-[trusted-marquee_28s_linear_infinite]" style={{ width: "200%" }}>
          <div className="flex items-center gap-10 sm:gap-12 md:gap-14 w-1/2">
            {logos.map((l, i) => (
              <div key={`t-a-${l.alt}-${i}`} className="h-10 sm:h-12 md:h-14 flex items-center">
                <img src={l.src} alt={l.alt} className="h-8 sm:h-10 md:h-12 w-auto opacity-80" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-10 sm:gap-12 md:gap-14 w-1/2">
            {logos.map((l, i) => (
              <div key={`t-b-${l.alt}-${i}`} className="h-10 sm:h-12 md:h-14 flex items-center">
                <img src={l.src} alt={l.alt} className="h-8 sm:h-10 md:h-12 w-auto opacity-80" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{"@keyframes trusted-marquee {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}"}</style>
    </div>
  );
}

function SectionTitle({eyebrow, title, center=false}:{eyebrow?:string; title:string; center?:boolean;}){
  return (
    <div className={center?"text-center":""}>
      {eyebrow && <p className="text-[#6b4eff] font-semibold text-sm">{eyebrow}</p>}
      <h2 className="mt-1 text-xl md:text-2xl font-semibold text-[#0f1222]">{title}</h2>
    </div>
  );
}

import stylesSteps from './styles/StepsSection.module.scss';

// ... (in the file, we already import motion and Image, we just need to replace the StepsSection component)

function StepsSection(){
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const items = [
    {t:"Paste URL meet anda kepada Notu", d:"Notu ikut hadir di Google Meet atau Zoom lalu menyiapkan sesi.", i:"/hownotu-1.png"},
    {t:"Notu akan memproses transkrip", d:"Transkrip, ringkasan, action items, dan highlights dibuat otomatis.", i:"/hownotu-2.png"},
    {t:"Tindak lanjuti hasil meeting", d:"Distribusikan ringkasan, integrasikan ke tools, dan pantau progres.", i:"/hownotu-3.png"},
  ];
  return (
    <section id="how" className={stylesSteps.stepsSection}>
      <div className={stylesSteps.stepsSection__bgGlow} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className={stylesSteps.stepsSection__header}
      >
        <h2 className={stylesSteps.stepsSection__title}>
          How notu make meetings<br/>
          <span>effortless</span>?
        </h2>
      </motion.div>
      
      <div className={stylesSteps.stepsSection__container}>
        {items.map((it,idx)=> (
          <motion.article 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.2 }}
            key={idx}
            className={`${stylesSteps.stepsSection__step} ${activeStepIndex === idx ? stylesSteps['stepsSection__step--active'] : ''}`}
          >
            <div className={stylesSteps.stepsSection__imageWrapper}>
              <img 
                src={it.i} 
                alt={it.t}
                className={stylesSteps.stepsSection__mainImage}
              />
            </div>
            
            <div className={stylesSteps.stepsSection__node}>
              0{idx + 1}
              
              {/* Custom direction lines spanning the gap */}
              {idx < items.length - 1 && (
                <img 
                  src={`/hownout-directionline-${idx + 1}.png`} 
                  alt="direction line" 
                  className={stylesSteps.stepsSection__directionLine} 
                />
              )}
            </div>
            
            <div className={stylesSteps.stepsSection__textGroup}>
              <h3 className={stylesSteps.stepsSection__stepTitle}>{it.t}</h3>
              <p className={stylesSteps.stepsSection__stepDesc}>{it.d}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function WhySection(){
  const points = [
    { 
      t: "Real time data", 
      d: "Highlight, ringkasan, dan action items tersedia saat meeting berlangsung.",
      icon: <Activity />
    },
    { 
      t: "AI Driven Accuracy", 
      d: "Model bahasa disesuaikan konteks organisasi anda.",
      icon: <Zap />
    },
    { 
      t: "Safety Security", 
      d: "Data dienkripsi, kontrol akses granular.",
      icon: <ShieldCheck />
    },
    { 
      t: "Integration", 
      d: "Otomatis kirimkan ke Notion, Slack, Jira, dan lainnya.",
      icon: <Share2 />
    },
  ];

  return (
    <section id="features" className={styles.whySection}>
      <div className={`${styles.whySection__bgBlob} ${styles['whySection__bgBlob--topRight']}`} />
      <div className={`${styles.whySection__bgBlob} ${styles['whySection__bgBlob--bottomLeft']}`} />
      
      <div className={styles.whySection__container}>
        <div className={styles.whySection__content}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.whySection__title}>
              Kenapa anda harus menggunakan <span>Notu?</span>
            </h2>
          </motion.div>
          
          <ul className={styles.whySection__grid}>
            {points.map((p, i) => (
              <motion.li 
                key={i} 
                className={styles.whySection__card}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className={styles.whySection__iconWrapper}>
                  {p.icon}
                </div>
                <div className={styles.whySection__textGroup}>
                  <h4 className={styles.whySection__cardTitle}>{p.t}</h4>
                  <p className={styles.whySection__cardDesc}>{p.d}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
        
        <motion.div 
          className={styles.whySection__imageWrapper}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image src="/whyyoushouldusenotu.png" alt="Why Notu" width={550} height={550} priority />
        </motion.div>
      </div>
    </section>
  );
}

function AllInOneSection(){
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const cards = [
    {
      t: "Integrated with Online Meeting", 
      d: "Terhubung langsung dengan ekosistem favorit Anda seperti Google Meet, Zoom, dan Microsoft Teams. Kami menyinkronkan rekaman dan transkrip secara real-time tanpa setup yang rumit.",
      icon: <Link2 />,
      image: "/allinonemeeting.png"
    },
    {
      t: "Sharing your meeting transcripts", 
      d: "Bagikan ringkasan cerdas, action items, dan transkrip utuh ke seluruh anggota tim hanya dengan satu kali klik. Notu secara otomatis merapikan insight agar mudah dibaca.",
      icon: <Users />,
      image: "/Dashboard Todolist.png"
    },
    {
      t: "Analytics your meeting", 
      d: "Pantau metrik krusial seperti tingkat engagement peserta, dominasi pembicaraan, dan sentimen secara berkala. Dashboard analitik interaktif kami membantu Anda mengambil keputusan berbasis data.",
      icon: <BarChart />,
      image: "/hero-features.png"
    },
  ];

  // Auto-rotate tabs
  useEffect(() => {
    if (isHovered) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cards.length);
    }, 3000); 
    
    return () => clearInterval(interval);
  }, [isHovered, cards.length]);

  return (
    <section className={allInOneStyles.allInOneSection}>
      <div className={allInOneStyles.allInOneSection__container}>
        
        {/* Left Side: Image with Crossfade */}
        <div 
          className={allInOneStyles.allInOneSection__imageWrapper}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.95, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Image 
                src={cards[activeIndex].image} 
                width={650} 
                height={650} 
                alt={cards[activeIndex].t} 
                priority 
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Content & Features */}
        <div 
          className={allInOneStyles.allInOneSection__content}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <motion.div 
            className={allInOneStyles.allInOneSection__header}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={allInOneStyles.allInOneSection__title}>
              <span>All in one</span> meeting intelligence
            </h2>
          </motion.div>

          <div className={allInOneStyles.allInOneSection__featuresList}>
            {cards.map((c, i) => {
              const isActive = activeIndex === i;
              
              return (
                <motion.article 
                  key={i} 
                  className={`${allInOneStyles.allInOneSection__featureRow} ${isActive ? allInOneStyles["allInOneSection__featureRow--active"] : ""}`}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
                  onClick={() => setActiveIndex(i)}
                  style={{ cursor: "pointer", opacity: isActive ? 1 : 0.6 }}
                >
                  <div className={allInOneStyles.allInOneSection__iconWrapper}>
                    {c.icon}
                  </div>
                  <div className={allInOneStyles.allInOneSection__textGroup}>
                    <h4 className={allInOneStyles.allInOneSection__cardTitle}>{c.t}</h4>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 1, marginTop: "0.5rem" }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <p className={allInOneStyles.allInOneSection__cardDesc}>
                            {c.d}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

function TrustSection(){
  return (
    <section className={trustStyles.trustSection}>
      <div className={trustStyles.trustSection__container}>
        <motion.div 
          className={trustStyles.trustSection__header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={trustStyles.trustSection__title}>
            <span>Trusted</span> by companies around the world
          </h2>
        </motion.div>

        <motion.div 
          className={trustStyles.trustSection__mapWrapper}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Image 
            src={"/trusted-by-company-around-the-world.png"} 
            width={1000} 
            height={600} 
            alt="Map showing companies trusting Notu" 
            priority
          />
        </motion.div>

        <div className={trustStyles.trustSection__stats}>
          {[
            { num: "350+", label: "Perusahaan menggunakan Notu" },
            { num: "750k+", label: "Users and participants assisted" },
            { num: "24+", label: "Integrations and add‑ons" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              className={trustStyles.trustSection__statItem}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.4 + (i * 0.1) }}
            >
              <h3 className={trustStyles.trustSection__statNumber}>{stat.num}</h3>
              <p className={trustStyles.trustSection__statLabel}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection(){
  const testimonials = [
    { quote: "Keren, jadi tidak perlu catat manual lagi! Sangat menghemat waktu tim kami setiap minggu.", name: "Siska", role: "HR Manager" },
    { quote: "Transkripsi otomatisnya luar biasa akurat, bahkan untuk istilah teknis sekalipun.", name: "Budi", role: "Product Owner" },
    { quote: "Notulen meeting langsung jadi dalam hitungan detik setelah rapat selesai. Magis!", name: "Andi", role: "CEO" },
    { quote: "Sangat mudah diintegrasikan dengan Google Meet. Saya tidak pernah absen menggunakannya.", name: "Dina", role: "Scrum Master" },
    { quote: "Fitur analytics meeting-nya membantu kami mengukur partisipasi anggota tim dengan lebih baik.", name: "Reza", role: "Engineering Lead" },
    { quote: "UI-nya sangat bersih dan modern. Semua tim saya langsung paham cara menggunakannya.", name: "Maya", role: "Operations" }
  ];

  return (
    <section className={testimonialStyles.testimonialSection}>
      <div className={testimonialStyles.testimonialSection__container}>
        <motion.div 
          className={testimonialStyles.testimonialSection__header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={testimonialStyles.testimonialSection__title}>
            <span>Dengar</span> apa kata mereka<br />
            yang telah memakai Notu
          </h2>
        </motion.div>

        <div className={testimonialStyles.testimonialSection__grid}>
          {testimonials.map((t, i) => (
            <motion.div 
              key={i} 
              className={testimonialStyles.testimonialSection__card}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className={testimonialStyles.testimonialSection__rating}>
                <Star />
                <Star />
                <Star />
                <Star />
                <Star />
              </div>
              <p className={testimonialStyles.testimonialSection__quote}>
                {t.quote}
              </p>
              <div className={testimonialStyles.testimonialSection__author}>
                <div className={testimonialStyles.testimonialSection__avatar}>
                  {t.name.charAt(0)}
                </div>
                <div className={testimonialStyles.testimonialSection__authorInfo}>
                  <p className={testimonialStyles.testimonialSection__authorName}>{t.name}</p>
                  <p className={testimonialStyles.testimonialSection__authorRole}>{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection(){
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {q:"Apakah saya dapat menggunakan Notu secara gratis?", a:"Ya, tersedia paket gratis dengan fitur inti yang bisa langsung Anda gunakan tanpa perlu kartu kredit."},
    {q:"Apakah saya bisa menggunakan Notu untuk meeting secara offline?", a:"Bisa. Anda cukup merekam meeting offline menggunakan smartphone atau alat perekam suara, lalu mengunggah rekaman tersebut ke Notu untuk diproses."},
    {q:"Bahasa apa saja yang didukung oleh Notu?", a:"Saat ini Notu difokuskan dan dioptimalkan secara khusus untuk mengenali dan mentranskripsi Bahasa Indonesia dengan tingkat akurasi yang sangat tinggi."},
    {q:"Apakah data meeting saya aman dan rahasia?", a:"Tentu saja. Keamanan adalah prioritas utama kami. Transkrip dan rekaman Anda dijaga kerahasiaannya dan hanya dapat diakses oleh Anda atau anggota tim yang Anda izinkan."},
    {q:"Platform online meeting apa saja yang bisa diintegrasikan?", a:"Notu terhubung langsung dengan ekosistem meeting favorit Anda seperti Google Meet, Zoom, dan Microsoft Teams."}
  ];

  return (
    <section id="faq" className={faqStyles.faqSection}>
      <div className={faqStyles.faqSection__container}>
        <motion.div 
          className={faqStyles.faqSection__leftColumn}
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className={faqStyles.faqSection__badge}>FAQ</span>
          <h2 className={faqStyles.faqSection__title}>
            Pertanyaan yang sering ditanyakan
          </h2>
          <p className={faqStyles.faqSection__description}>
            Temukan jawaban cepat untuk pertanyaan umum tentang fitur, integrasi, dan keamanan Notu.
          </p>
        </motion.div>

        <div className={faqStyles.faqSection__rightColumn}>
          <div className={faqStyles.faqSection__list}>
            {faqs.map((f, i) => (
              <div key={i} className={`${faqStyles.faqSection__item} ${openIndex === i ? faqStyles['faqSection__item--active'] : ''}`}>
                <button 
                  className={faqStyles.faqSection__question}
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span className={faqStyles.faqSection__questionText}>{f.q}</span>
                  <div className={`${faqStyles.faqSection__iconWrapper} ${openIndex === i ? faqStyles['faqSection__iconWrapper--active'] : ''}`}>
                    <ChevronDown className={faqStyles.faqSection__icon} />
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {openIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className={faqStyles.faqSection__answer}>
                        {f.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection(){
  const tiers = [
    {
      name: "Gratis",
      price: "Rp. 0",
      cycle: "",
      features: [
        "Pencatatan menggunakan bot untuk Google Meet (1x)",
        "Upload file MP3/MP4 untuk diringkas",
        "Durasi Notu bot 15 menit/rapat online",
        "Export PDF/TXT",
      ],
      cta: "Mulai Sekarang",
      highlight: false,
    },
    {
      name: "Basic",
      price: "Rp. 50.000",
      cycle: "/bulan",
      features: [
        "Pencatatan menggunakan bot untuk Google Meet (10x)",
        "Upload file MP3/MP4 untuk diringkas",
        "Durasi Notu bot 1 jam/rapat online",
        "Upload file MP3/MP4 untuk diringkas (unlimited)",
        "Export PDF/TXT",
        "Diarization (bisa bedakan siapa yang bicara)",
      ],
      cta: "Mulai Sekarang",
      highlight: true,
    },
    {
      name: "Pro",
      price: "Rp. 150.000",
      cycle: "/bulan",
      features: [
        "Pencatatan menggunakan bot untuk Google Meet (unlimited)",
        "Upload file MP3/MP4 untuk diringkas",
        "Durasi Notu bot unlimited",
        "Upload file MP3/MP4 untuk diringkas (unlimited)",
        "Export PDF/TXT",
        "Diarization (bisa bedakan siapa yang bicara)",
        "Dashboard analytics",
      ],
      cta: "Mulai Sekarang",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className={pricingStyles.pricingSection}>
      <div className={pricingStyles.pricingSection__container}>
        
        <motion.div 
          className={pricingStyles.pricingSection__header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className={pricingStyles.pricingSection__badge}>Pricing</span>
          <h2 className={pricingStyles.pricingSection__title}>
            Harga Sederhana & Transparan
          </h2>
          <p className={pricingStyles.pricingSection__description}>
            Pilih paket yang paling sesuai dengan kebutuhan produktivitas meeting Anda. Tingkatkan (upgrade) kapan saja.
          </p>
        </motion.div>

        <div className={pricingStyles.pricingSection__grid}>
          {tiers.map((t, i) => {
            const isHighlight = t.highlight;
            return (
              <motion.div
                key={i}
                className={`${pricingStyles.pricingSection__card} ${isHighlight ? pricingStyles['pricingSection__card--highlighted'] : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                {isHighlight && (
                  <div className={pricingStyles.pricingSection__popularBadge}>
                    Pilihan Terpopuler
                  </div>
                )}
                
                <h3 className={`${pricingStyles.pricingSection__planName} ${isHighlight ? pricingStyles['pricingSection__planName--highlighted'] : ''}`}>{t.name}</h3>
                
                <div className={pricingStyles.pricingSection__priceWrapper}>
                  <span className={`${pricingStyles.pricingSection__price} ${isHighlight ? pricingStyles['pricingSection__price--highlighted'] : ''}`}>{t.price}</span>
                  {t.cycle && <span className={`${pricingStyles.pricingSection__cycle} ${isHighlight ? pricingStyles['pricingSection__cycle--highlighted'] : ''}`}>{t.cycle}</span>}
                </div>
                
                <div className={`${pricingStyles.pricingSection__divider} ${isHighlight ? pricingStyles['pricingSection__divider--highlighted'] : ''}`} />

                <ul className={pricingStyles.pricingSection__featureList}>
                  {t.features.map((f, idx) => (
                    <li key={idx} className={`${pricingStyles.pricingSection__featureItem} ${isHighlight ? pricingStyles['pricingSection__featureItem--highlighted'] : ''}`}>
                      <CheckCircle2 strokeWidth={2.5} className={pricingStyles.pricingSection__checkIcon} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/login" className="w-full mt-auto">
                  <Button 
                    size="lg" 
                    variant={isHighlight ? "default" : "outline"} 
                    className={`w-full rounded-full ${isHighlight ? 'shadow-lg shadow-primary/30' : ''}`}
                  >
                    {t.cta}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SiteFooter(){
  return (
    <footer className={footerStyles.footer}>
      <div className={footerStyles.footer__container}>
        
        {/* Main Area: Brand & Links */}
        <div className={footerStyles.footer__mainArea}>
          
          {/* Brand & Socials */}
          <div className={footerStyles.footer__brand}>
            <div className={footerStyles.footer__logo}>
              <img src={"/logo.png"} width={32} height={32} alt="Notu.ai Logo" />
              <span>Notu.ai</span>
            </div>
            <p className={footerStyles.footer__desc}>
              Kecerdasan buatan terdepan yang merevolusi cara Anda mendokumentasikan rapat dan percakapan. Otomatis, akurat, dan aman.
            </p>
            <div className={footerStyles.footer__socials}>
              <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
              <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
              <a href="#" aria-label="GitHub"><Github size={20} /></a>
            </div>
          </div>

          {/* Links Grid */}
          <div className={footerStyles.footer__linksGrid}>
            <div className={footerStyles.footer__linkCol}>
              <h4 className={footerStyles.footer__colTitle}>Produk</h4>
              <ul className={footerStyles.footer__linkList}>
                <li><a className={footerStyles.footer__linkItem} href="#">Fitur Utama</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Integrasi API</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Harga & Paket</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Changelog</a></li>
              </ul>
            </div>
            
            <div className={footerStyles.footer__linkCol}>
              <h4 className={footerStyles.footer__colTitle}>Perusahaan</h4>
              <ul className={footerStyles.footer__linkList}>
                <li><a className={footerStyles.footer__linkItem} href="#">Tentang Kami</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Karier</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Blog & Berita</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Kontak</a></li>
              </ul>
            </div>
            
            <div className={footerStyles.footer__linkCol}>
              <h4 className={footerStyles.footer__colTitle}>Sumber Daya</h4>
              <ul className={footerStyles.footer__linkList}>
                <li><a className={footerStyles.footer__linkItem} href="#">Panduan Pengguna</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Dokumentasi API</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Pusat Bantuan</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Komunitas</a></li>
              </ul>
            </div>
            
            <div className={footerStyles.footer__linkCol}>
              <h4 className={footerStyles.footer__colTitle}>Legal</h4>
              <ul className={footerStyles.footer__linkList}>
                <li><a className={footerStyles.footer__linkItem} href="#">Kebijakan Privasi</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Syarat Ketentuan</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Keamanan Data</a></li>
                <li><a className={footerStyles.footer__linkItem} href="#">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className={footerStyles.footer__bottomBar}>
          <p className={footerStyles.footer__copyright}>
            &copy; {new Date().getFullYear()} Notu.ai. Hak Cipta Dilindungi.
          </p>
          <div className={footerStyles.footer__legalLinks}>
            <a href="#">Privasi</a>
            <a href="#">Ketentuan</a>
            <a href="#">Status Sistem</a>
          </div>
        </div>
        
      </div>
    </footer>
  );
}
