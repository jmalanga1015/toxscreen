import './ContentPage.css'

function About() {
  return (
    <div className="content-page">
      <h1>About ToxScreen</h1>
      <p className="content-lead">
        ToxScreen helps everyday people understand what industrial facilities near them are releasing into the air, water, and land — using publicly available EPA data.
      </p>

      <h2>How it works</h2>
      <p>
        Enter any ZIP code, city, or address and ToxScreen searches the EPA's Toxics Release Inventory (TRI) for reporting facilities within your chosen radius. For each facility, you can see which chemicals were released, how much, and what health risks those chemicals are associated with according to EPA and NIH research.
      </p>

      <h2>Who it's for</h2>
      <p>
        ToxScreen is built for residents, parents, journalists, researchers, and anyone who wants to make more informed decisions about where they live, work, or spend time. You shouldn't need a science degree or a FOIA request to access this information.
      </p>

      <h2>The data</h2>
      <p>
        All release data comes from the EPA's Toxics Release Inventory for reporting year 2024. Facilities are legally required to report releases above certain thresholds. Chemical health classifications are drawn from the EPA's Integrated Risk Information System (IRIS), and toxicological descriptions are sourced from NIH PubChem.
      </p>

      <h2>Important disclaimer</h2>
      <p>
        ToxScreen is an informational tool, not a medical or environmental risk assessment. The presence of a facility nearby does not necessarily mean your health is at risk. Actual exposure depends on many factors including distance, wind patterns, water flow, and the amounts released. If you have health concerns, consult a medical professional or your local environmental agency.
      </p>
    </div>
  )
}

function Sources() {
  return (
    <div className="content-page">
      <h1>Data Sources</h1>
      <p className="content-lead">
        ToxScreen is built on publicly available government and scientific databases. Here's exactly where each piece of data comes from.
      </p>

      <div className="source-card">
        <div className="source-header">
          <span className="source-badge">Release Data</span>
          <h2>EPA Toxics Release Inventory (TRI)</h2>
        </div>
        <p>
          The TRI is a publicly available EPA database containing information about toxic chemical releases and waste management activities reported annually by industrial and federal facilities. Facilities above certain size and activity thresholds are legally required to report. ToxScreen uses TRI data for reporting year 2024.
        </p>
        <a href="https://www.epa.gov/toxics-release-inventory-tri-program" target="_blank" rel="noreferrer">epa.gov/toxics-release-inventory →</a>
      </div>

      <div className="source-card">
        <div className="source-header">
          <span className="source-badge">Health Classifications</span>
          <h2>EPA Integrated Risk Information System (IRIS)</h2>
        </div>
        <p>
          IRIS is EPA's authoritative database of human health effects from exposure to environmental substances. ToxScreen uses IRIS carcinogenicity classifications — such as "Carcinogenic to Humans" and "Likely to be Carcinogenic to Humans" — to assign concern levels to chemicals. These classifications follow EPA's 2005 Guidelines for Carcinogen Risk Assessment.
        </p>
        <a href="https://www.epa.gov/iris" target="_blank" rel="noreferrer">epa.gov/iris →</a>
      </div>

      <div className="source-card">
        <div className="source-header">
          <span className="source-badge">Chemical Descriptions</span>
          <h2>NIH PubChem</h2>
        </div>
        <p>
          PubChem is the world's largest collection of freely accessible chemical information, maintained by the National Institutes of Health. ToxScreen pulls toxicological summaries from PubChem's PUG View API to provide plain-language health context for each chemical. This data is free to use with attribution.
        </p>
        <a href="https://pubchem.ncbi.nlm.nih.gov" target="_blank" rel="noreferrer">pubchem.ncbi.nlm.nih.gov →</a>
      </div>

      <div className="source-card">
        <div className="source-header">
          <span className="source-badge">Mapping</span>
          <h2>Mapbox</h2>
        </div>
        <p>
          Maps and location search (geocoding) are powered by Mapbox, using OpenStreetMap data. Mapbox converts the addresses and ZIP codes you enter into geographic coordinates used to find nearby facilities.
        </p>
        <a href="https://www.mapbox.com" target="_blank" rel="noreferrer">mapbox.com →</a>
      </div>
    </div>
  )
}

