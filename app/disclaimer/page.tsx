import { Card, CardContent } from "../../components/ui/card";
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-teal-600 hover:text-teal-700"
          >
            ← Back to SpareCarry
          </Link>
          <h1 className="mb-2 text-4xl font-bold text-slate-900">
            Disclaimer & Limitation of Liability
          </h1>
          <p className="text-slate-600">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="prose prose-slate max-w-none p-8">
            <p className="text-lg leading-relaxed text-slate-700">
              This disclaimer explains what SpareCarry is responsible for (and
              what we&apos;re not). We want to be upfront about the risks and
              limitations of using a peer-to-peer marketplace.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                What SpareCarry Is (and Isn&apos;t)
              </h2>
              <p className="mb-4 text-slate-700">
                <strong>SpareCarry is a technology platform</strong> that
                connects travelers with people who need items delivered. We
                provide:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>A matching system to connect users</li>
                <li>Payment processing and escrow services</li>
                <li>Communication tools</li>
                <li>Dispute resolution assistance</li>
              </ul>
              <p className="mb-4 text-slate-700">
                <strong>SpareCarry is NOT:</strong>
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>A shipping company or courier service</li>
                <li>
                  An employer of travelers (they&apos;re independent
                  contractors)
                </li>
                <li>A guarantor of delivery success</li>
                <li>
                  An insurance provider (though we facilitate insurance
                  purchases)
                </li>
                <li>
                  Responsible for customs, import/export, or legal compliance
                </li>
              </ul>
              <p className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-slate-700">
                <strong>Bottom line:</strong> The actual delivery is arranged
                directly between you and another user. We facilitate the
                connection and handle payments, but we don&apos;t control the
                delivery itself.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Limitation of Liability
              </h2>
              <p className="mb-4 text-slate-700">
                <strong>
                  To the maximum extent permitted by law, SpareCarry is not
                  liable for:
                </strong>
              </p>
              <div className="mb-4 space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Lost, Damaged, or Stolen Items
                  </h3>
                  <p className="text-sm text-slate-700">
                    We are not responsible if items are lost, damaged, or stolen
                    during delivery. This is a risk inherent in peer-to-peer
                    delivery. We strongly recommend:
                  </p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Purchasing insurance for valuable items</li>
                    <li>Properly packaging items</li>
                    <li>Using accurate declared values</li>
                    <li>Choosing verified travelers with good ratings</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Delivery Delays
                  </h3>
                  <p className="text-sm text-slate-700">
                    Travel plans change. Weather happens. Customs can be slow.
                    We&apos;re not responsible for delays in delivery, even if
                    they cause you inconvenience or financial loss. Travelers
                    should communicate delays, but we can&apos;t guarantee
                    delivery times.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Customs and Import/Export Issues
                  </h3>
                  <p className="text-sm text-slate-700">
                    You are responsible for ensuring items comply with all
                    customs, import, export, and other laws. We&apos;re not
                    responsible for items seized by customs, import duties, or
                    legal issues related to cross-border shipping. Travelers
                    should research requirements for their routes.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Injuries or Accidents
                  </h3>
                  <p className="text-sm text-slate-700">
                    We&apos;re not responsible for injuries, accidents, or
                    property damage that occur during pickup, transport, or
                    delivery. Travelers should have appropriate insurance
                    coverage.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    User Disputes
                  </h3>
                  <p className="text-sm text-slate-700">
                    While we&apos;ll help mediate disputes, we&apos;re not
                    responsible for disagreements between users. We&apos;ll
                    investigate disputes fairly, but our decisions are final and
                    we&apos;re not liable for the outcome.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Platform Errors or Interruptions
                  </h3>
                  <p className="text-sm text-slate-700">
                    We strive to keep SpareCarry running smoothly, but
                    we&apos;re not liable for technical errors, downtime, or
                    interruptions that may affect your use of the platform.
                  </p>
                </div>
              </div>
              <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-slate-700">
                <strong>Maximum Liability:</strong> If we are found liable for
                any reason, our total liability to you is limited to the amount
                you paid for the specific delivery in question, or $100 USD,
                whichever is less. This applies regardless of the legal theory
                (contract, tort, negligence, etc.).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                No Warranties
              </h2>
              <p className="mb-4 text-slate-700">
                SpareCarry is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, either express
                or implied. We don&apos;t warrant that:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>The platform will be uninterrupted or error-free</li>
                <li>Deliveries will be completed successfully</li>
                <li>Items will arrive on time or in perfect condition</li>
                <li>Users will always act honestly or responsibly</li>
                <li>The platform will meet your specific needs</li>
              </ul>
              <p className="text-slate-700">
                You use SpareCarry at your own risk. We do our best to create a
                safe, reliable platform, but we can&apos;t guarantee perfect
                outcomes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                User Responsibilities
              </h2>
              <p className="mb-4 text-slate-700">You are responsible for:</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Requesters
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Accurately describing items</li>
                    <li>Ensuring items are legal and allowed</li>
                    <li>Proper packaging</li>
                    <li>Being available for meetups</li>
                    <li>Purchasing insurance if needed</li>
                    <li>Complying with customs laws</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Travelers
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Handling items with reasonable care</li>
                    <li>Only accepting items you can legally transport</li>
                    <li>Communicating delays or issues</li>
                    <li>Providing proof of delivery</li>
                    <li>Having appropriate insurance</li>
                    <li>Complying with all applicable laws</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Indemnification
              </h2>
              <p className="mb-4 text-slate-700">
                You agree to indemnify and hold harmless SpareCarry, its
                officers, directors, employees, and agents from any claims,
                damages, losses, liabilities, and expenses (including legal
                fees) arising from:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>Your use of the platform</li>
                <li>Your violation of these terms or any laws</li>
                <li>Your delivery of prohibited items</li>
                <li>Any disputes with other users</li>
                <li>Any harm caused by items you post or deliver</li>
              </ul>
              <p className="text-slate-700">
                In simple terms: if you cause problems, you&apos;re responsible
                for them, not us.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Dispute Resolution
              </h2>
              <p className="mb-4 text-slate-700">
                If you have a dispute with another user:
              </p>
              <ol className="mb-4 list-inside list-decimal space-y-2 text-slate-700">
                <li>
                  <strong>Try to resolve it directly:</strong> Most issues can
                  be solved through communication
                </li>
                <li>
                  <strong>Contact support:</strong> We&apos;ll help mediate and
                  investigate
                </li>
                <li>
                  <strong>We&apos;ll make a decision:</strong> Based on evidence
                  (photos, messages, GPS data), we&apos;ll decide how to resolve
                  the dispute
                </li>
                <li>
                  <strong>Our decision is final:</strong> While we&apos;ll be
                  fair, our resolution is binding
                </li>
              </ol>
              <p className="mb-4 text-slate-700">
                For legal disputes with SpareCarry (not other users), you agree
                to:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>First try to resolve through good-faith negotiation</li>
                <li>
                  If that fails, binding arbitration (not court) in accordance
                  with the rules of the American Arbitration Association
                </li>
                <li>
                  Waive your right to a jury trial or class action lawsuit
                </li>
              </ul>
              <p className="text-sm text-slate-700">
                Some jurisdictions don&apos;t allow these limitations. If
                you&apos;re in such a jurisdiction, some of these terms may not
                apply to you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Insurance Recommendations
              </h2>
              <p className="mb-4 text-slate-700">
                We strongly recommend that both requesters and travelers
                consider insurance:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    For Requesters
                  </h3>
                  <p className="text-sm text-slate-700">
                    We offer optional insurance through our partners for
                    valuable items. Consider purchasing insurance if:
                  </p>
                  <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Item value exceeds $500</li>
                    <li>Item is fragile or irreplaceable</li>
                    <li>You can&apos;t afford to lose the item</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    For Travelers
                  </h3>
                  <p className="text-sm text-slate-700">
                    Consider liability insurance to protect yourself in case of
                    damage or loss. Check with your insurance provider about
                    coverage for courier activities.
                  </p>
                </div>
              </div>
              <p className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-slate-700">
                <strong>Note:</strong> Insurance is optional but highly
                recommended. We&apos;re not an insurance provider and don&apos;t
                guarantee insurance coverage or claims.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Changes to This Disclaimer
              </h2>
              <p className="text-slate-700">
                We may update this disclaimer from time to time. We&apos;ll
                notify you of significant changes via email or through the
                platform. Continued use of SpareCarry after changes constitutes
                acceptance of the updated disclaimer.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                Contact Us
              </h2>
              <p className="mb-4 text-slate-700">
                Questions about this disclaimer? We&apos;re here to help:
              </p>
              <ul className="list-none space-y-2 text-slate-700">
                <li>
                  <strong>Legal questions:</strong> legal@sparecarry.com
                </li>
                <li>
                  <strong>Disputes:</strong> disputes@sparecarry.com
                </li>
                <li>
                  <strong>General support:</strong> support@sparecarry.com
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            By using SpareCarry, you acknowledge and agree to this Disclaimer.
          </p>
          <p className="mt-2">
            <Link href="/terms" className="text-teal-600 hover:text-teal-700">
              Terms of Service
            </Link>{" "}
            •{" "}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
