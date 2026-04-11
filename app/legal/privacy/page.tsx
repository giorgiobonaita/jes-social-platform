import type { Metadata } from 'next';
import Link from 'next/link';
import s from '../legal.module.css';

export const metadata: Metadata = {
  title: 'Privacy Policy — JES',
  description: 'Informativa sulla privacy di JES — Il Social delle Emozioni.',
};

export default function PrivacyPage() {
  return (
    <div className={s.page}>

      {/* HERO */}
      <div className={s.pageHero}>
        <div className={s.pageTag}>Documenti legali</div>
        <h1>Privacy Policy</h1>
        <p>Come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali su JES.</p>
        <span className={s.updateBadge}>Aggiornata: aprile 2025</span>
      </div>

      {/* CONTENUTO */}
      <div className={s.docWrap}>

        {/* Intro */}
        <div className={s.docSection}>
          <p>
            JES (&ldquo;noi&rdquo;, &ldquo;la Piattaforma&rdquo;, &ldquo;il Titolare&rdquo;) è un social network
            dedicato agli artisti e ai creativi. La presente Informativa sul trattamento dei dati personali
            (&ldquo;Informativa&rdquo;) è redatta ai sensi del Regolamento (UE) 2016/679 (&ldquo;GDPR&rdquo;) e del
            D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018 (&ldquo;Codice Privacy&rdquo;).
          </p>
          <p>
            L&apos;utilizzo della Piattaforma implica la presa visione e l&apos;accettazione della presente Informativa.
          </p>
          <div className={s.infoBox}>
            <p>
              <strong>Titolare del trattamento:</strong> JES — Il Social delle Emozioni.<br />
              Per qualsiasi richiesta relativa alla privacy: <strong>privacy@jesocial.com</strong>
            </p>
          </div>
        </div>

        {/* 1 - Dati raccolti */}
        <div className={s.docSection}>
          <h2><span className={s.num}>1</span> Dati personali trattati</h2>

          <p><strong>1.1 Dati di registrazione e profilo</strong></p>
          <ul>
            <li>Indirizzo email (autenticazione e comunicazioni di servizio)</li>
            <li>Password (conservata in forma cifrata con hashing — non leggibile da noi)</li>
            <li>Username, nome visualizzato, biografia, disciplina artistica</li>
            <li>Foto profilo fornita volontariamente dall&apos;utente</li>
          </ul>

          <p><strong>1.2 Contenuti pubblicati</strong></p>
          <ul>
            <li>Post: immagini, didascalie, livello di visibilità, gruppi associati, tag</li>
            <li>Storie: immagini effimere (eliminate automaticamente dopo 24 ore), link e menzioni</li>
            <li>Commenti, risposte ai sondaggi, voti</li>
            <li>Messaggi diretti (non analizzati automaticamente da noi)</li>
          </ul>

          <p><strong>1.3 Dati di interazione</strong></p>
          <ul>
            <li>Like e salvataggi su contenuti altrui</li>
            <li>Relazioni di follow (followers/following)</li>
            <li>Iscrizioni a gruppi e community</li>
          </ul>

          <p><strong>1.4 Dati tecnici</strong></p>
          <ul>
            <li>Token di sessione conservati nel browser tramite localStorage (web)</li>
            <li>Timestamp di creazione, modifica e accesso ai contenuti</li>
            <li>Stato di lettura dei messaggi</li>
          </ul>

          <p><strong>Dati che non raccogliamo</strong></p>
          <ul>
            <li>Geolocalizzazione o dati GPS</li>
            <li>Identificatori pubblicitari del dispositivo (IDFA/GAID)</li>
            <li>Dati di navigazione su siti o app di terze parti</li>
            <li>Informazioni di pagamento (JES è un servizio gratuito)</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        {/* 2 - Base giuridica */}
        <div className={s.docSection}>
          <h2><span className={s.num}>2</span> Base giuridica del trattamento</h2>
          <p>Il trattamento dei tuoi dati personali si fonda sulle seguenti basi giuridiche ai sensi dell&apos;art. 6 GDPR:</p>
          <ul>
            <li><strong>Esecuzione del contratto (art. 6, par. 1, lett. b):</strong> i dati di registrazione, profilo e contenuti sono necessari per fornirti il servizio richiesto (account, feed, messaggi, gruppi)</li>
            <li><strong>Legittimo interesse (art. 6, par. 1, lett. f):</strong> rilevamento di abusi, sicurezza della piattaforma, analisi aggregate anonimizzate per il miglioramento del servizio</li>
            <li><strong>Consenso (art. 6, par. 1, lett. a):</strong> comunicazioni promozionali e newsletter opzionali — puoi revocare il consenso in qualsiasi momento</li>
            <li><strong>Obbligo legale (art. 6, par. 1, lett. c):</strong> conservazione dei dati richiesta da normative fiscali, penali o di altra natura</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        {/* 3 - Finalità */}
        <div className={s.docSection}>
          <h2><span className={s.num}>3</span> Finalità del trattamento</h2>
          <ul>
            <li><strong>Erogazione del servizio:</strong> gestione dell&apos;account, pubblicazione di contenuti, feed, messaggi, gruppi e notifiche</li>
            <li><strong>Sicurezza e moderazione:</strong> rilevamento di abusi, gestione segnalazioni, applicazione di provvedimenti disciplinari</li>
            <li><strong>Miglioramento della piattaforma:</strong> analisi statistiche aggregate e anonimizzate sull&apos;utilizzo delle funzionalità</li>
            <li><strong>Comunicazioni di servizio:</strong> email transazionali (reset password, conferma account, notifiche di sicurezza) — senza newsletter commerciali senza consenso esplicito</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        {/* 4 - Terze parti */}
        <div className={s.docSection}>
          <h2><span className={s.num}>4</span> Comunicazione a terzi e trasferimenti</h2>
          <p>
            Non vendiamo né cediamo i tuoi dati personali a terzi per fini commerciali.
            Li comunichiamo esclusivamente nei seguenti casi:
          </p>
          <ul>
            <li>
              <strong>Supabase Inc. (responsabile del trattamento):</strong> fornitore di infrastruttura per database,
              autenticazione e storage. Agisce su nostro mandato ai sensi dell&apos;art. 28 GDPR. I dati possono essere
              ospitati su server AWS in Europa (eu-central-1) o negli Stati Uniti con garanzie adeguate (Standard
              Contractual Clauses). Consulta la{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className={s.linkOrange}>
                Privacy Policy di Supabase
              </a>.
            </li>
            <li>
              <strong>Google LLC (Google Fonts):</strong> il sito carica font tipografici da Google, comportando la
              trasmissione dell&apos;indirizzo IP del visitatore a Google al momento del caricamento.
            </li>
            <li>
              <strong>Partner sponsor:</strong> i post sponsorizzati (GBS Immobiliare, GES Company, Mercury Auctions,
              GNG Agency) sono contenuti statici con link a siti esterni. Cliccando, il browser si connette
              direttamente al sito dello sponsor. JES non trasmette alcun dato personale agli sponsor.
            </li>
            <li>
              <strong>Autorità competenti:</strong> in caso di obbligo legale, ordine dell&apos;autorità giudiziaria
              o di pubblica sicurezza.
            </li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        {/* 5 - Conservazione */}
        <div className={s.docSection}>
          <h2><span className={s.num}>5</span> Periodo di conservazione</h2>
          <ul>
            <li><strong>Storie:</strong> eliminate automaticamente 24 ore dopo la pubblicazione</li>
            <li><strong>Contenuti e account attivi:</strong> conservati per tutta la durata del rapporto contrattuale</li>
            <li><strong>Account eliminati su richiesta:</strong> dati rimossi entro 30 giorni, salvo obblighi legali di conservazione (es. obblighi fiscali fino a 10 anni)</li>
            <li><strong>Messaggi diretti:</strong> conservati finché almeno uno dei partecipanti mantiene l&apos;account attivo</li>
            <li><strong>Log di sicurezza:</strong> conservati per un massimo di 12 mesi</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        {/* 6 - Diritti */}
        <div className={s.docSection}>
          <h2><span className={s.num}>6</span> I tuoi diritti (artt. 15–21 GDPR)</h2>
          <p>In qualità di interessato, hai i seguenti diritti nei confronti di JES:</p>
          <ul>
            <li><strong>Accesso (art. 15):</strong> richiedere conferma del trattamento e copia dei dati personali che ti riguardano</li>
            <li><strong>Rettifica (art. 16):</strong> ottenere la correzione di dati inesatti o incompleti</li>
            <li><strong>Cancellazione — &ldquo;diritto all&apos;oblio&rdquo; (art. 17):</strong> richiedere l&apos;eliminazione del tuo account e di tutti i dati associati, ove non sussistano obblighi di conservazione</li>
            <li><strong>Limitazione del trattamento (art. 18):</strong> ottenere la sospensione del trattamento in determinati casi</li>
            <li><strong>Portabilità (art. 20):</strong> ricevere i dati forniti in formato strutturato e leggibile da macchina</li>
            <li><strong>Opposizione (art. 21):</strong> opporti al trattamento fondato sul legittimo interesse</li>
            <li><strong>Revoca del consenso:</strong> in qualsiasi momento, senza pregiudizio per la liceità del trattamento anteriore</li>
          </ul>
          <p>
            Per esercitare i tuoi diritti scrivi a <strong>privacy@jesocial.com</strong>.
            Risponderemo entro <strong>30 giorni</strong> dalla ricezione della richiesta
            (prorogabili di ulteriori 60 giorni in caso di complessità, con avviso motivato).
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 7 - Cookie */}
        <div className={s.docSection}>
          <h2><span className={s.num}>7</span> Cookie e tecnologie di tracciamento</h2>
          <p>
            Il sito web <strong>jesocial.com</strong> non utilizza cookie di profilazione né tracker
            pubblicitari di terze parti. Utilizziamo esclusivamente:
          </p>
          <ul>
            <li><strong>Cookie tecnici di sessione:</strong> strettamente necessari al funzionamento dell&apos;autenticazione e della navigazione autenticata</li>
            <li><strong>localStorage:</strong> conservazione locale del token di sessione sul dispositivo dell&apos;utente</li>
          </ul>
          <p>
            Non è richiesto il banner cookie per i soli cookie tecnici ai sensi del Provvedimento Garante
            Privacy 8 maggio 2014 e delle Linee guida cookie 2021.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 8 - Sicurezza */}
        <div className={s.docSection}>
          <h2><span className={s.num}>8</span> Misure di sicurezza</h2>
          <p>
            Adottiamo misure tecniche e organizzative adeguate ai sensi dell&apos;art. 32 GDPR:
          </p>
          <ul>
            <li>Crittografia in transito (HTTPS/TLS 1.2+)</li>
            <li>Hashing delle password (bcrypt)</li>
            <li>Row-Level Security (RLS) sul database per l&apos;isolamento dei dati per utente</li>
            <li>Accesso ai dati limitato al personale autorizzato sulla base del principio del minimo privilegio</li>
          </ul>
          <p>
            In caso di violazione dei dati che comporti un rischio per i diritti e le libertà degli interessati,
            provvederemo alla notifica all&apos;Autorità di controllo entro 72 ore (art. 33 GDPR) e agli
            interessati senza ingiustificato ritardo (art. 34 GDPR).
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 9 - Minori */}
        <div className={s.docSection}>
          <h2><span className={s.num}>9</span> Minori</h2>
          <p>
            JES è riservato a persone di età pari o superiore a <strong>16 anni</strong>.
            Ai sensi dell&apos;art. 8 GDPR, il trattamento dei dati di minori di 16 anni è lecito solo
            con il consenso espresso del titolare della responsabilità genitoriale.
            Non raccogliamo consapevolmente dati di minori di 16 anni: qualora ne venissimo a conoscenza,
            provvederemo alla cancellazione immediata dell&apos;account e di tutti i dati associati.
            Segnalazioni a: <strong>privacy@jesocial.com</strong>.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 10 - Modifiche */}
        <div className={s.docSection}>
          <h2><span className={s.num}>10</span> Aggiornamenti all&apos;Informativa</h2>
          <p>
            Il Titolare si riserva il diritto di aggiornare la presente Informativa. In caso di modifiche
            sostanziali, gli utenti registrati saranno avvisati via email o tramite notifica in-app almeno
            <strong> 14 giorni</strong> prima dell&apos;entrata in vigore delle modifiche.
            La data di aggiornamento riportata in cima alla pagina indica sempre la versione vigente.
            L&apos;utilizzo continuato della Piattaforma successivo all&apos;entrata in vigore delle modifiche
            costituisce accettazione delle stesse.
          </p>
        </div>

        <div className={s.dividerLine} />

        {/* 11 - Contatti e reclami */}
        <div className={s.docSection}>
          <h2><span className={s.num}>11</span> Contatti e diritto di reclamo</h2>
          <p>Per qualsiasi questione relativa alla presente Informativa o all&apos;esercizio dei tuoi diritti:</p>
          <ul>
            <li>Email: <strong>privacy@jesocial.com</strong></li>
            <li>Sito: <strong>jesocial.com</strong></li>
          </ul>
          <p>
            Hai altresì il diritto di proporre reclamo all&apos;Autorità Garante per la Protezione dei Dati
            Personali (Garante Privacy Italia —{' '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className={s.linkOrange}>
              garanteprivacy.it
            </a>
            ), qualora ritenga che il trattamento dei tuoi dati personali violi il GDPR o la normativa
            italiana in materia di protezione dei dati.
          </p>
        </div>

      </div>

      {/* FOOTER */}
      <footer className={s.footer}>
        <div className={s.footerLogo}>JES</div>
        <ul className={s.footerLinks}>
          <li><Link href="/legal/privacy">Privacy</Link></li>
          <li><Link href="/legal/termini">Termini</Link></li>
          <li><a href="mailto:privacy@jesocial.com">Contatti</a></li>
        </ul>
        <span className={s.footerCopy}>© 2025 JES — Il Social delle Emozioni</span>
      </footer>

    </div>
  );
}
