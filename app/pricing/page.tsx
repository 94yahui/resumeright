import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Pricing from "../components/Pricing";

export const metadata = { title: "Pricing — ResumeRight" };

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "60px" }}>
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
