'use client';

import Link from 'next/link';
import s from '../legal.module.css';

const IT = {
  tag: 'Documenti legali',
  title: 'Termini di Servizio',
  subtitle: 'Le condizioni che regolano l\'utilizzo di JES. Ti preghiamo di leggerle attentamente.',
  updated: 'Aggiornati: aprile 2026',
  intro1: 'I presenti Termini di Servizio ("Termini") costituiscono un accordo legalmente vincolante tra l\'utente ("tu", "Utente") e JES — Il Social delle Emozioni ("JES", "noi", "la Piattaforma") e disciplinano l\'accesso e l\'utilizzo del servizio disponibile su',
  intro2: 'Accedendo o utilizzando JES, dichiari di aver letto, compreso e accettato integralmente i presenti Termini e la nostra',
  intro2b: '. Se non accetti i Termini, non puoi accedere né utilizzare la Piattaforma.',
  privacyLink: 'Privacy Policy',
  s1: '1. Requisiti per l\'utilizzo',
  s1p: 'Puoi registrarti e utilizzare JES solo se:',
  s1l1: 'Hai compiuto 16 anni di età',
  s1l2: 'Hai la capacità giuridica necessaria per accettare un accordo vincolante',
  s1l3: 'Non ti è stato in precedenza sospeso o bannato permanentemente da JES',
  s1l4: 'Non risiedi in un paese soggetto a embargo ai sensi della normativa dell\'Unione Europea o degli Stati Uniti d\'America',
  s1p2: 'Gli utenti di età compresa tra 16 e 17 anni devono ottenere il preventivo consenso di un genitore o tutore legale. Registrandosi, dichiarano implicitamente di disporre di tale consenso. JES si riserva il diritto di richiedere verifica del consenso genitoriale.',
  s2: '2. Account e responsabilità dell\'utente',
  s2l1: 'Sei l\'unico responsabile della custodia delle credenziali di accesso (email e password)',
  s2l2: 'Ogni persona fisica può registrare un solo account attivo',
  s2l3: 'Le informazioni del profilo devono essere veritiere, accurate e non fuorvianti',
  s2l4: 'È vietato impersonare altre persone, brand, personaggi pubblici o account ufficiali, incluso l\'account @jes_official',
  s2l5: 'Sei responsabile di tutte le attività compiute tramite il tuo account',
  s2l6: 'Il numero di telefono e la nazionalità, se forniti, devono essere veritieri',
  s2p: 'In caso di accesso non autorizzato o compromissione dell\'account, notificaci immediatamente a',
  s2p2: '. JES non è responsabile dei danni derivanti dalla mancata notifica tempestiva.',
  s3: '3. Contenuti dell\'utente',
  s3p1: 'Sei l\'unico responsabile dei contenuti che pubblichi su JES — post, storie, commenti, messaggi diretti, sondaggi — e dichiari che tali contenuti non violano diritti di terzi né la normativa applicabile.',
  s3lic: 'Licenza d\'uso:',
  s3p2: 'pubblicando contenuti su JES, ci concedi una licenza mondiale, non esclusiva, gratuita, sub-licenziabile e trasferibile, per riprodurre, distribuire, visualizzare e rendere disponibili tali contenuti esclusivamente nell\'ambito del funzionamento della Piattaforma. Non utilizziamo i tuoi contenuti per finalità pubblicitarie esterne né per addestrare modelli di intelligenza artificiale.',
  s3own: 'Titolarità:',
  s3p3: 'JES non acquisisce la proprietà sui tuoi contenuti. Eliminando un contenuto o il tuo account, la licenza sopra descritta decade automaticamente, fatti salvi i contenuti già condivisi con altri utenti.',
  s3sto: 'Storie:',
  s3p4: 'vengono eliminate automaticamente 24 ore dopo la pubblicazione.',
  s4: '4. Comportamenti vietati',
  s4warn: 'La violazione delle presenti regole può comportare la sospensione o il ban permanente dell\'account, senza diritto a rimborso o compensazione di alcun tipo.',
  s4p: 'È espressamente vietato:',
  s4l1: 'Pubblicare contenuti illegali, diffamatori, osceni, violenti, pornografici o che incitino all\'odio o alla discriminazione',
  s4l2: 'Molestare, minacciare, perseguitare o intimidire altri utenti (cyberbullismo)',
  s4l3: 'Pubblicare o distribuire materiale pedopornografico (CSAM) — il comportamento sarà denunciato immediatamente alle autorità competenti ai sensi della legge',
  s4l4: 'Diffondere spam, utilizzare bot automatizzati, creare account falsi o condurre attività di engagement artificiale',
  s4l5: 'Violare diritti di proprietà intellettuale di terzi (copyright, marchi registrati, brevetti)',
  s4l6: 'Tentare di accedere senza autorizzazione a sistemi, dati o account altrui',
  s4l7: 'Creare nuovi account al fine di eludere provvedimenti di sospensione già irrogati',
  s4l8: 'Raccogliere dati personali di altri utenti senza il loro consenso (scraping, harvesting)',
  s4l9: 'Pubblicare informazioni personali di terzi senza consenso (doxing)',
  s4l10: 'Utilizzare la Piattaforma per attività di phishing, distribuzione di malware o altre attività fraudolente',
  s5: '5. Moderazione e provvedimenti disciplinari',
  s5p: 'JES si riserva il diritto insindacabile di:',
  s5l1: 'Rimuovere qualsiasi contenuto che violi i presenti Termini, le Linee Guida della Community o la normativa vigente',
  s5l2: 'Sospendere temporaneamente o bannare definitivamente l\'account in caso di violazioni gravi o reiterate',
  s5l3: 'Limitare determinate funzionalità per specifici account',
  s5l4: 'Segnalare alle autorità competenti i contenuti illegali, in particolare il materiale CSAM',
  s5p2: 'Un account bannato non può accedere alla Piattaforma. Il tentativo di rientrare attraverso la creazione di un nuovo account costituisce ulteriore violazione dei presenti Termini e può comportare segnalazione all\'autorità.',
  s5p3: 'Per contestare un provvedimento di sospensione, invia una comunicazione motivata a',
  s5p3b: 'entro 30 giorni dalla notifica. JES risponderà entro 30 giorni lavorativi.',
  s6: '6. Proprietà intellettuale di JES',
  s6p1: 'Il nome "JES", il marchio, il logo, il design della Piattaforma, il codice sorgente, i testi redazionali e tutti gli altri elementi distintivi sono di esclusiva proprietà di JES e protetti dalla normativa vigente in materia di proprietà intellettuale e industriale.',
  s6p2: 'È vietata qualsiasi riproduzione, modifica, distribuzione o utilizzo commerciale senza preventiva autorizzazione scritta di JES.',
  s6p3: 'L\'account @jes_official è l\'unico profilo ufficiale di JES sulla Piattaforma. Qualsiasi account che si presenti come ufficiale sarà rimosso senza preavviso.',
  s7: '7. Contenuti sponsorizzati e link a siti terzi',
  s7p1: 'Il feed di JES può includere post sponsorizzati di partner selezionati (es. GBS Immobiliare, GES Company, Mercury Auctions, GNG Agency), chiaramente identificati come tali. JES non è responsabile dei prodotti, servizi o contenuti dei siti di terzi raggiungibili tramite tali link.',
  s7p2: 'I link presenti nelle biografie e nei post degli utenti sono rilevati automaticamente. JES non verifica né garantisce l\'accuratezza o la liceità dei contenuti di siti web esterni.',
  s8: '8. Comunicazioni promozionali',
  s8p1: 'JES può inviare comunicazioni promozionali, newsletter e aggiornamenti sulle novità della Piattaforma esclusivamente agli utenti che hanno espresso il consenso esplicito durante la registrazione selezionando l\'apposita opzione ("Accetto di ricevere promozioni e novità da JES").',
  s8p2: 'Il consenso è del tutto opzionale e non condiziona l\'accesso o il funzionamento del servizio. Puoi revocarlo in qualsiasi momento inviando una richiesta a',
  s8p2b: '. La revoca non pregiudica la liceità del trattamento effettuato fino a quel momento.',
  s9: '9. Disponibilità del servizio',
  s9p: 'JES è erogato "così come disponibile" (as is / as available). Non garantiamo l\'assenza di interruzioni, errori o discontinuità nel servizio. Ci riserviamo il diritto di sospendere, modificare o interrompere il servizio — anche in via definitiva — in qualsiasi momento, con o senza preavviso, per manutenzione, aggiornamenti tecnici o qualsiasi altra ragione.',
  s10: '10. Esclusione e limitazione di responsabilità',
  s10p: 'Nella misura massima consentita dalla legge applicabile, JES non è responsabile per:',
  s10l1: 'Danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall\'utilizzo o dall\'impossibilità di utilizzo della Piattaforma',
  s10l2: 'Contenuti pubblicati dagli utenti',
  s10l3: 'Perdita, alterazione o accesso non autorizzato ai dati causati da comportamenti dell\'utente',
  s10l4: 'Interruzioni del servizio derivanti da cause di forza maggiore o da terzi fornitori',
  s10p2: 'Nessuna disposizione dei presenti Termini limita o esclude la responsabilità di JES per morte o lesioni personali causate da dolo o colpa grave, né per danni da prodotti difettosi ove non derogabile ai sensi della normativa imperativa applicabile.',
  s10p3: 'Ove non derogabili dalla legge, si applicano le disposizioni del Codice del Consumo (D.Lgs. 206/2005) a tutela dei consumatori.',
  s11: '11. Legge applicabile e foro competente',
  s11p: 'I presenti Termini sono regolati dalla legge italiana e interpretati in conformità ad essa. Per qualsiasi controversia derivante dai presenti Termini o dall\'utilizzo di JES, il foro competente è il Tribunale di Milano (Italia), fatte salve le disposizioni inderogabili del Codice del Consumo applicabili agli utenti che agiscono in qualità di consumatori nel proprio paese di residenza.',
  s12: '12. Eliminazione dell\'account',
  s12p1: 'Puoi richiedere l\'eliminazione del tuo account in qualsiasi momento dalle impostazioni della Piattaforma oppure inviando richiesta scritta a',
  s12p1b: '. L\'eliminazione è irreversibile: post, commenti, messaggi e dati di profilo saranno rimossi entro 30 giorni dalla richiesta, fatti salvi i dati da conservare per obbligo legale.',
  s12p2: 'JES si riserva il diritto di eliminare account inattivi da più di 24 mesi, previa notifica via email all\'indirizzo registrato con preavviso di almeno 30 giorni.',
  s13: '13. Modifiche ai Termini',
  s13p: 'JES si riserva il diritto di modificare i presenti Termini in qualsiasi momento. In caso di modifiche sostanziali, gli utenti registrati saranno avvisati via email o tramite notifica in-app almeno 14 giorni prima dell\'entrata in vigore. La versione aggiornata sarà sempre disponibile su questa pagina con indicazione della data di aggiornamento. Il proseguimento dell\'utilizzo della Piattaforma dopo la data di entrata in vigore costituisce accettazione delle modifiche.',
  s14: '14. Contatti',
  s14p: 'Per qualsiasi richiesta relativa ai presenti Termini, alla Privacy o al supporto:',
  s14email: 'Email:',
  s14site: 'Sito web:',
  footerPrivacy: 'Privacy',
  footerTerms: 'Termini',
  footerContact: 'Contatti',
};

