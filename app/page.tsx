import Navbar from "@/components/home/Navbar";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Governance from "@/components/home/Governance";
import ContributionSummary from "@/components/home/ContributionSummary";
import CallToAction from "@/components/home/CallToAction";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Governance />
        <ContributionSummary />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
