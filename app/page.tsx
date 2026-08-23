"use client";
import Image from "next/image";
import Page from "./dashboard/page";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ShieldCheck, Activity, Share2, Link2, Users, BarChart } from "lucide-react";
import styles from "./styles/WhySection.module.scss";
import allInOneStyles from "./styles/AllInOneSection.module.scss";

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
            Notu 2.0 Kini Tersedia
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

function StepsSection(){
  const items = [
    {t:"Paste URL meet anda kepada Notu", d:"Notu ikut hadir di Google Meet atau Zoom lalu menyiapkan sesi.", i:"/hownotu-1.png"},
    {t:"Notu akan memproses transkrip", d:"Transkrip, ringkasan, action items, dan highlights dibuat otomatis.", i:"/hownotu-2.png"},
    {t:"Tindak lanjuti hasil meeting", d:"Distribusikan ringkasan, integrasikan ke tools, dan pantau progres.", i:"/hownotu-3.png"},
  ];
  return (
    <section id="how" className="relative mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden bg-slate-50/50">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="text-center leading-tight text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
      >
        <h2>How notu make meetings</h2>
        <h2><span className="text-primary">effortless</span>?</h2>
      </motion.div>
      
      <div className="mx-auto max-w-7xl mt-16 md:mt-24 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 relative z-10">
        {items.map((it,idx)=> (
          <motion.article 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: idx * 0.2, type: "spring", bounce: 0.3 }}
            key={idx} 
            className="flex flex-col items-center text-center relative bg-white/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(107,78,255,0.2)] transition-all duration-300 z-10"
          >
            {/* Elegant SVG Gap Connector - Perfectly bridges the grid gap */}
            {idx < items.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 left-full w-8 z-[-1] pointer-events-none">
                <svg width="100%" height="2" viewBox="0 0 32 2" fill="none" className="overflow-visible">
                  <line x1="0" y1="1" x2="32" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="text-primary/30" />
                </svg>
              </div>
            )}
            
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent text-white font-bold flex items-center justify-center mb-6 text-base shadow-lg shadow-primary/20 ring-4 ring-white">
              0{idx + 1}
            </div>
            
            <div className="relative w-full h-[200px] sm:h-[240px] mb-8">
              <Image src={it.i} alt={it.t} fill className="object-contain drop-shadow-sm hover:scale-105 transition-transform duration-500" />
            </div>
            
            <h3 className="font-semibold text-xl text-[#0f1222]">{it.t}</h3>
            <p className="mt-3 text-sm md:text-base text-gray-500 leading-relaxed max-w-[280px]">{it.d}</p>
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
              <span>Kenapa</span> anda harus menggunakan Notu?
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
                <h4 className={styles.whySection__cardTitle}>{p.t}</h4>
                <p className={styles.whySection__cardDesc}>{p.d}</p>
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
    <section className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-14">
      <div className="leading-normal text-2xl lg:text-4xl font-bold text-center">
            <h2><span className="text-accent">Trusted</span> by company around</h2>
            <h2>the world?</h2>
      </div>
      <div className="mt-8 flex justify-center">
        {/* <div className="h-64 rounded-lg bg-gradient-to-b from-white to-[#f4f3ff]" /> */}
        <Image src={"/trusted-by-company-around-the-world.png"} width={900} height={900} alt="Trusted by company image" />
        
      </div>
      <div className="mt-8 grid grid-cols-3 gap-6 text-center">
        <div>
          <p className="text-xl font-semibold">350+</p>
          <p className="text-xs text-gray-600">Perusahaan menggunakan Notu</p>
        </div>
        <div>
          <p className="text-xl font-semibold">750k</p>
          <p className="text-xs text-gray-600">Users and participants assisted</p>
        </div>
        <div>
          <p className="text-xl font-semibold">24+</p>
          <p className="text-xs text-gray-600">Integrations and add‑ons</p>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection(){
  const quote = "Keren, jadi tidak perlu catat manual lagi!";
  return (
    <section className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-14">
      <div className="leading-normal text-xl lg:text-2xl font-medium text-center">
            <h2><span className="text-accent">Dengar</span> apa kata mereka</h2>
            <h2>yang telah memakai Notu</h2>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({length:6}).map((_,i)=> (
          <figure key={i} className="rounded-[6px] border border-border bg-background p-5">
            <blockquote className="text-sm text-foreground">“{quote}”</blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">Siska • HR</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FAQSection(){
  const faqs = [
    {q:"Apakah saya dapat menggunakan Notu secara gratis?", a:"Ya, tersedia paket gratis dengan fitur inti."},
    {q:"Apakah saya bisa menggunakan Notu untuk meeting secara offline?", a:"Bisa, unggah rekaman audio lalu biarkan Notu memproses."},
    {q:"Bahasa apa yang support oleh Notu?", a:"Bahasa Indonesia, Inggris, dan banyak lagi."},
  ];
  return (
    <section id="faq" className="mx-auto w-full max-w-[800px] px-4 sm:px-6 lg:px-8 py-14">
      <div className="leading-normal text-xl lg:text-2xl font-medium text-center">
            <h2><span className="text-accent">{"(FAQ)"}</span> Pertanyaan yang sering ditanyakan</h2>
      </div>
      {/* <SectionTitle center title="Pertanyaan yang sering ditanyakan" /> */}
      <div className="mt-6 divide-y rounded-[6px] border border-gray-200">
        {faqs.map((f,i)=> (
          <details key={i} className="group">
            <summary className="list-none cursor-pointer select-none px-4 sm:px-6 py-4 flex items-center justify-between">
              <span className="text-sm font-medium text-[#0f1222]">{f.q}</span>
              <span className="ml-4 h-6 w-6 grid place-items-center rounded-md border border-gray-200 text-gray-600 group-open:rotate-180 transition">⌄</span>
            </summary>
            <div className="px-4 sm:px-6 pb-4 text-sm text-gray-600">{f.a}</div>
          </details>
        ))}
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
        "Integrasi dengan platform Notion",
      ],
      cta: "Mulai Sekarang",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="relative bg-[#000212]">
      {/* <StarBackground /> */}
      <div className="bg-[url(/startfromhere-bg.png)] bg-no-repeat bg-cover min-h-screen">
        <div className="relative mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-center text-xl md:text-2xl font-semibold text-white">Notu meeting dimulai dari sini!</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {tiers.map((t,i)=> {
              const isHighlight = t.highlight;
              return (
                <div
                  key={i}
                  className={
                    `${isHighlight
                      ? "rounded-[8px] border-0 bg-accent text-white p-6 shadow-[0_0_40px_0_rgba(107,78,255,0.35)]"
                      : "rounded-[8px] border border-white/15 bg-white text-[#0f1222] p-6"}
                        flex flex-col
                      `
                  }
                >
                  <h3 className={isHighlight?"text-white font-semibold":"text-[#0f1222] font-semibold"}>{t.name}</h3>
                  <div className="mt-2 flex items-end gap-1">
                    <p className={isHighlight?"text-white text-2xl md:text-3xl font-semibold":"text-[#0f1222] text-2xl md:text-3xl font-semibold"}>{t.price}</p>
                    {t.cycle && <span className={isHighlight?"text-white/80":"text-[#0f1222]/80"}>{t.cycle}</span>}
                  </div>
                  <ul className={`mt-4 space-y-6 text-sm ${isHighlight?"text-white/90":"text-[#0f1222]/80"}`}>
                    {t.features.map((f,idx)=> (
                      <li key={idx} className="flex gap-2 items-center">
                        <span className={isHighlight?"bg-white w-6 h-6 grid place-items-center rounded-full text-accent":"bg-accent w-6 h-6 grid place-items-center rounded-full text-white"}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex-1 flex items-end mt-6">
                    <Link href="/login" className="w-full">
                      <button
                        className={
                          isHighlight
                          ? "h-10 w-full rounded-md text-sm font-medium bg-white text-[#060818]"
                          : "h-10 w-full rounded-md text-sm font-medium bg-transparent border border-[#0f1222]/20 text-[#0f1222]"
                        }
                        >
                        {t.cta}
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter(){
  return (
    <footer className="border-t border-white/10 bg-[#060818] text-white/80">
      <div className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={"/logo.png"} width={30} height={30} alt="Logo" />
            <span className="font-semibold text-white">Notu.ai</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-white font-medium">Produk</p>
              <ul className="mt-2 space-y-1">
                <li>Fitur</li>
                <li>Integrasi</li>
                <li>Harga</li>
              </ul>
            </div>
            <div>
              <p className="text-white font-medium">Perusahaan</p>
              <ul className="mt-2 space-y-1">
                <li>Tentang</li>
                <li>Karier</li>
                <li>Kontak</li>
              </ul>
            </div>
            <div>
              <p className="text-white font-medium">Sumber daya</p>
              <ul className="mt-2 space-y-1">
                <li>Blog</li>
                <li>Panduan</li>
                <li>Pusat Bantuan</li>
              </ul>
            </div>
            <div>
              <p className="text-white font-medium">Legal</p>
              <ul className="mt-2 space-y-1">
                <li>Privasi</li>
                <li>Ketentuan</li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 text-xs">All rights reserved © 2025 Notu</p>
      </div>
    </footer>
  );
}
