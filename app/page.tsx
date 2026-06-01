'use client'
import { useState, useRef } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import LandingAnalysisSection from './components/LandingAnalysisSection'
import Templates from './components/Templates'
import AISection from './components/AISection'
import ResumeTips from './components/ResumeTips'
import Pricing from './components/Pricing'
import Footer from './components/Footer'
import UploadModal from './components/UploadModal'
import WechatLoginModal from './components/WechatLoginModal'
import ScrollObserver from './components/ScrollObserver'
import GradPromo from './components/GradPromo'
import PaymentSuccessToast from './components/PaymentSuccessToast'

export default function Home() {
  const [uploadOpen, setUploadOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const afterLoginRef = useRef<(() => void) | null>(null)

  const openLogin = (afterLogin?: () => void) => {
    afterLoginRef.current = afterLogin ?? null
    setLoginOpen(true)
  }

  const handleLoginSuccess = () => {
    setLoginOpen(false)
    window.dispatchEvent(new Event('rc:login'))
    afterLoginRef.current?.()
    afterLoginRef.current = null
  }

  return (
    <>
      <ScrollObserver />
      <GradPromo onLoginRequest={openLogin} />
      <Navbar onUploadClick={() => setUploadOpen(true)} />
      <main>
        <Hero onUploadClick={() => setUploadOpen(true)} />
        <LandingAnalysisSection onLoginRequest={() => openLogin()} />
        <Templates />
        <AISection />
        <ResumeTips />
        <Pricing onLoginRequest={openLogin} />
      </main>
      <Footer />
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} onLoginRequest={() => openLogin()} />}
      {loginOpen && (
        <WechatLoginModal onClose={() => setLoginOpen(false)} onSuccess={handleLoginSuccess} />
      )}
      <PaymentSuccessToast />
    </>
  )
}
