'use client'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Templates from './components/Templates'
import AISection from './components/AISection'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import UploadModal from './components/UploadModal'
import ScrollObserver from './components/ScrollObserver'

export default function Home() {
  const [uploadOpen, setUploadOpen] = useState(false)

  return (
    <>
      <ScrollObserver />
      <Navbar onUploadClick={() => setUploadOpen(true)} />
      <main>
        <Hero onUploadClick={() => setUploadOpen(true)} />
        <Templates />
        <AISection />
        <Pricing />
      </main>
      <Footer />
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
    </>
  )
}
