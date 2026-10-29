import type { Metadata } from "next";
import LegalPage, { Contact } from "@/components/LegalPage";
import { BRAND } from "@/lib/config";

export const metadata: Metadata = { title: `Privacy Policy · ${BRAND.name}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="30 October 2026">
      <section>
        <p>
          {BRAND.name} analyses public app-store reviews. We collect as little personal data as possible to run the
          service, and we never sell it. This policy explains exactly what we process, why, and for how long.
        </p>
      </section>

      <section>
        <h2>1. What we process</h2>
        <ul>
          <li>
            <strong>Your IP address, briefly.</strong> To enforce free daily limits we read your IP address on each request
            and immediately turn it into a one-way code using a secret that changes every day. We never store the IP itself;
            the coded counters expire within 2 days and can&apos;t be linked across days.
          </li>
          <li>
            <strong>Account details, if you sign in.</strong> Your name, email address and profile picture (for example from
            Google) are stored by our sign-in provider, Clerk. On your account we store your plan, its status and its renewal
            date.
          </li>
          <li>
            <strong>Payments, if you subscribe.</strong> Payments are handled entirely by Razorpay. We never see or store card
            numbers, UPI PINs or bank details. We keep only the Razorpay subscription ID so we can show and cancel your plan.
          </li>
          <li>
            <strong>Questions you ask Raay.</strong> When you use Ask Raay, your question and the public reviews are sent to
            Anthropic (Claude) to write the answer. {BRAND.name} does not store your questions or the answers. Under
            Anthropic&apos;s commercial terms, API inputs are not used to train its models by default.
          </li>
          <li>
            <strong>Public app reviews.</strong> We read public reviews from Google Play and the App Store. We do not store
            reviewers&apos; names or profile pictures. Review text is cached for up to 12 hours (up to 14 days for the example
            report on our home page).
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Cookies</h2>
        <p>
          We use only essential cookies: to keep you signed in (Clerk) and to run checkout (Razorpay). We do not use
          advertising cookies, tracking pixels or third-party analytics.
        </p>
      </section>

      <section>
        <h2>3. Who we share data with</h2>
        <p>Only the service providers needed to run {BRAND.name}, each under its own privacy terms:</p>
        <ul>
          <li><strong>Vercel</strong>: hosting and content delivery.</li>
          <li><strong>Clerk</strong>: sign-in and account storage.</li>
          <li><strong>Razorpay</strong>: payments and subscriptions.</li>
          <li><strong>Anthropic</strong>: AI analysis of reviews and Ask Raay answers.</li>
        </ul>
        <p>We may disclose data if required by Indian law or a valid legal order.</p>
      </section>

      <section>
        <h2>4. How long we keep it</h2>
        <ul>
          <li>Coded usage counters: up to 2 days.</li>
          <li>Account and plan details: until you delete your account.</li>
          <li>Payment records: kept by Razorpay as required by Indian financial regulations.</li>
          <li>Cached review reports: up to 12 hours (home-page example: up to 14 days).</li>
        </ul>
      </section>

      <section>
        <h2>5. Your rights</h2>
        <p>
          Under India&apos;s Digital Personal Data Protection Act, 2023, you can ask to access, correct or erase your
          personal data, withdraw consent, and raise a grievance. You can update or delete your account from the account
          menu once signed in, or contact us at <Contact />. We aim to respond within 7 days.
        </p>
      </section>

      <section>
        <h2>6. Security</h2>
        <p>
          All traffic is encrypted over HTTPS. Payments are verified with cryptographic signatures from Razorpay, secrets
          are kept only on our servers, and we limit how fast any visitor can use the service to prevent abuse.
        </p>
      </section>

      <section>
        <h2>7. Children</h2>
        <p>{BRAND.name} is a business tool and isn&apos;t meant for anyone under 18.</p>
      </section>

      <section>
        <h2>8. Contact & changes</h2>
        <p>
          Questions or grievances: <Contact />. If we change this policy we&apos;ll update the date above, and for
          significant changes we&apos;ll tell signed-in users.
        </p>
      </section>
    </LegalPage>
  );
}
