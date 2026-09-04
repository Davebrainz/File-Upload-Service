import FileUploadService from './FileUploadService.jsx';
import './App.css';
import { useState } from 'react';
import heroAsset from './assets/hero.png';

const features = [
  { number: '01', title: 'Upload without friction', text: 'Send JPG, PNG, WEBP, and PDF files up to 50MB from one focused workspace.' },
  { number: '02', title: 'Get a shareable link', text: 'Every upload becomes a clean link you can share with your team or anywhere online.' },
  { number: '03', title: 'Preview before you share', text: 'View images and PDFs directly in the app so you always know what your recipients will see.' },
  { number: '04', title: 'Stay in control', text: 'Open, download, or copy your file link in one click whenever you need it again.' },
];

function LandingPage({ onEnter }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <a className="brand-mark" href="#top" aria-label="File Upload Service home"><span className="brand-icon" aria-hidden="true">↑</span><span>File Upload Service</span></a>
        <div className="landing-nav-links"><a href="#features">Features</a><a href="#how-it-works">How it works</a></div>
        <button type="button" className="nav-sign-in" onClick={onEnter}>Sign in <span aria-hidden="true">↗</span></button>
      </nav>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <p className="landing-kicker"><span aria-hidden="true">●</span> Simple sharing, thoughtfully made</p>
          <h1>Put your files<br /><em>in motion.</em></h1>
          <p className="hero-intro">A fast, dependable place to upload files, create reshareable links, and keep every handoff moving.</p>
          <div className="hero-actions"><button type="button" className="landing-button primary" onClick={onEnter}>Get started <span aria-hidden="true">↗</span></button><button type="button" className="landing-button text-button" onClick={onEnter}>Sign in to your account <span aria-hidden="true">→</span></button></div>
          <div className="hero-proof"><span className="proof-dot" />No complicated setup <span className="proof-divider">·</span> Files up to 50MB</div>
        </div>
        <div className="hero-visual" aria-label="File upload preview">
          <div className="visual-glow" /><div className="visual-topline"><span>YOUR FILES</span><span className="live-status"><i /> Ready to share</span></div>
          <div className="visual-main"><div className="upload-orbit"><img src={heroAsset} alt="" /></div><p className="visual-title">A clearer way<br />to send things.</p><p className="visual-caption">Upload once. Share everywhere.</p></div>
          <div className="visual-file"><span className="file-type">PDF</span><span className="file-name">project-brief.pdf</span><span className="file-check">✓</span></div>
        </div>
      </section>

      <section className="landing-stats" aria-label="Service highlights"><div><strong>50<span>MB</span></strong><small>Maximum file size</small></div><div><strong>4</strong><small>Supported formats</small></div><div><strong>1<span> click</span></strong><small>To copy your link</small></div><p>Everything you need for<br />a smoother handoff.</p></section>

      <section className="features-section" id="features"><div className="section-heading"><p className="landing-kicker">BUILT FOR THE HANDOFF</p><h2>Less searching.<br /><em>More sharing.</em></h2></div><p className="section-lead">Whether you are sending a finished design, a quick image, or an important document, File Upload Service keeps the process simple from first click to final download.</p><div className="feature-grid">{features.map((feature) => <article className="feature-item" key={feature.number}><span className="feature-number">{feature.number}</span><h3>{feature.title}</h3><p>{feature.text}</p><span className="feature-arrow" aria-hidden="true">↗</span></article>)}</div></section>

      <section className="how-section" id="how-it-works"><div className="how-heading"><p className="landing-kicker">HOW IT WORKS</p><h2>From file<br /><em>to shared.</em></h2></div><div className="steps-list"><div className="step"><span>01</span><div><h3>Choose your file</h3><p>Select a JPG, PNG, WEBP, or PDF from your device.</p></div></div><div className="step"><span>02</span><div><h3>Upload securely</h3><p>Your file is prepared and stored for reliable access.</p></div></div><div className="step"><span>03</span><div><h3>Share the link</h3><p>Copy, open, preview, or download it whenever you need.</p></div></div></div></section>

      <section className="landing-cta"><p className="landing-kicker">READY WHEN YOU ARE</p><h2>Make your next<br /><em>send simpler.</em></h2><button type="button" className="landing-button primary" onClick={onEnter}>Get started free <span aria-hidden="true">↗</span></button></section>
      <footer className="landing-footer"><span>© 2026 File Upload Service Program</span><span>Upload less. Share better.</span></footer>
    </main>
  );
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  return showLanding ? <LandingPage onEnter={() => setShowLanding(false)} /> : <FileUploadService />;
}
