import type { Metadata } from 'next';
import Link from 'next/link';
import s from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Termini di Servizio — JES',
  description: "Termini e condizioni d'uso di JES — Il Social delle Emozioni.",
};

export default function TerminiPage() {
  return (
    <div className={s.page}>

      {/* HERO */}
      <div className={s.pageHero}>
        <div className={s.pageTag}>Documenti legali</div>
        <h1>Termini di Servizio</h1>
        <p>Le condizioni che regolano l&apos;utilizzo di JES. Ti preghiamo di leggerle attentamente.</p>
        <span className={s.updateBadge}>Aggiornati: aprile 2026</span>
      </div>

      {/* CONTENUTO */}
      <div className={s.docWrap}>

        {/* Intro */}
        <div className={s.docSection}>
          <p>
            I presenti Termini di Servizio (&ldquo;Termini&rdquo;) costituiscono un accordo legalmente
            vincolante tra l&apos;utente (&ldquo;tu&rdquo;, &ldquo;Utente&rdquo;) e JES — Il Social delle
            Emozioni (&ldquo;JES&rdquo;, &ldquo;noi&rdquo;, &ldquo;la Piattaforma&rdquo;) e disciplinano
            l&apos;accesso e l&apos;utilizzo del servizio disponibile su <strong>jesocial.com</strong>.
          </p>
          <p>
            Accedendo o utilizzando JES, dichiari di aver letto, compreso e accettato integralmente i presenti
            Termini e la nostra{' '}
            <Link href="/legal/privacy" className={s.linkOrange}>Privacy Policy</Link>.
            Se non accetti i Termini, non puoi accedere né utilizzare la Piattaforma.
          </p>
        </div>

        {/* 1 - Requisiti */}
        <div className={s.docSection}>
          <h2><span className={s.num}>1</span> Requisiti per l&apos;utilizzo</h2>
          <p>Puoi registrarti e utilizzare JES solo se:</p>
          <ul>
            <li>Hai compiuto <strong>16 anni</strong> di età</li>
            <li>Hai la capacità giuridica necessaria per accettare un accordo vincolante</li>
            <li>Non ti è stato in precedenza sospeso o bannato permanentemente da JES</li>
            <li>Non risiedi in un paese soggetto a embargo ai sensi della normativa dell&apos;Unione Europea o degli Stati Uniti d&apos;America</li>
          </ul>
          <p>
            Gli utenti di età compresa tra <strong>16 e 17 anni</strong> devono ottenere il preventivo
            consenso di un genitore o tutore legale. Registrandosi, dichiarano implicitamente di disporre
            di tale consenso. JES si riserva il diritto di richiedere verifica del consenso genitoriale.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 2 - Account */}
        <div className={s.docSection}>
          <h2><span className={s.num}>2</span> Account e responsabilità dell&apos;utente</h2>
          <ul>
            <li>Sei l&apos;unico responsabile della custodia delle credenziali di accesso (email e password)</li>
            <li>Ogni persona fisica può registrare un solo account attivo</li>
            <li>Le informazioni del profilo devono essere veritiere, accurate e non fuorvianti</li>
            <li>È vietato impersonare altre persone, brand, personaggi pubblici o account ufficiali, incluso l&apos;account <strong>@jes_official</strong></li>
            <li>Sei responsabile di tutte le attività compiute tramite il tuo account</li>
            <li>Il numero di telefono e la nazionalità, se forniti, devono essere veritieri</li>
          </ul>
          <p>
            In caso di accesso non autorizzato o compromissione dell&apos;account, notificaci
            immediatamente a{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>
              jes.socialdelleemozioni@gmail.com
            </a>. JES non è responsabile dei danni derivanti dalla mancata notifica tempestiva.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 3 - Contenuti */}
        <div className={s.docSection}>
          <h2><span className={s.num}>3</span> Contenuti dell&apos;utente</h2>
          <p>
            Sei l&apos;unico responsabile dei contenuti che pubblichi su JES — post, storie, commenti,
            messaggi diretti, sondaggi — e dichiari che tali contenuti non violano diritti di terzi né
            la normativa applicabile.
          </p>
          <p>
            <strong>Licenza d&apos;uso:</strong> pubblicando contenuti su JES, ci concedi una licenza
            mondiale, non esclusiva, gratuita, sub-licenziabile e trasferibile, per riprodurre, distribuire,
            visualizzare e rendere disponibili tali contenuti <em>esclusivamente nell&apos;ambito del
            funzionamento della Piattaforma</em>. Non utilizziamo i tuoi contenuti per finalità
            pubblicitarie esterne né per addestrare modelli di intelligenza artificiale.
          </p>
          <p>
            <strong>Titolarità:</strong> JES non acquisisce la proprietà sui tuoi contenuti.
            Eliminando un contenuto o il tuo account, la licenza sopra descritta decade automaticamente,
            fatti salvi i contenuti già condivisi con altri utenti.
          </p>
          <p>
            <strong>Storie:</strong> vengono eliminate automaticamente 24 ore dopo la pubblicazione.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 4 - Comportamenti vietati */}
        <div className={s.docSection}>
          <h2><span className={s.num}>4</span> Comportamenti vietati</h2>
          <div className={s.warningBox}>
            <p>
              <strong>La violazione delle presenti regole può comportare la sospensione o il ban permanente
              dell&apos;account, senza diritto a rimborso o compensazione di alcun tipo.</strong>
            </p>
          </div>
          <p>È espressamente vietato:</p>
          <ul>
            <li>Pubblicare contenuti illegali, diffamatori, osceni, violenti, pornografici o che incitino all&apos;odio o alla discriminazione</li>
            <li>Molestare, minacciare, perseguitare o intimidire altri utenti (cyberbullismo)</li>
            <li>Pubblicare o distribuire materiale pedopornografico (CSAM) — il comportamento sarà denunciato immediatamente alle autorità competenti ai sensi della legge</li>
            <li>Diffondere spam, utilizzare bot automatizzati, creare account falsi o condurre attività di engagement artificiale</li>
            <li>Violare diritti di proprietà intellettuale di terzi (copyright, marchi registrati, brevetti)</li>
            <li>Tentare di accedere senza autorizzazione a sistemi, dati o account altrui</li>
            <li>Creare nuovi account al fine di eludere provvedimenti di sospensione già irrogati</li>
            <li>Raccogliere dati personali di altri utenti senza il loro consenso (scraping, harvesting)</li>
            <li>Pubblicare informazioni personali di terzi senza consenso (doxing)</li>
            <li>Utilizzare la Piattaforma per attività di phishing, distribuzione di malware o altre attività fraudolente</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        {/* 5 - Moderazione */}
        <div className={s.docSection}>
          <h2><span className={s.num}>5</span> Moderazione e provvedimenti disciplinari</h2>
          <p>JES si riserva il diritto insindacabile di:</p>
          <ul>
            <li>Rimuovere qualsiasi contenuto che violi i presenti Termini, le Linee Guida della Community o la normativa vigente</li>
            <li>Sospendere temporaneamente o bannare definitivamente l&apos;account in caso di violazioni gravi o reiterate</li>
            <li>Limitare determinate funzionalità per specifici account</li>
            <li>Segnalare alle autorità competenti i contenuti illegali, in particolare il materiale CSAM</li>
          </ul>
          <p>
            Un account bannato non può accedere alla Piattaforma. Il tentativo di rientrare attraverso
            la creazione di un nuovo account costituisce ulteriore violazione dei presenti Termini e può
            comportare segnalazione all&apos;autorità.
          </p>
          <p>
            Per contestare un provvedimento di sospensione, invia una comunicazione motivata a{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>
              jes.socialdelleemozioni@gmail.com
            </a>{' '}
            entro <strong>30 giorni</strong> dalla notifica. JES risponderà entro 30 giorni lavorativi.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 6 - Proprietà intellettuale */}
        <div className={s.docSection}>
          <h2><span className={s.num}>6</span> Proprietà intellettuale di JES</h2>
          <p>
            Il nome &ldquo;JES&rdquo;, il marchio, il logo, il design della Piattaforma, il codice sorgente,
            i testi redazionali e tutti gli altri elementi distintivi sono di esclusiva proprietà di JES
            e protetti dalla normativa vigente in materia di proprietà intellettuale e industriale.
          </p>
          <p>
            È vietata qualsiasi riproduzione, modifica, distribuzione o utilizzo commerciale senza
            preventiva autorizzazione scritta di JES.
          </p>
          <p>
            L&apos;account <strong>@jes_official</strong> è l&apos;unico profilo ufficiale di JES sulla
            Piattaforma. Qualsiasi account che si presenti come ufficiale sarà rimosso senza preavviso.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 7 - Contenuti sponsorizzati */}
        <div className={s.docSection}>
          <h2><span className={s.num}>7</span> Contenuti sponsorizzati e link a siti terzi</h2>
          <p>
            Il feed di JES può includere post sponsorizzati di partner selezionati
            (es. GBS Immobiliare, GES Company, Mercury Auctions, GNG Agency), chiaramente
            identificati come tali. JES non è responsabile dei prodotti, servizi o contenuti
            dei siti di terzi raggiungibili tramite tali link.
          </p>
          <p>
            I link presenti nelle biografie e nei post degli utenti sono rilevati automaticamente.
            JES non verifica né garantisce l&apos;accuratezza o la liceità dei contenuti di siti web esterni.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 8 - Comunicazioni promozionali */}
        <div className={s.docSection}>
          <h2><span className={s.num}>8</span> Comunicazioni promozionali</h2>
          <p>
            JES può inviare comunicazioni promozionali, newsletter e aggiornamenti sulle novità della
            Piattaforma esclusivamente agli utenti che hanno espresso il consenso esplicito durante la
            registrazione selezionando l&apos;apposita opzione (<em>&ldquo;Accetto di ricevere promozioni e
            novità da JES&rdquo;</em>).
          </p>
          <p>
            Il consenso è del tutto opzionale e non condiziona l&apos;accesso o il funzionamento del servizio.
            Puoi revocarlo in qualsiasi momento inviando una richiesta a{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>
              jes.socialdelleemozioni@gmail.com
            </a>.
            La revoca non pregiudica la liceità del trattamento effettuato fino a quel momento.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 9 - Disponibilità */}
        <div className={s.docSection}>
          <h2><span className={s.num}>9</span> Disponibilità del servizio</h2>
          <p>
            JES è erogato &ldquo;così come disponibile&rdquo; (<em>as is / as available</em>).
            Non garantiamo l&apos;assenza di interruzioni, errori o discontinuità nel servizio.
            Ci riserviamo il diritto di sospendere, modificare o interrompere il servizio —
            anche in via definitiva — in qualsiasi momento, con o senza preavviso, per manutenzione,
            aggiornamenti tecnici o qualsiasi altra ragione.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 10 - Limitazione responsabilità */}
        <div className={s.docSection}>
          <h2><span className={s.num}>10</span> Esclusione e limitazione di responsabilità</h2>
          <p>
            Nella misura massima consentita dalla legge applicabile, JES non è responsabile per:
          </p>
          <ul>
            <li>Danni indiretti, incidentali, speciali, consequenziali o punitivi derivanti dall&apos;utilizzo o dall&apos;impossibilità di utilizzo della Piattaforma</li>
            <li>Contenuti pubblicati dagli utenti</li>
            <li>Perdita, alterazione o accesso non autorizzato ai dati causati da comportamenti dell&apos;utente</li>
            <li>Interruzioni del servizio derivanti da cause di forza maggiore o da terzi fornitori</li>
          </ul>
          <p>
            Nessuna disposizione dei presenti Termini limita o esclude la responsabilità di JES per
            morte o lesioni personali causate da dolo o colpa grave, né per danni da prodotti difettosi
            ove non derogabile ai sensi della normativa imperativa applicabile.
          </p>
          <p>
            Ove non derogabili dalla legge, si applicano le disposizioni del Codice del Consumo (D.Lgs.
            206/2005) a tutela dei consumatori.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 11 - Legge applicabile */}
        <div className={s.docSection}>
          <h2><span className={s.num}>11</span> Legge applicabile e foro competente</h2>
          <p>
            I presenti Termini sono regolati dalla legge italiana e interpretati in conformità ad essa.
            Per qualsiasi controversia derivante dai presenti Termini o dall&apos;utilizzo di JES,
            il foro competente è il Tribunale di <strong>Milano (Italia)</strong>, fatte salve le
            disposizioni inderogabili del Codice del Consumo applicabili agli utenti che agiscono
            in qualità di consumatori nel proprio paese di residenza.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 12 - Eliminazione account */}
        <div className={s.docSection}>
          <h2><span className={s.num}>12</span> Eliminazione dell&apos;account</h2>
          <p>
            Puoi richiedere l&apos;eliminazione del tuo account in qualsiasi momento dalle impostazioni
            della Piattaforma oppure inviando richiesta scritta a{' '}
            <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>
              jes.socialdelleemozioni@gmail.com
            </a>.
            L&apos;eliminazione è irreversibile: post, commenti, messaggi e dati di profilo saranno rimossi
            entro 30 giorni dalla richiesta, fatti salvi i dati da conservare per obbligo legale.
          </p>
          <p>
            JES si riserva il diritto di eliminare account inattivi da più di <strong>24 mesi</strong>,
            previa notifica via email all&apos;indirizzo registrato con preavviso di almeno 30 giorni.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 13 - Modifiche */}
        <div className={s.docSection}>
          <h2><span className={s.num}>13</span> Modifiche ai Termini</h2>
          <p>
            JES si riserva il diritto di modificare i presenti Termini in qualsiasi momento.
            In caso di modifiche sostanziali, gli utenti registrati saranno avvisati via email o
            tramite notifica in-app almeno <strong>14 giorni</strong> prima dell&apos;entrata in vigore.
            La versione aggiornata sarà sempre disponibile su questa pagina con indicazione della
            data di aggiornamento. Il proseguimento dell&apos;utilizzo della Piattaforma dopo la data
            di entrata in vigore costituisce accettazione delle modifiche.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 14 - Contatti */}
        <div className={s.docSection}>
          <h2><span className={s.num}>14</span> Contatti</h2>
          <p>Per qualsiasi richiesta relativa ai presenti Termini, alla Privacy o al supporto:</p>
          <ul>
            <li>
              Email:{' '}
              <a href="mailto:jes.socialdelleemozioni@gmail.com" className={s.linkOrange}>
                jes.socialdelleemozioni@gmail.com
              </a>
            </li>
            <li>Sito web: <strong>jesocial.com</strong></li>
          </ul>
        </div>

      </div>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerLogo}>JES</div>
        <ul className={s.footerLinks}>
          <li><Link href="/legal/privacy">Privacy</Link></li>
          <li><Link href="/legal/termini">Termini</Link></li>
          <li><a href="mailto:jes.socialdelleemozioni@gmail.com">Contatti</a></li>
        </ul>
        <span className={s.footerCopy}>© 2026 JES — Il Social delle Emozioni</span>
      </footer>

    </div>
  );
}
