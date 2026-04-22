'use client';

import { useState } from 'react';
import Link from 'next/link';
import s from './legal.module.css';

export default function LegalClient() {
  const [lang, setLang] = useState<'en' | 'it'>('en');
  const it = lang === 'it';

  return (
    <div className={s.page}>
      {/* Hero */}
      <div className={s.pageHero}>
        <div className={s.pageTag}>{it ? 'Documenti Legali' : 'Legal Documents'}</div>
        <h1>{it ? 'Privacy & Termini' : 'Privacy & Terms'}</h1>
        <p>{it ? 'La nostra informativa sulla privacy e i termini di servizio.' : 'Our privacy policy and terms of service.'}</p>
        <span className={s.updateBadge}>{it ? 'Aggiornati: aprile 2026' : 'Updated: April 2026'}</span>
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setLang(it ? 'en' : 'it')}
            style={{
              background: '#F07B1D', color: '#fff', border: 'none',
              borderRadius: 12, padding: '8px 22px', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14,
            }}
          >
            {it ? '🇬🇧 English' : '🇮🇹 Italiano'}
          </button>
        </div>
      </div>

      {/* Anchor nav */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '20px 24px 0', flexWrap: 'wrap' }}>
        <a href="#privacy" style={{ color: '#F07B1D', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
          {it ? '↓ Privacy Policy' : '↓ Privacy Policy'}
        </a>
        <a href="#terms" style={{ color: '#F07B1D', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
          {it ? '↓ Termini di Servizio' : '↓ Terms of Service'}
        </a>
      </div>

      <div className={s.docWrap}>

        {/* ═══════════════════ PRIVACY POLICY ═══════════════════ */}
        <div id="privacy" style={{ scrollMarginTop: 32 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 32, color: '#111', letterSpacing: -1, marginBottom: 8 }}>
            {it ? 'Informativa sulla Privacy' : 'Privacy Policy'}
          </h1>
          <p style={{ color: '#aaa', fontSize: 14, marginBottom: 40 }}>
            {it ? 'Come raccogliamo, usiamo e proteggiamo i tuoi dati personali su JES.' : 'How we collect, use, and protect your personal data on JES.'}
          </p>
        </div>

        <div className={s.docSection}>
          <p>
            {it
              ? 'JES ("noi", "la Piattaforma", "il Titolare") è un social network per artisti e creativi. La presente Informativa sulla Privacy ("Informativa") è redatta ai sensi del Regolamento UE 2016/679 ("GDPR") e del D.Lgs. 196/2003, come modificato dal D.Lgs. 101/2018. Utilizzando la Piattaforma, l\'utente riconosce e accetta la presente Informativa.'
              : 'JES ("we", "the Platform", "the Controller") is a social network for artists and creatives. This Privacy Policy ("Policy") is drafted pursuant to EU Regulation 2016/679 ("GDPR") and Italian Legislative Decree 196/2003 as amended by D.Lgs. 101/2018. By using the Platform, you acknowledge and accept this Policy.'}
          </p>
          <div className={s.infoBox}>
            <p>
              <strong>{it ? 'Titolare del trattamento:' : 'Data Controller:'}</strong><br />
              GB Studio S.r.l. — {it ? 'gestore della piattaforma JES' : 'operator of the JES platform'}<br />
              P.IVA / C.F.: 03160850164<br />
              {it ? 'Email: ' : 'Email: '}
              <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>
            </p>
          </div>
        </div>

        <div className={s.docSection}>
          <h2><span className={s.num}>1</span> {it ? 'Dati personali trattati' : 'Personal data processed'}</h2>

          <p><strong>{it ? '1.1 Dati di registrazione e profilo' : '1.1 Registration and profile data'}</strong></p>
          <ul>
            <li>{it ? 'Indirizzo email (autenticazione e comunicazioni di servizio)' : 'Email address (authentication and service communications)'}</li>
            <li>{it ? 'Password (conservata in forma hash — mai leggibile da noi)' : 'Password (stored hashed — never readable by us)'}</li>
            <li>{it ? 'Nome/cognome, username, bio, titolo artistico/disciplina' : 'First/last name, username, bio, artistic title/discipline'}</li>
            <li>{it ? 'Numero di telefono (volontario, opzionale)' : 'Phone number (voluntary, optional)'}</li>
            <li>{it ? 'Nazionalità (volontaria, opzionale)' : 'Nationality (voluntary, optional)'}</li>
            <li>{it ? 'Foto profilo fornita volontariamente' : 'Profile photo provided voluntarily'}</li>
            <li>{it ? 'Anno di nascita approssimativo (non visibile pubblicamente)' : 'Approximate birth year (not publicly visible)'}</li>
            <li>{it ? 'Consenso esplicito a ricevere comunicazioni promozionali (accepts_promotions) — opzionale e revocabile in qualsiasi momento' : 'Explicit consent to receive promotional communications (accepts_promotions) — optional and revocable at any time'}</li>
          </ul>

          <p><strong>{it ? '1.2 Contenuti pubblicati' : '1.2 Published content'}</strong></p>
          <ul>
            <li>{it ? 'Post: immagini (fino a 10), didascalie, livello di visibilità, gruppi, tag, hashtag' : 'Posts: images (up to 10), captions, visibility level, groups, tags, hashtags'}</li>
            <li>{it ? 'Storie: immagini effimere (eliminate dopo 30 giorni), link e menzioni' : 'Stories: ephemeral images (deleted after 30 days), links and mentions'}</li>
            <li>{it ? 'Commenti, risposte ai sondaggi, voti' : 'Comments, poll answers, votes'}</li>
            <li>{it ? 'Post nei gruppi/community' : 'Posts in groups/communities'}</li>
            <li>{it ? 'Messaggi diretti (non analizzati automaticamente da noi)' : 'Direct messages (not automatically analysed by us)'}</li>
          </ul>

          <p><strong>{it ? '1.3 Dati di interazione' : '1.3 Interaction data'}</strong></p>
          <ul>
            <li>{it ? 'Like e salvataggi sui contenuti di altri utenti' : 'Likes and saves on other users\' content'}</li>
            <li>{it ? 'Like sulle storie' : 'Story likes'}</li>
            <li>{it ? 'Relazioni di follow (follower/following)' : 'Follow relationships (followers/following)'}</li>
            <li>{it ? 'Appartenenza a gruppi e community' : 'Group and community memberships'}</li>
            <li>{it ? 'Segnalazioni (report) di contenuti o utenti' : 'Reports of content or users'}</li>
          </ul>

          <p><strong>{it ? '1.4 Dati tecnici' : '1.4 Technical data'}</strong></p>
          <ul>
            <li>{it ? 'Token di sessione conservati nel browser tramite localStorage' : 'Session tokens stored in the browser via localStorage'}</li>
            <li>{it ? 'Timestamp di creazione, modifica e accesso ai contenuti' : 'Content creation, modification and access timestamps'}</li>
            <li>{it ? 'Stato di lettura dei messaggi' : 'Message read status'}</li>
            <li>{it ? 'Log di sistema: indirizzo IP, tipo e versione del browser, sistema operativo (conservati per finalità di sicurezza, massimo 12 mesi)' : 'System logs: IP address, browser type and version, operating system (retained for security purposes, maximum 12 months)'}</li>
          </ul>

          <p><strong>{it ? 'Dati che NON raccogliamo' : 'Data we do NOT collect'}</strong></p>
          <ul>
            <li>{it ? 'Dati di geolocalizzazione o GPS' : 'Geolocation or GPS data'}</li>
            <li>{it ? 'Identificatori pubblicitari del dispositivo (IDFA/GAID)' : 'Device advertising identifiers (IDFA/GAID)'}</li>
            <li>{it ? 'Dati di navigazione su siti o app di terze parti' : 'Browsing data on third-party sites or apps'}</li>
            <li>{it ? 'Informazioni di pagamento (JES è gratuito)' : 'Payment information (JES is free)'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>2</span> {it ? 'Base giuridica del trattamento' : 'Legal basis for processing'}</h2>
          <ul>
            <li><strong>{it ? 'Esecuzione del contratto (Art. 6(1)(b)):' : 'Performance of a contract (Art. 6(1)(b)):'}</strong> {it ? 'dati di registrazione e contenuti necessari all\'erogazione del servizio' : 'registration data and content necessary to provide the service'}</li>
            <li><strong>{it ? 'Interesse legittimo (Art. 6(1)(f)):' : 'Legitimate interest (Art. 6(1)(f)):'}</strong> {it ? 'sicurezza della piattaforma, analisi statistiche aggregate anonimizzate' : 'platform security, anonymised aggregate statistical analysis'}</li>
            <li><strong>{it ? 'Consenso (Art. 6(1)(a)):' : 'Consent (Art. 6(1)(a)):'}</strong> {it ? 'comunicazioni promozionali (campo accepts_promotions) — revocabile in qualsiasi momento scrivendo a ' : 'promotional communications (accepts_promotions field) — revocable at any time by writing to '}<a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a></li>
            <li><strong>{it ? 'Obbligo legale (Art. 6(1)(c)):' : 'Legal obligation (Art. 6(1)(c)):'}</strong> {it ? 'conservazione richiesta dalla normativa applicabile' : 'retention required by applicable law'}</li>
          </ul>
          <div className={s.infoBox} style={{ marginTop: 20 }}>
            <p>
              <strong>{it ? 'Categorie particolari di dati (Art. 9 GDPR):' : 'Special categories of data (Art. 9 GDPR):'}</strong>{' '}
              {it
                ? 'JES è una piattaforma aperta ad artisti e creativi. Gli utenti possono scegliere di pubblicare contenuti che rivelano, direttamente o indirettamente, opinioni politiche, religiose, filosofiche, orientamento sessuale o condizioni di salute. Tali contenuti costituiscono "dati particolari" ai sensi dell\'Art. 9 GDPR. La loro pubblicazione avviene su iniziativa esclusiva dell\'utente, che, rendendoli pubblici, ne autorizza espressamente il trattamento ai sensi dell\'Art. 9(2)(e). GB Studio S.r.l. non raccoglie né tratta tali dati al di fuori di quanto reso manifesto dall\'utente.'
                : 'JES is an open platform for artists and creatives. Users may choose to publish content that directly or indirectly reveals political, religious or philosophical opinions, sexual orientation, or health conditions. Such content constitutes "special category data" under Art. 9 GDPR. By making it publicly available, the user expressly authorises its processing under Art. 9(2)(e). GB Studio S.r.l. does not collect or process such data beyond what the user has made manifestly public.'}
            </p>
          </div>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>3</span> {it ? 'Finalità del trattamento' : 'Purposes of processing'}</h2>
          <ul>
            <li><strong>{it ? 'Erogazione del servizio:' : 'Service delivery:'}</strong> {it ? 'account, feed, messaggi, gruppi, sondaggi e notifiche' : 'account, feed, messages, groups, polls and notifications'}</li>
            <li><strong>{it ? 'Sicurezza e moderazione:' : 'Security and moderation:'}</strong> {it ? 'rilevamento abusi, gestione segnalazioni, provvedimenti disciplinari, blacklist parole vietate' : 'abuse detection, report management, disciplinary actions, blacklist of prohibited words'}</li>
            <li><strong>{it ? 'Miglioramento della piattaforma:' : 'Platform improvement:'}</strong> {it ? 'analisi statistiche aggregate anonimizzate' : 'anonymised aggregate statistical analysis'}</li>
            <li><strong>{it ? 'Comunicazioni di servizio:' : 'Service communications:'}</strong> {it ? 'email transazionali (reset password, conferma account, avvisi di sicurezza)' : 'transactional emails (password reset, account confirmation, security alerts)'}</li>
            <li><strong>{it ? 'Comunicazioni promozionali:' : 'Promotional communications:'}</strong> {it ? 'newsletter e novità inviate solo agli utenti che hanno dato consenso esplicito tramite accepts_promotions' : 'newsletters and news sent only to users who gave explicit consent via accepts_promotions'}</li>
            <li><strong>{it ? 'Contatto diretto:' : 'Direct contact:'}</strong> {it ? 'utilizzo di telefono e/o email se forniti dall\'utente' : 'use of phone and/or email if provided by the user'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>4</span> {it ? 'Comunicazione a terzi e trasferimenti' : 'Disclosure to third parties and transfers'}</h2>
          <p>{it ? 'Non vendiamo né cediamo i tuoi dati personali a terzi per finalità commerciali. Condividiamo i dati esclusivamente nei seguenti casi:' : 'We do not sell or transfer your personal data to third parties for commercial purposes. We share data exclusively in the following cases:'}</p>
          <ul>
            <li>
              <strong>Supabase Inc. ({it ? 'responsabile del trattamento' : 'data processor'}):</strong> {it ? 'fornitore di infrastruttura per database, autenticazione e storage. Agisce sotto nostro mandato ai sensi dell\'Art. 28 GDPR. I dati possono essere ospitati su server AWS in Europa (eu-central-1) o negli USA con garanzie adeguate: Clausole Contrattuali Standard (SCC) e, ove applicabile, il Data Privacy Framework UE–USA (decisione di adeguatezza della Commissione europea, luglio 2023).' : 'infrastructure provider for database, authentication and storage. Acts under our mandate pursuant to Art. 28 GDPR. Data may be hosted on AWS servers in Europe (eu-central-1) or in the US with adequate safeguards: Standard Contractual Clauses (SCCs) and, where applicable, the EU–US Data Privacy Framework (European Commission adequacy decision, July 2023).'}{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className={s.linkOrange}>Supabase Privacy Policy</a>.
            </li>
            <li><strong>Google LLC (Google Fonts):</strong> {it ? 'al caricamento dei font, l\'indirizzo IP del visitatore è trasmesso ai server di Google LLC (USA). Google è certificata nel Data Privacy Framework UE–USA. Non vengono usati cookie di Google Analytics né tracker pubblicitari di Google.' : 'when fonts are loaded, the visitor\'s IP address is transmitted to Google LLC (USA) servers. Google is certified under the EU–US Data Privacy Framework. No Google Analytics cookies or Google advertising trackers are used.'}</li>
            <li><strong>{it ? 'Partner sponsor:' : 'Sponsor partners:'}</strong> {it ? 'i post sponsorizzati sono contenuti statici con link esterni. JES non trasmette dati personali agli sponsor (GB Studio, GNG Agency, GES Company, Mercury Auctions).' : 'sponsored posts are static content with external links. JES does not transmit personal data to sponsors (GB Studio, GNG Agency, GES Company, Mercury Auctions).'}</li>
            <li><strong>{it ? 'Autorità competenti:' : 'Competent authorities:'}</strong> {it ? 'ove richiesto dalla legge o da un ordine del tribunale.' : 'where required by law or court order.'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>5</span> {it ? 'Periodo di conservazione' : 'Retention period'}</h2>
          <ul>
            <li><strong>{it ? 'Storie:' : 'Stories:'}</strong> {it ? 'eliminate automaticamente 30 giorni dopo la pubblicazione' : 'automatically deleted 30 days after publication'}</li>
            <li><strong>{it ? 'Contenuti e account attivi:' : 'Content and active accounts:'}</strong> {it ? 'conservati per la durata del rapporto contrattuale' : 'retained for the duration of the contractual relationship'}</li>
            <li><strong>{it ? 'Account eliminati su richiesta:' : 'Accounts deleted on request:'}</strong> {it ? 'rimossi entro 30 giorni, fatti salvi gli obblighi legali di conservazione' : 'removed within 30 days, subject to legal retention obligations'}</li>
            <li><strong>{it ? 'Messaggi diretti:' : 'Direct messages:'}</strong> {it ? 'conservati finché almeno un partecipante mantiene un account attivo' : 'retained while at least one participant keeps an active account'}</li>
            <li><strong>{it ? 'Log di sicurezza:' : 'Security logs:'}</strong> {it ? 'massimo 12 mesi' : 'maximum 12 months'}</li>
            <li><strong>{it ? 'Dati promozionali (email, telefono):' : 'Promotional data (email, phone):'}</strong> {it ? 'fino alla revoca del consenso o all\'eliminazione dell\'account' : 'until consent is revoked or account is deleted'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>6</span> {it ? 'I tuoi diritti (Artt. 15–21 GDPR)' : 'Your rights (Arts. 15–21 GDPR)'}</h2>
          <p>{it ? 'In qualità di interessato, hai i seguenti diritti:' : 'As a data subject, you have the following rights:'}</p>
          <ul>
            <li><strong>{it ? 'Accesso (Art. 15):' : 'Access (Art. 15):'}</strong> {it ? 'richiedere una copia dei dati che ti riguardano' : 'request a copy of the data concerning you'}</li>
            <li><strong>{it ? 'Rettifica (Art. 16):' : 'Rectification (Art. 16):'}</strong> {it ? 'correzione di dati inesatti o incompleti' : 'correction of inaccurate or incomplete data'}</li>
            <li><strong>{it ? 'Cancellazione — "diritto all\'oblio" (Art. 17):' : 'Erasure — "right to be forgotten" (Art. 17):'}</strong> {it ? 'eliminazione dell\'account e di tutti i dati associati' : 'deletion of account and all associated data'}</li>
            <li><strong>{it ? 'Limitazione del trattamento (Art. 18):' : 'Restriction of processing (Art. 18):'}</strong> {it ? 'sospensione del trattamento in determinati casi' : 'suspension of processing in certain cases'}</li>
            <li><strong>{it ? 'Portabilità dei dati (Art. 20):' : 'Data portability (Art. 20):'}</strong> {it ? 'ricevere i dati in formato strutturato e leggibile da macchina' : 'receive data in a structured, machine-readable format'}</li>
            <li><strong>{it ? 'Opposizione (Art. 21):' : 'Objection (Art. 21):'}</strong> {it ? 'opporsi al trattamento basato su interesse legittimo' : 'object to processing based on legitimate interest'}</li>
            <li><strong>{it ? 'Limitazione del trattamento (Art. 18):' : 'Restriction of processing (Art. 18):'}</strong> {it ? 'sospensione del trattamento in determinati casi previsti dalla legge (es. contestazione dell\'esattezza dei dati)' : 'suspension of processing in certain cases provided for by law (e.g. contestation of data accuracy)'}</li>
            <li><strong>{it ? 'Opposizione al marketing diretto (Art. 21(2)):' : 'Objection to direct marketing (Art. 21(2)):'}</strong> {it ? 'puoi opporti in qualsiasi momento al trattamento dei tuoi dati per finalità di marketing diretto, inclusa la profilazione. L\'opposizione è assoluta e non richiede motivazione.' : 'you may object at any time to the processing of your data for direct marketing purposes, including profiling. The objection is absolute and requires no justification.'}</li>
            <li><strong>{it ? 'Revoca del consenso promozionale:' : 'Withdrawal of promotional consent:'}</strong> {it ? 'in qualsiasi momento, senza pregiudicare l\'accesso al servizio' : 'at any time, without affecting access to the service'}</li>
          </ul>
          <p>
            {it ? 'Per esercitare i tuoi diritti, scrivi a ' : 'To exercise your rights, write to '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>.{' '}
            {it ? 'Risponderemo entro ' : 'We will respond within '}<strong>30 {it ? 'giorni' : 'days'}</strong>.
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>7</span> {it ? 'Cookie e tecnologie di tracciamento' : 'Cookies and tracking technologies'}</h2>
          <p>
            {it ? 'Il sito ' : 'The site '}<strong><Link href="/" className={s.linkOrange}>jessocial.com</Link></strong>{' '}
            {it ? 'non utilizza cookie di profilazione né tracker pubblicitari di terze parti. Utilizziamo esclusivamente:' : 'does not use profiling cookies or third-party advertising trackers. We use only:'}
          </p>
          <ul>
            <li><strong>{it ? 'Cookie tecnici di sessione:' : 'Technical session cookies:'}</strong> {it ? 'strettamente necessari per l\'autenticazione — esenti da consenso ai sensi della Direttiva ePrivacy (2002/58/CE)' : 'strictly necessary for authentication — exempt from consent requirements under the ePrivacy Directive (2002/58/EC)'}</li>
            <li><strong>localStorage:</strong> {it ? 'archiviazione locale del token di sessione sul dispositivo dell\'utente — non trasmesso a terzi' : 'local storage of the session token on the user\'s device — not transmitted to third parties'}</li>
          </ul>
          <p style={{ fontSize: 14 }}>
            {it
              ? 'Non utilizziamo cookie analitici, cookie di profilazione né tracker pubblicitari di terze parti. Il passaggio dell\'indirizzo IP a Google LLC per il caricamento dei font (Google Fonts) è l\'unico trasferimento tecnico verso un soggetto terzo ed è dettagliato nella Sezione 4. Non è richiesto il consenso ai cookie per accedere o utilizzare la Piattaforma.'
              : 'We do not use analytical cookies, profiling cookies or third-party advertising trackers. The transmission of the IP address to Google LLC for font loading (Google Fonts) is the only technical transfer to a third party and is detailed in Section 4. No cookie consent is required to access or use the Platform.'}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>8</span> {it ? 'Misure di sicurezza' : 'Security measures'}</h2>
          <p>{it ? 'Adottiamo misure tecniche e organizzative adeguate ai sensi dell\'Art. 32 GDPR:' : 'We adopt appropriate technical and organisational measures pursuant to Art. 32 GDPR:'}</p>
          <ul>
            <li>{it ? 'Cifratura in transito (HTTPS/TLS 1.2+)' : 'Encryption in transit (HTTPS/TLS 1.2+)'}</li>
            <li>{it ? 'Hashing delle password (bcrypt)' : 'Password hashing (bcrypt)'}</li>
            <li>{it ? 'Row-Level Security (RLS) sul database' : 'Row-Level Security (RLS) on the database'}</li>
            <li>{it ? 'Accesso al pannello admin limitato agli utenti con ruolo admin' : 'Admin panel access restricted to users with the admin role'}</li>
            <li>{it ? 'Accesso ai dati limitato al personale autorizzato con principio del minimo privilegio' : 'Data access limited to authorised personnel on a least-privilege basis'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>9</span> {it ? 'Minori' : 'Minors'}</h2>
          <p>
            {it ? 'JES è riservato alle persone di età pari o superiore a ' : 'JES is reserved for persons aged '}<strong>16 {it ? 'anni' : 'or over'}</strong>.{' '}
            {it ? 'Non raccogliamo consapevolmente dati di minori di 16 anni. Se ne venissimo a conoscenza, elimineremo immediatamente l\'account e tutti i dati associati. Segnalazioni a ' : 'We do not knowingly collect data from minors under 16. If we become aware of such data, we will immediately delete the account and all associated data. Reports to '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>.
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>10</span> {it ? 'Aggiornamenti della presente Informativa' : 'Updates to this Policy'}</h2>
          <p>
            {it ? 'Il Titolare si riserva il diritto di aggiornare la presente Informativa. In caso di modifiche sostanziali, gli utenti registrati saranno informati via email o notifica in-app almeno ' : 'The Controller reserves the right to update this Policy. In the event of material changes, registered users will be notified by email or in-app notification at least '}
            <strong>14 {it ? 'giorni' : 'days'}</strong>{' '}
            {it ? 'prima dell\'entrata in vigore delle modifiche.' : 'before the changes take effect.'}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>11</span> {it ? 'Contatti e diritto di reclamo' : 'Contact and right to lodge a complaint'}</h2>
          <ul>
            <li>{it ? 'Email: ' : 'Email: '}<a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a></li>
            <li>{it ? 'Sito web: ' : 'Website: '}<Link href="/" className={s.linkOrange}>jessocial.com</Link></li>
          </ul>
          <p>
            {it ? 'Hai inoltre il diritto di presentare reclamo al Garante per la protezione dei dati personali (' : 'You also have the right to lodge a complaint with the Italian Data Protection Authority (Garante Privacy — '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className={s.linkOrange}>garanteprivacy.it</a>).
          </p>
        </div>

        {/* ═══════════════════ TERMS OF SERVICE ═══════════════════ */}
        <div className={s.dividerLine} style={{ marginTop: 80 }} />
        <div id="terms" style={{ scrollMarginTop: 32 }}>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 32, color: '#111', letterSpacing: -1, marginBottom: 8 }}>
            {it ? 'Termini di Servizio' : 'Terms of Service'}
          </h1>
          <p style={{ color: '#aaa', fontSize: 14, marginBottom: 40 }}>
            {it ? 'Le condizioni che regolano l\'utilizzo di JES.' : 'The conditions governing your use of JES.'}
          </p>
        </div>

        <div className={s.docSection}>
          <p>
            {it
              ? "I presenti Termini di Servizio (\"Termini\") costituiscono un accordo legalmente vincolante tra l'utente (\"tu\", \"Utente\") e JES — Il Social delle Emozioni (\"JES\", \"noi\", \"la Piattaforma\") e disciplinano l'accesso e l'utilizzo del servizio disponibile su"
              : 'These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and JES — The Social of Emotions ("JES", "we", "the Platform") and govern your access to and use of the service available at'}{' '}
            <strong><Link href="/" className={s.linkOrange}>jessocial.com</Link></strong>.
          </p>
          <p>
            {it
              ? "Accedendo o utilizzando JES, dichiari di aver letto, compreso e accettato integralmente i presenti Termini e la nostra"
              : 'By accessing or using JES, you declare that you have read, understood and fully accepted these Terms and our'}{' '}
            <a href="#privacy" className={s.linkOrange}>{it ? 'Informativa sulla Privacy' : 'Privacy Policy'}</a>
            {it ? '. Se non accetti i Termini, non puoi accedere né utilizzare la Piattaforma.' : '. If you do not accept the Terms, you may not access or use the Platform.'}
          </p>
        </div>

        <div className={s.docSection}>
          <h2><span className={s.num}>1</span> {it ? '1. Requisiti per l\'utilizzo' : '1. Eligibility'}</h2>
          <p>{it ? 'Puoi registrarti e utilizzare JES solo se:' : 'You may register and use JES only if you:'}</p>
          <ul>
            <li>{it ? 'Hai compiuto 16 anni di età' : 'Are at least 16 years old'}</li>
            <li>{it ? 'Hai la capacità giuridica necessaria per accettare un accordo vincolante' : 'Have the legal capacity to enter into a binding agreement'}</li>
            <li>{it ? 'Non ti è stato in precedenza sospeso o bannato permanentemente da JES' : 'Have not previously been suspended or permanently banned from JES'}</li>
            <li>{it ? 'Non risiedi in un paese soggetto a embargo ai sensi della normativa UE o statunitense' : 'Do not reside in a country subject to embargo under European Union or United States law'}</li>
          </ul>
          <p>{it ? 'Gli utenti tra 16 e 17 anni devono ottenere il preventivo consenso di un genitore o tutore legale. Registrandosi, dichiarano implicitamente di disporre di tale consenso.' : 'Users between 16 and 17 years old must obtain prior consent from a parent or legal guardian. By registering, they implicitly declare that they have such consent.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>2</span> {it ? '2. Account e responsabilità dell\'utente' : '2. Account & User Responsibility'}</h2>
          <ul>
            <li>{it ? 'Sei l\'unico responsabile della custodia delle credenziali di accesso (email e password)' : 'You are solely responsible for keeping your login credentials (email and password) secure'}</li>
            <li>{it ? 'Ogni persona fisica può registrare un solo account attivo' : 'Each individual may register only one active account'}</li>
            <li>{it ? 'Le informazioni del profilo devono essere veritiere, accurate e non fuorvianti' : 'Profile information must be truthful, accurate and not misleading'}</li>
            <li>{it ? 'È vietato impersonare altre persone, brand, personaggi pubblici o account ufficiali, incluso @jes_official' : 'Impersonating other people, brands, public figures or official accounts, including @jes_official, is prohibited'}</li>
            <li>{it ? 'Sei responsabile di tutte le attività compiute tramite il tuo account' : 'You are responsible for all activities carried out through your account'}</li>
            <li>{it ? 'Il numero di telefono e la nazionalità, se forniti, devono essere veritieri' : 'Phone number and nationality, if provided, must be truthful'}</li>
          </ul>
          <p>
            {it ? 'In caso di accesso non autorizzato, notificaci immediatamente a ' : 'In the event of unauthorised access, notify us immediately at '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>
            {it ? '. JES non è responsabile dei danni derivanti dalla mancata notifica tempestiva.' : '. JES is not responsible for damages arising from failure to notify in a timely manner.'}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>3</span> {it ? '3. Contenuti dell\'utente' : '3. User Content'}</h2>
          <p>{it ? 'Sei l\'unico responsabile dei contenuti che pubblichi su JES — post, storie, commenti, messaggi diretti, sondaggi, post nei gruppi — e dichiari che tali contenuti non violano diritti di terzi né la normativa applicabile.' : 'You are solely responsible for the content you publish on JES — posts, stories, comments, direct messages, polls, group posts — and you declare that such content does not violate third-party rights or applicable law.'}</p>
          <p><strong>{it ? 'Licenza d\'uso:' : 'Licence:'}</strong> {it ? 'pubblicando contenuti su JES, ci concedi una licenza mondiale, non esclusiva, gratuita, sub-licenziabile e trasferibile, per riprodurre, distribuire, visualizzare e rendere disponibili tali contenuti esclusivamente nell\'ambito del funzionamento della Piattaforma. Non utilizziamo i tuoi contenuti per finalità pubblicitarie esterne né per addestrare modelli di intelligenza artificiale.' : 'By publishing content on JES, you grant us a worldwide, non-exclusive, royalty-free, sublicensable and transferable licence to reproduce, distribute, display and make available such content solely within the operation of the Platform. We do not use your content for external advertising purposes or to train artificial intelligence models.'}</p>
          <p><strong>{it ? 'Titolarità:' : 'Ownership:'}</strong> {it ? 'JES non acquisisce la proprietà sui tuoi contenuti. Eliminando un contenuto o il tuo account, la licenza decade automaticamente.' : 'JES does not acquire ownership of your content. By deleting content or your account, the above licence automatically terminates.'}</p>
          <p><strong>{it ? 'Storie:' : 'Stories:'}</strong> {it ? 'vengono eliminate automaticamente 24 ore dopo la pubblicazione.' : 'are automatically deleted 24 hours after publication.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>4</span> {it ? '4. Comportamenti vietati' : '4. Prohibited Conduct'}</h2>
          <div className={s.warningBox}>
            <p><strong>{it ? 'La violazione di queste regole può comportare la sospensione o il ban permanente dell\'account, senza diritto a rimborso.' : 'Violations of these rules may result in account suspension or permanent ban, without any right to reimbursement.'}</strong></p>
          </div>
          <p>{it ? 'È espressamente vietato:' : 'The following are expressly prohibited:'}</p>
          <ul>
            <li>{it ? 'Pubblicare contenuti illegali, diffamatori, osceni, violenti, pornografici o che incitino all\'odio o alla discriminazione' : 'Publishing illegal, defamatory, obscene, violent, pornographic content or content that incites hatred or discrimination'}</li>
            <li>{it ? 'Molestare, minacciare, perseguitare o intimidire altri utenti (cyberbullismo)' : 'Harassing, threatening, stalking or intimidating other users (cyberbullying)'}</li>
            <li>{it ? 'Pubblicare o distribuire materiale pedopornografico (CSAM) — sarà denunciato immediatamente alle autorità competenti' : 'Publishing or distributing child sexual abuse material (CSAM) — this will be immediately reported to the competent authorities'}</li>
            <li>{it ? 'Diffondere spam, utilizzare bot automatizzati, creare account falsi o condurre engagement artificiale' : 'Spreading spam, using automated bots, creating fake accounts or conducting artificial engagement activities'}</li>
            <li>{it ? 'Violare diritti di proprietà intellettuale di terzi (copyright, marchi, brevetti)' : 'Infringing third-party intellectual property rights (copyright, trademarks, patents)'}</li>
            <li>{it ? 'Tentare di accedere senza autorizzazione a sistemi, dati o account altrui' : 'Attempting to gain unauthorised access to systems, data or third-party accounts'}</li>
            <li>{it ? 'Creare nuovi account per eludere provvedimenti di sospensione già irrogati' : 'Creating new accounts to evade previously imposed suspension measures'}</li>
            <li>{it ? 'Raccogliere dati personali di altri utenti senza consenso (scraping, harvesting)' : 'Collecting personal data of other users without their consent (scraping, harvesting)'}</li>
            <li>{it ? 'Pubblicare informazioni personali di terzi senza consenso (doxing)' : 'Publishing personal information of third parties without consent (doxing)'}</li>
            <li>{it ? 'Utilizzare la Piattaforma per phishing, distribuzione di malware o attività fraudolente' : 'Using the Platform for phishing, malware distribution or other fraudulent activities'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>5</span> {it ? '5. Moderazione e provvedimenti disciplinari' : '5. Moderation & Enforcement'}</h2>
          <p>{it ? 'JES si riserva il diritto insindacabile di:' : 'JES reserves the unquestionable right to:'}</p>
          <ul>
            <li>{it ? 'Rimuovere qualsiasi contenuto che violi i presenti Termini o la normativa vigente' : 'Remove any content that violates these Terms or applicable law'}</li>
            <li>{it ? 'Sospendere temporaneamente o bannare definitivamente l\'account in caso di violazioni gravi o reiterate, anche senza preavviso in caso di urgenza (es. CSAM, attacchi informatici, frodi)' : 'Temporarily suspend or permanently ban accounts for serious or repeated violations, without prior notice where urgent action is required (e.g. CSAM, cyberattacks, fraud)'}</li>
            <li>{it ? 'Limitare determinate funzionalità per specifici account' : 'Restrict certain features for specific accounts'}</li>
            <li>{it ? 'Segnalare alle autorità competenti i contenuti illegali, in particolare il materiale CSAM' : 'Report illegal content to the competent authorities, in particular CSAM material'}</li>
          </ul>
          <p>
            {it ? 'Per contestare un provvedimento di sospensione, invia una comunicazione motivata a ' : 'To appeal a suspension, send a reasoned communication to '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>{' '}
            {it ? 'entro 30 giorni dalla notifica. JES risponderà entro 30 giorni lavorativi.' : 'within 30 days of notification. JES will respond within 30 working days.'}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>6</span> {it ? '6. Gruppi e Community' : '6. Groups & Communities'}</h2>
          <p>{it ? 'JES consente agli utenti di creare e partecipare a gruppi e community tematiche. All\'interno dei gruppi si applicano i medesimi Termini e Linee Guida della Community. JES si riserva il diritto di rimuovere qualsiasi gruppo che violi i presenti Termini.' : 'JES allows users to create and participate in themed groups and communities. The same Terms and Community Guidelines apply within groups. JES reserves the right to remove any group that violates these Terms.'}</p>
          <p>{it ? 'Gli amministratori dei gruppi sono utenti con permessi aggiuntivi di moderazione all\'interno del proprio spazio. Non agiscono in qualità di "Responsabili del trattamento" ai sensi dell\'Art. 28 GDPR: GB Studio S.r.l. rimane l\'unico Titolare del trattamento dei dati personali presenti sulla Piattaforma. Gli admin dei gruppi sono responsabili delle proprie azioni di moderazione e rispondono in proprio per qualsiasi violazione dei presenti Termini commessa nell\'esercizio di tali funzioni.' : 'Group administrators are users with additional moderation permissions within their own space. They do not act as "data processors" under Art. 28 GDPR: GB Studio S.r.l. remains the sole data controller for all personal data on the Platform. Group admins are responsible for their own moderation actions and are personally liable for any breach of these Terms committed in the exercise of such functions.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>7</span> {it ? '7. Proprietà intellettuale di JES' : '7. JES Intellectual Property'}</h2>
          <p>{it ? 'Il nome "JES", il marchio, il logo, il design della Piattaforma, il codice sorgente e tutti gli altri elementi distintivi sono di esclusiva proprietà di JES e protetti dalla normativa vigente in materia di proprietà intellettuale.' : 'The name "JES", the trademark, logo, Platform design, source code, editorial texts and all other distinctive elements are the exclusive property of JES and protected by applicable intellectual property law.'}</p>
          <p>{it ? 'È vietata qualsiasi riproduzione, modifica, distribuzione o utilizzo commerciale senza preventiva autorizzazione scritta di JES.' : 'Any reproduction, modification, distribution or commercial use without prior written authorisation from JES is prohibited.'}</p>
          <p>{it ? 'L\'account @jes_official è l\'unico profilo ufficiale di JES sulla Piattaforma.' : 'The @jes_official account is the only official JES profile on the Platform.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>8</span> {it ? '8. Contenuti sponsorizzati e link a siti terzi' : '8. Sponsored Content & Third-Party Links'}</h2>
          <p>{it ? 'Il feed di JES può includere post sponsorizzati di partner selezionati (GB Studio, GNG Agency, GES Company, Mercury Auctions), chiaramente identificati come tali. JES non è responsabile dei prodotti, servizi o contenuti dei siti di terzi raggiungibili tramite tali link.' : 'The JES feed may include sponsored posts from selected partners (GB Studio, GNG Agency, GES Company, Mercury Auctions), clearly identified as such. JES is not responsible for the products, services or content of third-party sites accessible via such links.'}</p>
          <p>{it ? 'I link presenti nelle biografie e nei post degli utenti sono rilevati automaticamente. JES non verifica né garantisce l\'accuratezza o la liceità dei contenuti di siti web esterni.' : 'Links in user bios and posts are detected automatically. JES does not verify or guarantee the accuracy or legality of external website content.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>9</span> {it ? '9. Comunicazioni promozionali' : '9. Promotional Communications'}</h2>
          <p>{it ? 'JES può inviare comunicazioni promozionali, newsletter e aggiornamenti esclusivamente agli utenti che hanno espresso il consenso esplicito durante la registrazione selezionando l\'apposita opzione ("Accetto di ricevere promozioni e novità da JES").' : 'JES may send promotional communications, newsletters and Platform updates exclusively to users who have given explicit consent during registration by selecting the relevant option ("I agree to receive promotions and news from JES").'}</p>
          <p>
            {it ? 'Il consenso è opzionale e non condiziona l\'accesso al servizio. Puoi revocarlo in qualsiasi momento inviando una richiesta a ' : 'Consent is entirely optional and does not affect access to the service. You may withdraw it at any time by sending a request to '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>.
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>10</span> {it ? '10. Disponibilità del servizio' : '10. Service Availability'}</h2>
          <p>{it ? 'JES è erogato "così come disponibile" (as is / as available). Non garantiamo l\'assenza di interruzioni, errori o discontinuità nel servizio. Ci riserviamo il diritto di sospendere, modificare o interrompere il servizio in qualsiasi momento, con o senza preavviso, per manutenzione, aggiornamenti tecnici o qualsiasi altra ragione.' : 'JES is provided "as is / as available". We do not guarantee the absence of interruptions, errors or discontinuities in the service. We reserve the right to suspend, modify or discontinue the service at any time, with or without notice, for maintenance, technical updates or any other reason.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>11</span> {it ? '11. Esclusione e limitazione di responsabilità' : '11. Disclaimer & Limitation of Liability'}</h2>
          <p>{it ? 'Nella misura massima consentita dalla legge applicabile, JES non è responsabile per:' : 'To the maximum extent permitted by applicable law, JES is not liable for:'}</p>
          <ul>
            <li>{it ? 'Danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall\'utilizzo della Piattaforma' : 'Indirect, incidental, special, consequential or punitive damages arising from the use or inability to use the Platform'}</li>
            <li>{it ? 'Contenuti pubblicati dagli utenti' : 'Content published by users'}</li>
            <li>{it ? 'Perdita, alterazione o accesso non autorizzato ai dati causati da comportamenti dell\'utente' : 'Loss, alteration or unauthorised access to data caused by the user\'s own conduct'}</li>
            <li>{it ? 'Interruzioni del servizio derivanti da cause di forza maggiore o da terzi fornitori' : 'Service interruptions arising from force majeure or third-party providers'}</li>
          </ul>
          <p>{it ? 'Ove non derogabili dalla legge, si applicano le disposizioni del Codice del Consumo (D.Lgs. 206/2005) a tutela dei consumatori.' : 'Where not waivable by law, the provisions of the Consumer Code (Legislative Decree 206/2005) apply for the protection of consumers.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>12</span> {it ? '12. Legge applicabile e foro competente' : '12. Governing Law & Jurisdiction'}</h2>
          <p>{it ? 'I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia derivante dai presenti Termini o dall\'utilizzo di JES, il foro competente è il Tribunale di Milano (Italia), fatte salve le disposizioni inderogabili del Codice del Consumo.' : 'These Terms are governed by and construed in accordance with Italian law. For any dispute arising from these Terms or the use of JES, the competent court is the Court of Milan (Italy), without prejudice to any mandatory provisions of the Consumer Code applicable to consumers.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>13</span> {it ? '13. Eliminazione dell\'account' : '13. Account Deletion'}</h2>
          <p>
            {it ? 'Puoi richiedere l\'eliminazione del tuo account in qualsiasi momento dalle impostazioni della Piattaforma oppure inviando richiesta scritta a ' : 'You may request deletion of your account at any time from the Platform settings or by sending a written request to '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>
            {it ? '. L\'eliminazione è irreversibile: post, commenti, messaggi e dati di profilo saranno rimossi entro 30 giorni dalla richiesta.' : '. Deletion is irreversible: posts, comments, messages and profile data will be removed within 30 days of the request.'}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>14</span> {it ? '14. Manleva (Indennizzo)' : '14. Indemnification'}</h2>
          <p>{it ? 'L\'utente si impegna a tenere indenne e manlevare GB Studio S.r.l., i suoi amministratori, dipendenti, collaboratori e aventi causa da qualsiasi pretesa, danno, perdita, responsabilità e spesa (incluse le ragionevoli spese legali) derivanti da:' : 'The user agrees to indemnify and hold harmless GB Studio S.r.l., its directors, employees, collaborators and successors from any claim, damage, loss, liability or expense (including reasonable legal fees) arising from:'}</p>
          <ul>
            <li>{it ? 'Contenuti pubblicati dall\'utente sulla Piattaforma' : 'Content published by the user on the Platform'}</li>
            <li>{it ? 'Violazione dei presenti Termini o della normativa applicabile' : 'Violation of these Terms or applicable law'}</li>
            <li>{it ? 'Violazione di diritti di terzi (inclusi diritti di proprietà intellettuale o diritti della personalità)' : 'Infringement of third-party rights (including intellectual property rights or personality rights)'}</li>
            <li>{it ? 'Utilizzo non autorizzato dell\'account da parte di terzi a causa di negligenza dell\'utente nella custodia delle credenziali' : 'Unauthorised use of the account by third parties due to the user\'s negligence in safeguarding their credentials'}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>15</span> {it ? '15. Modifiche ai Termini' : '15. Changes to the Terms'}</h2>
          <p>{it ? 'JES si riserva il diritto di modificare i presenti Termini in qualsiasi momento. In caso di modifiche sostanziali, gli utenti registrati saranno avvisati via email o tramite notifica in-app almeno 14 giorni prima dell\'entrata in vigore.' : 'JES reserves the right to modify these Terms at any time. In the event of material changes, registered users will be notified by email or in-app notification at least 14 days before the changes take effect.'}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>16</span> {it ? '16. Contatti' : '16. Contact'}</h2>
          <p>{it ? 'Per qualsiasi richiesta relativa ai presenti Termini, alla Privacy o al supporto:' : 'For any enquiry regarding these Terms, Privacy or support:'}</p>
          <ul>
            <li><strong>GB Studio S.r.l.</strong> — P.IVA 03160850164</li>
            <li>{it ? 'Email: ' : 'Email: '}<a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a></li>
            <li>{it ? 'Sito web: ' : 'Website: '}<Link href="/" className={s.linkOrange}>jessocial.com</Link></li>
          </ul>
        </div>

      </div>
    </div>
  );
}
