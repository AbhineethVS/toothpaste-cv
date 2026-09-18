import { LegalDocLayout, LegalSection } from "@/components/legal/LegalDocLayout";

export default function TermsPage() {
  return (
    <LegalDocLayout title="Terms of Use" updated="September 18, 2026">
      <p>
        toothpaste.cv (“we”, “our”, or “the Service”) provides a free, preliminary visual oral health
        screening based on photos you upload or capture. By using the Service, you agree to these
        Terms of Use.
      </p>

      <LegalSection title="1. Not medical advice">
        <p>
          toothpaste.cv is <strong>not a medical device diagnosis</strong>, not a substitute for a
          dental exam, and does not create a dentist–patient relationship. Results are informational
          visual triage only. Always consult a licensed dentist for decisions about your oral health.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be able to form a binding agreement in your jurisdiction. If you use the Service
          on behalf of someone else (for example, helping a family member take photos), you confirm
          you have permission to do so.
        </p>
      </LegalSection>

      <LegalSection title="3. Your photos and inputs">
        <p>
          You are responsible for the photos and information you provide. Do not upload content you
          do not have the right to share. Photos are processed to generate a screening report and may
          be sent to third-party AI providers as described in our Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="4. Accounts">
        <p>
          If you create an account, you are responsible for keeping your login credentials secure and
          for activity under your account. You may use the screening flow without an account; saving
          a timeline may require signing in.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You agree not to misuse the Service, including attempting to disrupt it, reverse engineer
          it beyond applicable law, or use it to provide clinical diagnoses to others as if you were
          a licensed professional.</p>
      </LegalSection>

      <LegalSection title="6. Disclaimers">
        <p>
          The Service is provided “as is” without warranties of any kind. Screening output may be
          incomplete, inaccurate, or inconsistent. Lighting, photo quality, and model limitations
          can affect results.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of liability">
        <p>
          To the fullest extent permitted by law, toothpaste.cv and its contributors are not liable
          for any damages arising from your use of the Service or reliance on screening results.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes">
        <p>
          We may update these Terms from time to time. Continued use after changes means you accept
          the updated Terms. The “Last updated” date at the top reflects the latest revision.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For questions about these Terms, contact the project maintainers through the repository or
          product channels where toothpaste.cv is published.
        </p>
      </LegalSection>
    </LegalDocLayout>
  );
}
