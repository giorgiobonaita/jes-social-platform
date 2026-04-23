'use client';

import Link from 'next/link';
import s from '../legal.module.css';

export default function PrivacyClient() {
  return (
    <div className={s.page}>
      <div className={s.pageHero}>
        <div className={s.pageTag}>Legal Documents</div>
        <h1>Privacy Policy</h1>
        <p>How we collect, use, and protect your personal data on JES.</p>
        <span className={s.updateBadge}>Updated: April 2026</span>
      </div>

      <div className={s.docWrap}>

        <div className={s.docSection}>
          <p>
            JES (&ldquo;we&rdquo;, &ldquo;the Platform&rdquo;, &ldquo;the Controller&rdquo;) is a social network for artists and creatives.
            This Privacy Policy (&ldquo;Policy&rdquo;) is drafted pursuant to EU Regulation 2016/679 (&ldquo;GDPR&rdquo;) and Italian
            Legislative Decree 196/2003 as amended by D.Lgs. 101/2018. By using the Platform, you acknowledge and accept this Policy.
          </p>
          <div className={s.infoBox}>
            <p>
              <strong>Data Controller: JES — Il Social delle Emozioni.</strong><br />
              For any privacy-related request:{' '}
              <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>
                jes.socialdellemozioni@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className={s.docSection}>
          <h2><span className={s.num}>1</span> Personal data processed</h2>

          <p><strong>1.1 Registration and profile data</strong></p>
          <ul>
            <li>Email address (authentication and service communications)</li>
            <li>Password (stored hashed — never readable by us)</li>
            <li>First/last name, username, bio, artistic title/discipline</li>
            <li>Phone number (voluntary, optional)</li>
            <li>Nationality (voluntary, optional)</li>
            <li>Profile photo provided voluntarily</li>
            <li>Approximate birth year (not publicly visible)</li>
            <li>Explicit consent to receive promotional communications (<em>accepts_promotions</em>) — optional and revocable at any time</li>
          </ul>

          <p><strong>1.2 Published content</strong></p>
          <ul>
            <li>Posts: images, captions, visibility level, groups, tags</li>
            <li>Stories: ephemeral images (deleted after 24 hours), links and mentions</li>
            <li>Comments, poll answers, votes</li>
            <li>Direct messages (not automatically analysed by us)</li>
          </ul>

          <p><strong>1.3 Interaction data</strong></p>
          <ul>
            <li>Likes and saves on other users&apos; content</li>
            <li>Follow relationships (followers/following)</li>
            <li>Group and community memberships</li>
          </ul>

          <p><strong>1.4 Technical data</strong></p>
          <ul>
            <li>Session tokens stored in the browser via localStorage</li>
            <li>Content creation, modification and access timestamps</li>
            <li>Message read status</li>
          </ul>

          <p><strong>Data we do NOT collect</strong></p>
          <ul>
            <li>Geolocation or GPS data</li>
            <li>Device advertising identifiers (IDFA/GAID)</li>
            <li>Browsing data on third-party sites or apps</li>
            <li>Payment information (JES is free)</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>2</span> Legal basis for processing</h2>
          <ul>
            <li><strong>Performance of a contract (Art. 6(1)(b)):</strong> registration data and content necessary to provide the service</li>
            <li><strong>Legitimate interest (Art. 6(1)(f)):</strong> platform security, anonymised aggregate statistical analysis</li>
            <li><strong>Consent (Art. 6(1)(a)):</strong> promotional communications (<em>accepts_promotions</em> field) — revocable at any time by writing to <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a></li>
            <li><strong>Legal obligation (Art. 6(1)(c)):</strong> retention required by applicable law</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>3</span> Purposes of processing</h2>
          <ul>
            <li><strong>Service delivery:</strong> account, feed, messages, groups and notifications</li>
            <li><strong>Security and moderation:</strong> abuse detection, report management, disciplinary actions</li>
            <li><strong>Platform improvement:</strong> anonymised aggregate statistical analysis</li>
            <li><strong>Service communications:</strong> transactional emails (password reset, account confirmation, security alerts)</li>
            <li><strong>Promotional communications:</strong> newsletters and news sent only to users who gave explicit consent via <em>accepts_promotions</em></li>
            <li><strong>Direct contact:</strong> use of phone and/or email if provided by the user</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>4</span> Disclosure to third parties and transfers</h2>
          <p>We do not sell or transfer your personal data to third parties for commercial purposes. We share data exclusively in the following cases:</p>
          <ul>
            <li>
              <strong>Supabase Inc. (data processor):</strong> infrastructure provider for database, authentication and storage.
              Acts under our mandate pursuant to Art. 28 GDPR. Data may be hosted on AWS servers in Europe (eu-central-1)
              or in the US with adequate safeguards (SCCs).{' '}
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className={s.linkOrange}>Supabase Privacy Policy</a>.
            </li>
            <li><strong>Google LLC (Google Fonts):</strong> the visitor&apos;s IP is transmitted to Google when fonts are loaded.</li>
            <li><strong>Sponsor partners:</strong> sponsored posts are static content with external links. JES does not transmit personal data to sponsors.</li>
            <li><strong>Competent authorities:</strong> where required by law or court order.</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>5</span> Retention period</h2>
          <ul>
            <li><strong>Stories:</strong> automatically deleted 24 hours after publication</li>
            <li><strong>Content and active accounts:</strong> retained for the duration of the contractual relationship</li>
            <li><strong>Accounts deleted on request:</strong> removed within 30 days, subject to legal retention obligations</li>
            <li><strong>Direct messages:</strong> retained while at least one participant keeps an active account</li>
            <li><strong>Security logs:</strong> maximum 12 months</li>
            <li><strong>Promotional data (email, phone):</strong> until consent is revoked or account is deleted</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>6</span> Your rights (Arts. 15–21 GDPR)</h2>
          <p>As a data subject, you have the following rights:</p>
          <ul>
            <li><strong>Access (Art. 15):</strong> request a copy of the data concerning you</li>
            <li><strong>Rectification (Art. 16):</strong> correction of inaccurate or incomplete data</li>
            <li><strong>Erasure — &ldquo;right to be forgotten&rdquo; (Art. 17):</strong> deletion of account and all associated data</li>
            <li><strong>Restriction of processing (Art. 18):</strong> suspension of processing in certain cases</li>
            <li><strong>Data portability (Art. 20):</strong> receive data in a structured, machine-readable format</li>
            <li><strong>Objection (Art. 21):</strong> object to processing based on legitimate interest</li>
            <li><strong>Withdrawal of promotional consent:</strong> at any time, without affecting access to the service</li>
          </ul>
          <p>
            To exercise your rights, write to{' '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>.{' '}
            We will respond within <strong>30 days</strong>.
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>7</span> Cookies and tracking technologies</h2>
          <p>
            The site <strong>jessocial.com</strong> does not use profiling cookies or third-party advertising trackers. We use only:
          </p>
          <ul>
            <li><strong>Technical session cookies:</strong> strictly necessary for authentication</li>
            <li><strong>localStorage:</strong> local storage of the session token on the user&apos;s device</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>8</span> Security measures</h2>
          <p>We adopt appropriate technical and organisational measures pursuant to Art. 32 GDPR:</p>
          <ul>
            <li>Encryption in transit (HTTPS/TLS 1.2+)</li>
            <li>Password hashing (bcrypt)</li>
            <li>Row-Level Security (RLS) on the database</li>
            <li>Admin panel access restricted to users with the <em>admin</em> role</li>
            <li>Data access limited to authorised personnel on a least-privilege basis</li>
          </ul>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>9</span> Minors</h2>
          <p>
            JES is reserved for persons aged <strong>16 or over</strong>. We do not knowingly collect data from minors under 16.
            If we become aware of such data, we will immediately delete the account and all associated data.
            Reports to:{' '}
            <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a>.
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>10</span> Updates to this Policy</h2>
          <p>
            The Controller reserves the right to update this Policy. In the event of material changes, registered users will be
            notified by email or in-app notification at least <strong>14 days</strong> before the changes take effect.
          </p>
        </div>

        <div className={s.dividerLine} />

        <div className={s.docSection}>
          <h2><span className={s.num}>11</span> Contact and right to lodge a complaint</h2>
          <ul>
            <li>Email: <a href="mailto:jes.socialdellemozioni@gmail.com" className={s.linkOrange}>jes.socialdellemozioni@gmail.com</a></li>
            <li>Website: <strong>jessocial.com</strong></li>
          </ul>
          <p>
            You also have the right to lodge a complaint with the Italian Data Protection Authority (Garante Privacy —{' '}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className={s.linkOrange}>garanteprivacy.it</a>).
          </p>
        </div>

      </div>

      <footer className={s.footer}>
        <div className={s.footerLogo}>JES</div>
        <ul className={s.footerLinks}>
          <li><Link href="/legal/privacy">Privacy</Link></li>
          <li><Link href="/legal/termini">Terms</Link></li>
          <li><a href="mailto:jes.socialdellemozioni@gmail.com">Contact</a></li>
        </ul>
        <span className={s.footerCopy}>© 2026 JES — Il Social delle Emozioni</span>
      </footer>
    </div>
  );
}
