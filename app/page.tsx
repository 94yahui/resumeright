'use client'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LandingAnalysisSection from './components/LandingAnalysisSection'
import Templates from './components/Templates'
import AISection from './components/AISection'
import ResumeTips from './components/ResumeTips'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import UploadModal from './components/UploadModal'
import ScrollObserver from './components/ScrollObserver'
import GradPromo from './components/GradPromo'

export default function Home() {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <ScrollObserver />
      <GradPromo />
      <Navbar onUploadClick={() => setUploadOpen(true)} />
      <main>
        <Hero onUploadClick={() => setUploadOpen(true)} />
        <LandingAnalysisSection />
        <Templates />
        <AISection />
        <ResumeTips />
        <Pricing />
      </main>
      <Footer />
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </>
  )
}
