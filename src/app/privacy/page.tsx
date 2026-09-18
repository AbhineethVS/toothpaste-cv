import { LegalDocLayout, LegalSection } from "@/components/legal/LegalDocLayout";

export default function PrivacyPage() {
  return (
    <LegalDocLayout title="Privacy Policy" updated="September 18, 2026">
      <p>
        This Privacy Policy explains what toothpaste.cv collects, how it is used, and the choices you
        have. This is a concise policy for a preliminary screening demo product — not a substitute
        for formal legal review if you deploy commercially.
      </p>

      <LegalSection title="1. What we collect">
        <p>Depending on how you use the Service, we may process:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Oral photos</strong> you capture or upload for screening
          </li>
          <li>
            <strong>Screening results</strong> generated from those photos (findings, summaries,
            severity labels)
          </li>
          <li>
            <strong>Account information</strong> such as email if you sign up
          </li>
          <li>
            <strong>Device/browser storage</strong> such as session photos, timeline saves, and legal
            consent acknowledgements stored locally on your device
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. How we use information">
        <p>We use this information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Generate your visual oral health screening report</li>
          <li>Let you save and revisit reports on your timeline (when available)</li>
          <li>Authenticate your account if you sign in</li>
          <li>Operate, secure, and improve the Service</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. AI processing">
        <p>
          Photos are sent to a third-party AI provider (currently OpenAI) to produce structured
          screening output. Do not include photos you are not comfortable sharing with that
          processing pipeline. We do not use screening photos to train toothpaste.cv’s own models.
        </p>
      </LegalSection>

      <LegalSection title="4. Storage">
        <p>
          By default, capture photos for an active screening are kept in your browser session storage
          for the report flow. Timeline saves (including compressed photos and results) may be stored
          in your browser’s local storage on that device. Account authentication, when enabled, is
          handled by Supabase. We aim not to keep permanent server-side photo archives for anonymous
          screenings beyond what is required to generate a report.
        </p>
      </LegalSection>

      <LegalSection title="5. Sharing">
        <p>
          We share data with service providers only as needed to run the Service (for example, AI
          analysis and auth). We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection title="6. Your choices">
        <p>
          You can stop using the Service at any time. You can clear browser site data to remove local
          timeline/session information. If you have an account, you may sign out; contact us if you
          need help deleting account credentials from the auth provider.
        </p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>
          The Service is not directed at children under 13 (or the equivalent minimum age in your
          region). Do not use it to submit a child’s photos without appropriate consent and
          supervision.
        </p>
      </LegalSection>

      <LegalSection title="8. International / demo note">
        <p>
          Processing may occur on servers in different regions via our providers. If you need a
          region-specific commercial deployment, additional privacy controls may be required.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes">
        <p>
          We may update this Privacy Policy. The “Last updated” date shows the latest version.
          Continued use after updates means you accept the revised policy.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          For privacy questions, contact the project maintainers through the repository or product
          channels where toothpaste.cv is published.
        </p>
      </LegalSection>
    </LegalDocLayout>
  );
}
