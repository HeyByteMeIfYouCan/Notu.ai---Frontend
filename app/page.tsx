"use client";
import Image from "next/image";
import Page from "./dashboard/page";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <HeroSection />
      <MarqueeBar />
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

  useEffect(() => {
    const handleScroll = () => setAtTop(window.scrollY < 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={
        `fixed top-0 left-0 w-full z-30 transition-colors duration-300 border-b ` +
        (atTop
          ? "bg-transparent backdrop-blur-none border-transparent text-white"
          : "bg-white backdrop-blur supports-[backdrop-filter]:bg-white/70 border-border text-[#0f1222]")
      }
    >
      <div className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={"/logo.png"} width={30} height={30} alt="logo" />
          <span className="font-semibold">Notu.ai</span>
        </div>
        <nav className={`hidden md:flex items-center gap-6 text-sm ${atTop ? "text-white/80" : "text-[#0f1222]/80"}`}>
          <a className={atTop ? "hover:text-white" : "hover:text-[#0f1222]"} href="#features">Solusi</a>
          <a className={atTop ? "hover:text-white" : "hover:text-[#0f1222]"} href="#how">Fitur</a>
          <a className={atTop ? "hover:text-white" : "hover:text-[#0f1222]"} href="#pricing">Harga</a>
          <a className={atTop ? "hover:text-white" : "hover:text-[#0f1222]"} href="#faq">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          {atTop ? (
            <>
              <Link href="/login" className="h-10 px-4 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 grid place-items-center">Log in</Link>
              <button className="h-10 px-4 rounded-md bg-white text-[#060818] text-sm font-medium hover:bg-white/90">Coba Gratis</button>
            </>
          ) : (
            <>
              <Link href="/login" className="h-10 px-4 rounded-md text-sm text-[#0f1222]/80 hover:text-[#0f1222] grid place-items-center">Log in</Link>
              <button className="h-10 px-4 rounded-md bg-[#0f1222] text-white text-sm font-medium hover:bg-[#121533]">Coba Gratis</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#060818]">
      {/* <StarBackground /> */}
      <div className="bg-[url(/hero-bg.png)]">
        <div className="relative mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-white max-w-xl mx-auto">
            Asisten AI untuk catat otomatis meeting anda
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/70 max-w-2xl mx-auto">
            Fokus pada percakapan, biarkan Notu menangkap ringkasan, aksi, dan insight secara real‑time.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button>Mulai sekarang</Button>
            <Button variant="secondary">Uji coba gratis</Button>
          </div>
          <div className="mt-10 mx-auto max-w-4xl overflow-hidden rounded-[6px] ring-1 ring-white/10">
            <Image src="/hero-features.png" alt="Hero Feature" width={1600} height={900} className="w-full h-auto" />
          </div>
        </div>
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
    { src: "/next.svg", alt: "Next.js" },
    { src: "/vercel.svg", alt: "Vercel" },
    { src: "/globe.svg", alt: "Globe" },
    { src: "/window.svg", alt: "Window" },
    { src: "/file.svg", alt: "File" },
    { src: "/file.svg", alt: "File" },
    { src: "/file.svg", alt: "File" },
    { src: "/file.svg", alt: "File" },
    { src: "/file.svg", alt: "File" },
    { src: "/file.svg", alt: "File" },
    { src: "/file.svg", alt: "File" },
  ];
  return (
    <div className="bg-accent">
      <div className="relative overflow-hidden py-4 container mx-auto">
          <div className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex items-center gap-20 sm:gap-12 md:gap-14 will-change-transform whitespace-nowrap animate-[trusted-marquee_28s_linear_infinite] lg:w-[160%] w-[500%]">
              <div className="flex items-center gap-20 sm:gap-12 md:gap-14 w-1/2">
                {logos.map((l, i) => (
                  <div key={`t-a-${l.alt}-${i}`} className="h-10 sm:h-12 md:h-14 flex items-center">
                    <img src={l.src} alt={l.alt} className="h-8 sm:h-10 md:h-12 w-auto opacity-80 brightness-0 invert" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-20 sm:gap-12 md:gap-14 w-1/2">
                {logos.map((l, i) => (
                  <div key={`t-b-${l.alt}-${i}`} className="h-10 sm:h-12 md:h-14 flex items-center">
                    <img src={l.src} alt={l.alt} className="h-8 sm:h-10 md:h-12 w-auto opacity-80 brightness-0 invert" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{"@keyframes trusted-marquee {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}"}</style>
      </div>
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
    <section id="how" className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-14 md:py-20">
      {/* <SectionTitle center eyebrow="How notu make meetings" title="effortless?" /> */}
      <div className="text-center leading-normal text-2xl lg:text-4xl font-bold">
        <h2>How notu make meetings</h2>
        <h2><span className="text-accent">effortless</span>?</h2>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it,idx)=> (
          <article key={idx} className="flex flex-col items-center text-center relative">
            <div className="relative">
              <Image src={it.i} alt={it.t} width={300} height={300} />
              {idx === 0 && <Image src="/hownout-directionline-1.png" alt="" width={150} height={150} className="absolute top-1/2 left-[90%] hidden lg:block" />}
              {idx === 1 && <Image src="/hownout-directionline-2.png" alt="" width={150} height={150} className="absolute top-1/2 left-[90%] hidden lg:block" />}
            </div>
            <h3 className="mt-4 font-semibold">{it.t}</h3>
            <p className="mt-2 text-sm text-gray-600">{it.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function WhySection(){
  const points = [
    {t:"Real time data", d:"Highlight, ringkasan, dan action items tersedia saat meeting berlangsung."},
    {t:"AI Driven Accuracy", d:"Model bahasa disesuaikan konteks organisasi anda."},
    {t:"Safety Security", d:"Data dienkripsi, kontrol akses granular.", },
    {t:"Integration", d:"Otomatis kirimkan ke Notion, Slack, Jira, dan lainnya."},
  ];
  return (
    <section id="features" className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-6 md:py-4">
      <div className="grid gap-10 lg:grid-cols-2 items-start">
        <div className="order-2">
          {/* <SectionTitle title="Why you should use Notu?" /> */}
          <div className="leading-normal text-2xl lg:text-4xl font-bold">
            <h2><span className="text-accent">Kenapa</span> anda harus menggunakan Notu?</h2>
          </div>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {points.map((p, i)=> (
              <li key={i} className="rounded-[6px] border border-border bg-card p-5">
                <h4 className="font-semibold">{p.t}</h4>
                <p className="mt-1 text-sm text-gray-600">{p.d}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1">
          <Image src="/whyyoushouldusenotu.png" alt="Why Notu" width={500} height={500} />
        </div>
      </div>
    </section>
  );
}

function AllInOneSection(){
  const cards = [
    {t:"Integrated with Online Meeting", d:"Terhubung langsung dengan Google Meet, Zoom, dan lainnya."},
    {t:"Sharing your meeting transcripts", d:"Bagikan ringkasan dan transkrip ke tim hanya dengan sekali klik."},
    {t:"Analytics your meeting", d:"Pantau metrik meeting dan engagement secara berkala."},
  ];
  return (
    <section className="mx-auto w-full container  px-4 sm:px-6 lg:px-8 py-14">
      <div className="leading-normal text-2xl lg:text-4xl font-bold">
            <h2><span className="text-accent">All in one</span> meeting</h2>
            <h2>intelligence?</h2>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2 items-start lg:order-1 order-2">
        <div className="rounded-[6px] border border-border bg-card p-6 order-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((c,i)=> (
              <article key={i} className="rounded-[6px] border border-gray-200 p-4">
                <h4 className="font-semibold">{c.t}</h4>
                <p className="mt-1 text-sm text-gray-600">{c.d}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="lg:order-2 order-1 grid place-items-center">
          <Image src={"/allinonemeeting.png"} width={500} height={500} alt="All in one meeting image" />
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
                  <div className="flex-1 flex items-end">
                    <button
                      className={
                        isHighlight
                        ? "mt-6 h-10 w-full rounded-md text-sm font-medium bg-white text-[#060818]"
                        : "mt-6 h-10 w-full rounded-md text-sm font-medium bg-transparent border border-[#0f1222]/20 text-[#0f1222]"
                      }
                      >
                      {t.cta}
                    </button>
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
