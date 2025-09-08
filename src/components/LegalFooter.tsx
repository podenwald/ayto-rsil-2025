import { useState } from 'react'

export default function LegalFooter() {
  const [showImpressum, setShowImpressum] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <>
      <footer style={{
        marginTop: '2rem',
        padding: '12px 16px',
        borderTop: '1px solid #e5e7eb',
        color: '#4b5563',
        fontSize: '12px',
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <span>© {new Date().getFullYear()} AYTO RSIL 2025</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <button onClick={() => setShowImpressum(true)} style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Impressum</button>
        <span style={{ opacity: 0.5 }}>·</span>
        <button onClick={() => setShowPrivacy(true)} style={{ color: '#2563eb', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Datenschutz</button>
      </footer>

      {showImpressum && (
        <div role="dialog" aria-modal="true" onClick={() => setShowImpressum(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', maxWidth: 640, width: '90%', padding: 20, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Impressum</h3>
              <button onClick={() => setShowImpressum(false)} aria-label="Schließen" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              <p style={{ margin: '8px 0' }}><strong>Angaben gemäß § 5 TMG</strong></p>
              <p style={{ margin: '8px 0' }}>Patrick Odenwald</p>
              <p style={{ margin: '8px 0' }}>📧 E-Mail: <a href="mailto:ayto-rsil-2025@patrick-odenwald.de">ayto-rsil-2025@patrick-odenwald.de</a></p>
              <p style={{ margin: '8px 0' }}>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Patrick Odenwald, Adresse wie oben</p>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div role="dialog" aria-modal="true" onClick={() => setShowPrivacy(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', maxWidth: 720, width: '90%', padding: 20, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Datenschutzerklärung</h3>
              <button onClick={() => setShowPrivacy(false)} aria-label="Schließen" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              <p style={{ margin: '8px 0' }}><strong>1. Verantwortlicher</strong><br/>Patrick Odenwald<br/>Adresse wie im Impressum<br/>E-Mail: <a href="mailto:ayto-rsil-2025@patrick-odenwald.de">ayto-rsil-2025@patrick-odenwald.de</a></p>
              <p style={{ margin: '8px 0' }}><strong>2. Erhebung und Speicherung personenbezogener Daten</strong><br/>Beim Besuch der Website werden automatisch Daten wie IP-Adresse, Browsertyp und Zeitpunkt erfasst (Server-Logs). Eine weitergehende Verarbeitung findet nicht statt.</p>
              <p style={{ margin: '8px 0' }}><strong>3. Cookies</strong><br/>Diese Website verwendet keine Cookies, außer technisch notwendige (z. B. Session-Cookies).</p>
              <p style={{ margin: '8px 0' }}><strong>4. Nutzung von GitHub für Feedback</strong><br/>Für Feedback verweisen wir auf GitHub Issues. Bitte beachten: Daten unterliegen den Datenschutzbestimmungen von GitHub (GitHub Inc.).</p>
              <p style={{ margin: '8px 0' }}><strong>5. Social Media</strong><br/>Wir nutzen ggf. Social-Media-Kanäle (z. B. Instagram, LinkedIn, TikTok). Bei Besuch unserer Profile gelten die Datenschutzbestimmungen der jeweiligen Plattformen.</p>
              <p style={{ margin: '8px 0' }}><strong>6. Ihre Rechte</strong><br/>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. Wenden Sie sich dazu an die im Impressum angegebene E-Mail-Adresse.</p>
              <p style={{ margin: '8px 0' }}><strong>7. Stand</strong><br/>Diese Datenschutzerklärung hat den Stand: 08.09.2025</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