const EN = {
  tag: 'Legal Documents',
  title: 'Terms of Service',
  subtitle: 'The conditions governing your use of JES. Please read them carefully.',
  updated: 'Updated: April 2026',
  intro1: 'These Terms of Service ("Terms") constitute a legally binding agreement between you ("User") and JES — The Social of Emotions ("JES", "we", "the Platform") and govern your access to and use of the service available at',
  intro2: 'By accessing or using JES, you declare that you have read, understood and fully accepted these Terms and our',
  intro2b: '. If you do not accept the Terms, you may not access or use the Platform.',
  privacyLink: 'Privacy Policy',
  s1: '1. Eligibility',
  s1p: 'You may register and use JES only if you:',
  s1l1: 'Are at least 16 years old',
  s1l2: 'Have the legal capacity to enter into a binding agreement',
  s1l3: 'Have not previously been suspended or permanently banned from JES',
  s1l4: 'Do not reside in a country subject to embargo under European Union or United States law',
  s1p2: 'Users between 16 and 17 years old must obtain prior consent from a parent or legal guardian. By registering, they implicitly declare that they have such consent. JES reserves the right to request verification of parental consent.',
  s2: '2. Account & User Responsibility',
  s2l1: 'You are solely responsible for keeping your login credentials (email and password) secure',
  s2l2: 'Each individual may register only one active account',
  s2l3: 'Profile information must be truthful, accurate and not misleading',
  s2l4: 'Impersonating other people, brands, public figures or official accounts, including @jes_official, is prohibited',
  s2l5: 'You are responsible for all activities carried out through your account',
  s2l6: 'Phone number and nationality, if provided, must be truthful',
  s2p: 'In the event of unauthorised access to or compromise of your account, notify us immediately at',
  s2p2: '. JES is not responsible for damages arising from failure to notify in a timely manner.',
  s3: '3. User Content',
  s3p1: 'You are solely responsible for the content you publish on JES — posts, stories, comments, direct messages, polls — and you declare that such content does not violate third-party rights or applicable law.',
  s3lic: 'Licence:',
  s3p2: 'By publishing content on JES, you grant us a worldwide, non-exclusive, royalty-free, sublicensable and transferable licence to reproduce, distribute, display and make available such content solely within the operation of the Platform. We do not use your content for external advertising purposes or to train artificial intelligence models.',
  s3own: 'Ownership:',
  s3p3: 'JES does not acquire ownership of your content. By deleting content or your account, the above licence automatically terminates, subject to content already shared with other users.',
  s3sto: 'Stories:',
  s3p4: 'are automatically deleted 24 hours after publication.',
  s4: '4. Prohibited Conduct',
  s4warn: 'Violations of these rules may result in account suspension or permanent ban, without any right to reimbursement or compensation.',
  s4p: 'The following are expressly prohibited:',
  s4l1: 'Publishing illegal, defamatory, obscene, violent, pornographic content or content that incites hatred or discrimination',
  s4l2: 'Harassing, threatening, stalking or intimidating other users (cyberbullying)',
  s4l3: 'Publishing or distributing child sexual abuse material (CSAM) — this will be immediately reported to the competent authorities',
  s4l4: 'Spreading spam, using automated bots, creating fake accounts or conducting artificial engagement activities',
  s4l5: 'Infringing third-party intellectual property rights (copyright, trademarks, patents)',
  s4l6: 'Attempting to gain unauthorised access to systems, data or third-party accounts',
  s4l7: 'Creating new accounts to evade previously imposed suspension measures',
  s4l8: 'Collecting personal data of other users without their consent (scraping, harvesting)',
  s4l9: 'Publishing personal information of third parties without consent (doxing)',
  s4l10: 'Using the Platform for phishing, malware distribution or other fraudulent activities',
  s5: '5. Moderation & Enforcement',
  s5p: 'JES reserves the unquestionable right to:',
  s5l1: 'Remove any content that violates these Terms, the Community Guidelines or applicable law',
  s5l2: 'Temporarily suspend or permanently ban accounts for serious or repeated violations',
  s5l3: 'Restrict certain features for specific accounts',
  s5l4: 'Report illegal content to the competent authorities, in particular CSAM material',
  s5p2: 'A banned account cannot access the Platform. Attempting to rejoin by creating a new account constitutes a further violation of these Terms and may result in reporting to authorities.',
  s5p3: 'To appeal a suspension, send a reasoned communication to',
  s5p3b: 'within 30 days of notification. JES will respond within 30 working days.',
  s6: '6. JES Intellectual Property',
  s6p1: 'The name "JES", the trademark, logo, Platform design, source code, editorial texts and all other distinctive elements are the exclusive property of JES and protected by applicable intellectual property law.',
  s6p2: 'Any reproduction, modification, distribution or commercial use without prior written authorisation from JES is prohibited.',
  s6p3: 'The @jes_official account is the only official JES profile on the Platform. Any account presenting itself as official will be removed without notice.',
  s7: '7. Sponsored Content & Third-Party Links',
  s7p1: 'The JES feed may include sponsored posts from selected partners (e.g. GBS Immobiliare, GES Company, Mercury Auctions, GNG Agency), clearly identified as such. JES is not responsible for the products, services or content of third-party sites accessible via such links.',
  s7p2: 'Links in user bios and posts are detected automatically. JES does not verify or guarantee the accuracy or legality of external website content.',
  s8: '8. Promotional Communications',
  s8p1: 'JES may send promotional communications, newsletters and Platform updates exclusively to users who have given explicit consent during registration by selecting the relevant option ("I agree to receive promotions and news from JES").',
  s8p2: 'Consent is entirely optional and does not affect access to or use of the service. You may withdraw it at any time by sending a request to',
  s8p2b: '. Withdrawal does not affect the lawfulness of processing carried out prior to that point.',
  s9: '9. Service Availability',
  s9p: 'JES is provided "as is / as available". We do not guarantee the absence of interruptions, errors or discontinuities in the service. We reserve the right to suspend, modify or discontinue the service — including permanently — at any time, with or without notice, for maintenance, technical updates or any other reason.',
  s10: '10. Disclaimer & Limitation of Liability',
  s10p: 'To the maximum extent permitted by applicable law, JES is not liable for:',
  s10l1: 'Indirect, incidental, special, consequential or punitive damages arising from the use or inability to use the Platform',
  s10l2: 'Content published by users',
  s10l3: 'Loss, alteration or unauthorised access to data caused by the user\'s own conduct',
  s10l4: 'Service interruptions arising from force majeure or third-party providers',
  s10p2: 'Nothing in these Terms limits or excludes JES\'s liability for death or personal injury caused by wilful misconduct or gross negligence, nor for damage from defective products where not waivable under applicable mandatory law.',
  s10p3: 'Where not waivable by law, the provisions of the Consumer Code (Legislative Decree 206/2005) apply for the protection of consumers.',
  s11: '11. Governing Law & Jurisdiction',
  s11p: 'These Terms are governed by and construed in accordance with Italian law. For any dispute arising from these Terms or the use of JES, the competent court is the Court of Milan (Italy), without prejudice to any mandatory provisions of the Consumer Code applicable to users acting as consumers in their country of residence.',
  s12: '12. Account Deletion',
  s12p1: 'You may request deletion of your account at any time from the Platform settings or by sending a written request to',
  s12p1b: '. Deletion is irreversible: posts, comments, messages and profile data will be removed within 30 days of the request, subject to data that must be retained by law.',
  s12p2: 'JES reserves the right to delete accounts inactive for more than 24 months, following email notification to the registered address with at least 30 days\' notice.',
  s13: '13. Changes to the Terms',
  s13p: 'JES reserves the right to modify these Terms at any time. In the event of material changes, registered users will be notified by email or in-app notification at least 14 days before the changes take effect. The updated version will always be available on this page with the update date indicated. Continued use of the Platform after the effective date constitutes acceptance of the changes.',
  s14: '14. Contact',
  s14p: 'For any enquiry regarding these Terms, Privacy or support:',
  s14email: 'Email:',
  s14site: 'Website:',
  footerPrivacy: 'Privacy',
  footerTerms: 'Terms',
  footerContact: 'Contact',
};

