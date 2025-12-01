import { Card, CardContent } from "../../components/ui/card";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-4xl" id="main-content" role="main">
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-block text-sm text-teal-600 hover:text-teal-700"
          >
            ← Back to SpareCarry
          </Link>
          <h1 className="mb-2 text-4xl font-bold text-slate-900">
            Terms of Service
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
              Welcome to SpareCarry! We&apos;re a peer-to-peer marketplace
              connecting travelers with people who need items delivered. These
              terms help keep our community safe and make sure everyone knows
              what to expect.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                1. What SpareCarry Is
              </h2>
              <p className="mb-4 text-slate-700">
                SpareCarry is a platform that connects travelers (people already
                going somewhere) with requesters (people who need items
                delivered). We facilitate matches, handle payments through
                escrow, and provide tools for communication. We are not a
                shipping company, courier service, or delivery service
                ourselves.
              </p>
              <p className="text-slate-700">
                When you use SpareCarry, you&apos;re using a marketplace
                platform. The actual delivery is arranged directly between you
                and another user.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                2. Independent Contractors
              </h2>
              <p className="mb-4 text-slate-700">
                Travelers using SpareCarry are independent contractors, not
                employees of SpareCarry. This means:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>
                  Travelers set their own schedules and choose which deliveries
                  to accept
                </li>
                <li>
                  Travelers are responsible for their own taxes and insurance
                </li>
                <li>
                  SpareCarry does not control how travelers complete deliveries
                </li>
                <li>Travelers are not entitled to employee benefits</li>
              </ul>
              <p className="text-slate-700">
                Requesters are also independent users of the platform.
                You&apos;re responsible for accurately describing your items,
                providing correct addresses, and being available for
                pickup/delivery.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                3. Prohibited Items
              </h2>
              <p className="mb-4 text-slate-700">
                For safety and legal reasons, the following items are strictly
                prohibited on SpareCarry:
              </p>
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Illegal Items
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Controlled substances (drugs, narcotics)</li>
                    <li>Weapons, firearms, ammunition</li>
                    <li>Stolen goods</li>
                    <li>Counterfeit items</li>
                    <li>Items that violate export/import laws</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Hazardous Materials
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Explosives or flammable materials</li>
                    <li>Toxic or radioactive substances</li>
                    <li>Corrosive materials</li>
                    <li>Batteries that don&apos;t meet airline regulations</li>
                    <li>Perishable food without proper handling</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Living Things
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Live animals or plants</li>
                    <li>Human remains or biological samples</li>
                    <li>Seeds or agricultural products requiring permits</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Restricted Items
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>Cash or currency over $500</li>
                    <li>Precious metals or gems over $1,000</li>
                    <li>
                      Prescription medications (except with proper
                      documentation)
                    </li>
                    <li>Alcohol (varies by jurisdiction)</li>
                    <li>Items requiring special permits or licenses</li>
                  </ul>
                </div>
              </div>
              <p className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-slate-700">
                <strong>Important:</strong> If you&apos;re unsure whether an
                item is allowed, please contact us before posting. Violations
                may result in account suspension and legal action. Travelers
                should refuse to carry prohibited items, even if already
                matched.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                4. Customs, Duties, and Taxes
              </h2>
              <p className="mb-4 text-slate-700">
                You are solely responsible for customs compliance, accurate value
                declarations, and all duties, taxes, and fees associated with your
                shipments.
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>
                  <strong>Accurate Declarations:</strong> You must accurately
                  declare the value of all items. Misdeclaration of values is
                  illegal and may result in penalties, fines, or legal action.
                </li>
                <li>
                  <strong>Customs Compliance:</strong> You are responsible for
                  complying with all import/export laws and regulations in both
                  the origin and destination countries.
                </li>
                <li>
                  <strong>Duties and Taxes:</strong> You are responsible for all
                  duties, taxes, customs fees, and any other charges imposed by
                  customs authorities. These costs are not included in the
                  platform fees or rewards.
                </li>
                <li>
                  <strong>Platform Role:</strong> SpareCarry is a matching
                  platform that connects travelers with requesters. We are not a
                  customs broker, shipping company, or legal advisor. We provide
                  information only, not legal advice.
                </li>
                <li>
                  <strong>No Platform Liability:</strong> SpareCarry is not
                  responsible for customs delays, seizures, penalties, or any
                  consequences resulting from inaccurate declarations or
                  non-compliance with customs regulations.
                </li>
              </ul>
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-slate-700">
                <strong>Important:</strong> Customs authorities may verify
                information and inspect items. False declarations may result in
                penalties, legal action, and account suspension. If you are unsure
                about customs requirements, consult with a customs broker or legal
                advisor before posting a request.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                5. Escrow and Payments
              </h2>
              <p className="mb-4 text-slate-700">
                We use Stripe to hold payments in escrow until delivery is
                confirmed. Here&apos;s how it works:
              </p>
              <ol className="mb-4 list-inside list-decimal space-y-3 text-slate-700">
                <li>
                  <strong>Payment:</strong> When you accept a match, payment
                  (item cost + reward + platform fee) is held in escrow
                </li>
                <li>
                  <strong>Delivery:</strong> The traveler uploads proof of
                  delivery (photo + GPS location)
                </li>
                <li>
                  <strong>Confirmation:</strong> You have 24 hours to confirm
                  delivery or dispute
                </li>
                <li>
                  <strong>Release:</strong> If confirmed (or no dispute within
                  24h), funds are released to the traveler, minus platform fees
                </li>
              </ol>
              <p className="mb-4 text-slate-700">
                Platform fees are calculated dynamically based on:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>Delivery method (plane: 12-18%, boat: 12-15%)</li>
                <li>Your delivery history and rating</li>
                <li>
                  Subscription or Supporter status (may reduce or eliminate
                  fees)
                </li>
              </ul>
              <p className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-slate-700">
                <strong>First 1,000 Deliveries:</strong> We&apos;re waiving
                platform fees for the first 1,000 completed deliveries on the
                platform as part of our launch promotion. After that, normal
                fees apply. This promotion may end early if we reach 1,000
                deliveries.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                6. Refund Policy
              </h2>
              <p className="mb-4 text-slate-700">
                We want you to have a great experience. Here&apos;s our refund
                policy:
              </p>
              <div className="mb-4 space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Before Delivery
                  </h3>
                  <p className="text-sm text-slate-700">
                    If a match is canceled before delivery begins, you&apos;ll
                    receive a full refund of all fees and the item cost (if
                    applicable). Platform fees are refunded in full.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Disputed Deliveries
                  </h3>
                  <p className="text-sm text-slate-700">
                    If you dispute a delivery (item damaged, wrong item, not
                    delivered), we&apos;ll investigate. If the dispute is
                    resolved in your favor, you&apos;ll receive a refund of the
                    item cost and reward. Platform fees are non-refundable
                    unless the dispute is due to platform error.
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    First 1,000 Deliveries
                  </h3>
                  <p className="text-sm text-slate-700">
                    For the first 1,000 deliveries on the platform, we offer
                    enhanced refund protection. If you&apos;re not satisfied
                    with a delivery from this period, contact us within 7 days
                    and we&apos;ll work with you to resolve the issue, including
                    full refunds when appropriate.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700">
                Refunds are processed to your original payment method within
                5-10 business days.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                7. Limitation of Liability
              </h2>
              <p className="mb-4 text-slate-700">
                SpareCarry is a platform that connects users. We are not
                responsible for:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>
                  Lost, damaged, or stolen items (users are encouraged to
                  purchase insurance)
                </li>
                <li>
                  Delays in delivery (travel plans change, weather happens)
                </li>
                <li>Customs issues or import/export problems</li>
                <li>Injuries or accidents during delivery</li>
                <li>Disputes between users (though we&apos;ll help mediate)</li>
                <li>Items that violate these terms or local laws</li>
              </ul>
              <p className="mb-4 text-slate-700">
                <strong>Our maximum liability</strong> to you for any claims
                related to the platform is limited to the amount you paid for
                the specific delivery in question, or $100, whichever is less.
              </p>
              <p className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-slate-700">
                <strong>Tip:</strong> We offer optional insurance through our
                partners. For valuable items, we strongly recommend purchasing
                insurance coverage. Travelers should also consider their own
                liability insurance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                8. User Responsibilities
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Requesters Must:
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>
                      Accurately describe items (size, weight, value, condition)
                    </li>
                    <li>Provide correct pickup and delivery addresses</li>
                    <li>Be available for scheduled meetups</li>
                    <li>Only post items that are legal and allowed</li>
                    <li>Respond to messages in a timely manner</li>
                    <li>
                      Confirm delivery within 24 hours or dispute if needed
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">
                    Travelers Must:
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                    <li>
                      Only accept items you can legally and safely transport
                    </li>
                    <li>Verify item details before accepting</li>
                    <li>Handle items with reasonable care</li>
                    <li>Meet at agreed-upon times and locations</li>
                    <li>Upload proof of delivery (photo + GPS)</li>
                    <li>Communicate delays or issues promptly</li>
                    <li>Comply with all applicable laws and regulations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                8. Account Termination
              </h2>
              <p className="mb-4 text-slate-700">
                We reserve the right to suspend or terminate accounts that:
              </p>
              <ul className="mb-4 list-inside list-disc space-y-2 text-slate-700">
                <li>Violate these terms or our community guidelines</li>
                <li>Post prohibited items</li>
                <li>Engage in fraudulent activity</li>
                <li>Harass or abuse other users</li>
                <li>Repeatedly fail to complete deliveries</li>
                <li>Provide false information</li>
              </ul>
              <p className="text-slate-700">
                If your account is terminated, you may lose access to pending
                deliveries and funds may be held pending investigation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                10. Changes to Terms
              </h2>
              <p className="text-slate-700">
                We may update these terms from time to time. We&apos;ll notify
                you of significant changes via email or through the platform.
                Continued use of SpareCarry after changes constitutes acceptance
                of the new terms. If you don&apos;t agree with changes, you can
                close your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="mb-4 text-2xl font-bold text-slate-900">
                11. Contact Us
              </h2>
              <p className="mb-4 text-slate-700">
                Questions about these terms? We&apos;re here to help:
              </p>
              <ul className="list-none space-y-2 text-slate-700">
                <li>
                  <strong>Email:</strong> legal@sparecarry.com
                </li>
                <li>
                  <strong>Support:</strong> support@sparecarry.com
                </li>
                <li>
                  <strong>Disputes:</strong> disputes@sparecarry.com
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>By using SpareCarry, you agree to these Terms of Service.</p>
          <p className="mt-2">
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy
            </Link>{" "}
            •{" "}
            <Link
              href="/disclaimer"
              className="text-teal-600 hover:text-teal-700"
            >
              Disclaimer
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