function FAQ() {
  const items = [
    {
      q: 'What is the Toxics Release Inventory?',
      a: 'The TRI is a program run by the U.S. Environmental Protection Agency. Under the Emergency Planning and Community Right-to-Know Act (EPCRA), industrial facilities above certain size thresholds are required to report annually how much of each listed toxic chemical they release into the environment or manage as waste. The program covers over 800 chemicals and chemical categories.',
    },
    {
      q: 'Does a nearby facility mean my area is dangerous?',
      a: 'Not necessarily. The TRI tracks reported releases, but actual health risk depends on many factors: how much was released, how far you are from the facility, local wind and water patterns, how the chemical disperses, and how long exposure lasts. ToxScreen surfaces information to help you ask better questions — it is not a health risk assessment.',
    },
    {
      q: 'How current is the data?',
      a: 'ToxScreen currently uses EPA TRI data for reporting year 2024. Facilities report by July 1 each year for the prior calendar year, so 2024 data represents releases that occurred during 2023. We plan to update the dataset annually as new TRI data is released.',
    },
    {
      q: 'What do the concern levels (High, Moderate, Low) mean?',
      a: 'Concern levels reflect EPA IRIS carcinogenicity classifications. High Concern chemicals are classified as "Carcinogenic to Humans" or "Likely to be Carcinogenic to Humans." Moderate Concern chemicals have suggestive evidence of carcinogenicity or documented significant non-cancer health effects. Low Concern chemicals have limited evidence of health effects at typical environmental exposures. These are based on hazard classification, not on the specific amounts released near you.',
    },
    {
      q: 'Why do some chemicals not have a description?',
      a: 'Chemical descriptions are pulled in real time from NIH PubChem. Some TRI chemical category names (like "Chromium and Chromium Compounds") don\'t match PubChem compound names directly, and some chemicals simply don\'t have a toxicological summary in PubChem\'s database yet. We\'re continuously improving the matching logic.',
    },
    {
      q: 'Are all industrial releases reported?',
      a: 'No. TRI only covers facilities above certain employee and activity thresholds, and only for listed chemicals. Smaller facilities, agricultural operations, and some industry sectors are exempt. TRI is a useful signal but does not capture all toxic releases in an area.',
    },
    {
      q: 'Is ToxScreen affiliated with the EPA or any government agency?',
      a: 'No. ToxScreen is an independent tool that uses publicly available government data. We are not affiliated with the EPA, NIH, or any other government agency.',
    },
  ]

  return (
    <div className="content-page">
      <h1>Frequently Asked Questions</h1>
      <p className="content-lead">
        Answers to common questions about ToxScreen, the underlying data, and how to interpret what you see.
      </p>
      <div className="faq-list">
        {items.map((item, i) => (
          <div key={i} className="faq-item">
            <h2>{item.q}</h2>
            <p>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Contact() {
  return (
    <div className="content-page">
      <h1>Contact</h1>
      <p className="content-lead">
        Have a question, found an error in the data, or want to share feedback? We'd love to hear from you.
      </p>

      <h2>General inquiries</h2>
      <p>
        For questions about ToxScreen, how the data works, or anything else, email us at{' '}
        <a href="mailto:info@toxscreenapp.com">info@toxscreenapp.com</a>.
      </p>

      <h2>Data issues</h2>
      <p>
        If you spot a facility with incorrect information, a chemical classification that seems wrong, or missing data, please let us know. Include the facility name, location, and a brief description of the issue and we'll look into it.
      </p>

      <h2>Press & partnerships</h2>
      <p>
        Journalists, researchers, or organizations interested in working with ToxScreen data or partnering with us can reach us at{' '}
        <a href="mailto:info@toxscreenapp.com">info@toxscreenapp.com</a>.
      </p>
    </div>
  )
}

function Terms() {
  return (
    <div className="content-page">
      <h1>Terms of Use</h1>
      <p className="content-lead">
        By using ToxScreen you agree to these terms. Please read them carefully.
        This is a placeholder document drafted for informational purposes — it is not
        legal advice and has not been reviewed by an attorney.
      </p>

      <h2>What ToxScreen is</h2>
      <p>
        ToxScreen is an informational tool that surfaces publicly available data from
        the U.S. Environmental Protection Agency's Toxics Release Inventory (TRI).
        It is not a medical service, environmental consulting service, or regulatory
        authority. ToxScreen is not affiliated with the EPA, NIH, or any government agency.
      </p>

      <h2>Not medical or legal advice</h2>
      <p>
        Nothing on ToxScreen constitutes medical, legal, environmental, or health advice.
        The presence of a facility near your location does not mean your health is at risk.
        Actual exposure depends on many factors not captured in this data. If you have
        health concerns related to environmental exposure, consult a licensed medical
        professional or your local environmental health agency.
      </p>

      <h2>Data accuracy</h2>
      <p>
        ToxScreen displays data as reported to the EPA by industrial facilities. We do
        not independently verify this data. Facilities are legally required to report,
        but the data may be incomplete, delayed, or contain errors. Release amounts
        represent reported figures, not independently measured quantities.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may use ToxScreen for personal, educational, journalistic, and research
        purposes. You may not use ToxScreen to scrape, bulk-download, or redistribute
        data in a way that competes with or damages the service. Automated access
        (bots, scrapers) is not permitted without prior written permission.
      </p>

      <h2>No warranty</h2>
      <p>
        ToxScreen is provided "as is" without warranty of any kind, express or implied.
        We make no guarantees about the accuracy, completeness, reliability, or
        availability of the service. We may modify or discontinue the service at any time.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, ToxScreen and its operators are not
        liable for any damages arising from your use of or reliance on this service,
        including but not limited to health decisions, property decisions, or business
        decisions made based on data displayed here.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continued use of ToxScreen after
        changes are posted constitutes acceptance of the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Email us at{' '}
        <a href="mailto:info@toxscreenapp.com">info@toxscreenapp.com</a>.
      </p>

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#aaa' }}>
        Last updated: May 2026. This is a placeholder document and has not been
        reviewed by legal counsel.
      </p>
    </div>
  )
}

function Privacy() {
  return (
    <div className="content-page">
      <h1>Privacy Policy</h1>
      <p className="content-lead">
        ToxScreen collects minimal data and does not sell or share your information.
        This is a placeholder document drafted for informational purposes — it is not
        legal advice and has not been reviewed by an attorney.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Email address</strong> — only if you choose to sign in. We use your
        email solely to send a magic sign-in link via Supabase Auth. We do not send
        marketing emails.
      </p>
      <p>
        <strong>Saved searches and saved facilities</strong> — if you are signed in
        and choose to save a search or facility, that data is stored in our database
        (Supabase) associated with your account.
      </p>
      <p>
        <strong>Recent searches</strong> — stored locally in your browser's
        localStorage. This data never leaves your device and is not sent to our servers.
      </p>
      <p>
        <strong>Usage data</strong> — our hosting provider (Vercel) may collect
        standard server logs including IP addresses and browser information. We do not
        use third-party analytics or advertising trackers.
      </p>

      <h2>What we don't collect</h2>
      <p>
        We do not collect your name, address, phone number, or payment information.
        We do not use advertising cookies or third-party tracking pixels. We do not
        sell, rent, or share your data with third parties for marketing purposes.
      </p>

      <h2>Third-party services</h2>
      <p>
        ToxScreen uses the following third-party services, each with their own privacy policies:
      </p>
      <p>
        <strong>Supabase</strong> — database and authentication provider. Stores your
        email address and saved data. See{' '}
        <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">supabase.com/privacy</a>.
      </p>
      <p>
        <strong>Mapbox</strong> — maps and location geocoding. Processes the ZIP codes
        and addresses you search. See{' '}
        <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noreferrer">mapbox.com/legal/privacy</a>.
      </p>
      <p>
        <strong>Vercel</strong> — hosting provider. May log standard server access data.
        See{' '}
        <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">vercel.com/legal/privacy-policy</a>.
      </p>

      <h2>Data retention</h2>
      <p>
        If you delete your account or request deletion of your data, we will remove
        your email address and all saved searches and facilities from our database.
        To request deletion, email us at{' '}
        <a href="mailto:info@toxscreenapp.com">info@toxscreenapp.com</a>.
      </p>

      <h2>Children</h2>
      <p>
        ToxScreen is not directed at children under 13. We do not knowingly collect
        personal information from children.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We will post the updated policy
        on this page with a revised date.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your data or this policy? Email us at{' '}
        <a href="mailto:info@toxscreenapp.com">info@toxscreenapp.com</a>.
      </p>

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#aaa' }}>
        Last updated: May 2026. This is a placeholder document and has not been
        reviewed by legal counsel.
      </p>
    </div>
  )
}

export default function ContentPage({ page }) {
  if (page === 'about') return <About />
  if (page === 'sources') return <Sources />
  if (page === 'faq') return <FAQ />
  if (page === 'contact') return <Contact />
  if (page === 'terms') return <Terms />
  if (page === 'privacy') return <Privacy />
  return null
}