export default function TerminiClient() {
  const c = EN;

  return (
    <div className={s.page}>
      <div className={s.pageHero}>
        <div className={s.pageTag}>{c.tag}</div>
        <h1>{c.title}</h1>
        <p>{c.subtitle}</p>
        <span className={s.updateBadge}>{c.updated}</span>
      </div>

      <div className={s.docWrap}>

        <div className={s.docSection}>
          <p>{c.intro1} <strong>jessocial.com</strong>.</p>
          <p>
            {c.intro2}{' '}
            <Link href="/legal/privacy" className={s.linkOrange}>{c.privacyLink}</Link>
            {c.intro2b}
          </p>
        </div>

        <div className={s.docSection}>
          <h2><span className={s.num}>1</span> {c.s1}</h2>
          <p>{c.s1p}</p>
          <ul>
            <li>{c.s1l1}</li>
            <li>{c.s1l2}</li>
            <li>{c.s1l3}</li>
            <li>{c.s1l4}</li>
          </ul>
          <p>{c.s1p2}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>2</span> {c.s2}</h2>
          <ul>
            <li>{c.s2l1}</li>
            <li>{c.s2l2}</li>
            <li>{c.s2l3}</li>
            <li>{c.s2l4}</li>
            <li>{c.s2l5}</li>
            <li>{c.s2l6}</li>
          </ul>
          <p>
            {c.s2p}{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>jes.socialdelleemozioni@gmail.com</a>
            {c.s2p2}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>3</span> {c.s3}</h2>
          <p>{c.s3p1}</p>
          <p><strong>{c.s3lic}</strong> {c.s3p2}</p>
          <p><strong>{c.s3own}</strong> {c.s3p3}</p>
          <p><strong>{c.s3sto}</strong> {c.s3p4}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>4</span> {c.s4}</h2>
          <div className={s.warningBox}>
            <p><strong>{c.s4warn}</strong></p>
          </div>
          <p>{c.s4p}</p>
          <ul>
            <li>{c.s4l1}</li>
            <li>{c.s4l2}</li>
            <li>{c.s4l3}</li>
            <li>{c.s4l4}</li>
            <li>{c.s4l5}</li>
            <li>{c.s4l6}</li>
            <li>{c.s4l7}</li>
            <li>{c.s4l8}</li>
            <li>{c.s4l9}</li>
            <li>{c.s4l10}</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>5</span> {c.s5}</h2>
          <p>{c.s5p}</p>
          <ul>
            <li>{c.s5l1}</li>
            <li>{c.s5l2}</li>
            <li>{c.s5l3}</li>
            <li>{c.s5l4}</li>
          </ul>
          <p>{c.s5p2}</p>
          <p>
            {c.s5p3}{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>jes.socialdelleemozioni@gmail.com</a>{' '}
            {c.s5p3b}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>6</span> {c.s6}</h2>
          <p>{c.s6p1}</p>
          <p>{c.s6p2}</p>
          <p>{c.s6p3}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>7</span> {c.s7}</h2>
          <p>{c.s7p1}</p>
          <p>{c.s7p2}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>8</span> {c.s8}</h2>
          <p>{c.s8p1}</p>
          <p>
            {c.s8p2}{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>jes.socialdelleemozioni@gmail.com</a>
            {c.s8p2b}
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>9</span> {c.s9}</h2>
          <p>{c.s9p}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>10</span> {c.s10}</h2>
          <p>{c.s10p}</p>
          <ul>
            <li>{c.s10l1}</li>
            <li>{c.s10l2}</li>
            <li>{c.s10l3}</li>
            <li>{c.s10l4}</li>
          </ul>
          <p>{c.s10p2}</p>
          <p>{c.s10p3}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>11</span> {c.s11}</h2>
          <p>{c.s11p}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>12</span> {c.s12}</h2>
          <p>
            {c.s12p1}{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>jes.socialdelleemozioni@gmail.com</a>
            {c.s12p1b}
          </p>
          <p>{c.s12p2}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>13</span> {c.s13}</h2>
          <p>{c.s13p}</p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>14</span> {c.s14}</h2>
          <p>{c.s14p}</p>
          <ul>
            <li>
              {c.s14email}{' '}
              <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>jes.socialdelleemozioni@gmail.com</a>
            </li>
            <li>{c.s14site} <strong>jessocial.com</strong></li>
          </ul>
        </div>

      </div>

      <footer className={s.footer}>
        <div className={s.footerLogo}>JES</div>
        <ul className={s.footerLinks}>
          <li><Link href="/legal/privacy">{c.footerPrivacy}</Link></li>
          <li><Link href="/legal/termini">{c.footerTerms}</Link></li>
          <li><a href="mailto:jes.socialdelleemozioni@gmail.com">{c.footerContact}</a></li>
        </ul>
        <span className={s.footerCopy}>© 2026 JES — Il Social delle Emozioni</span>
      </footer>
    </div>
  );
}
