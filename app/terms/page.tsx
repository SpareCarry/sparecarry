import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm mb-4 inline-block">
            ← Back to SpareCarry
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-slate-600">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-8 prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed">
              Welcome to SpareCarry! We're a peer-to-peer marketplace connecting travelers with people who need items delivered. 
              These terms help keep our community safe and make sure everyone knows what to expect.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. What SpareCarry Is</h2>
              <p className="text-slate-700 mb-4">
                SpareCarry is a platform that connects travelers (people already going somewhere) with requesters (people who need items delivered). 
                We facilitate matches, handle payments through escrow, and provide tools for communication. We are not a shipping company, 
                courier service, or delivery service ourselves.
              </p>
              <p className="text-slate-700">
                When you use SpareCarry, you're using a marketplace platform. The actual delivery is arranged directly between you and another user.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Independent Contractors</h2>
              <p className="text-slate-700 mb-4">
                Travelers using SpareCarry are independent contractors, not employees of SpareCarry. This means:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li>Travelers set their own schedules and choose which deliveries to accept</li>
                <li>Travelers are responsible for their own taxes and insurance</li>
                <li>SpareCarry does not control how travelers complete deliveries</li>
                <li>Travelers are not entitled to employee benefits</li>
              </ul>
              <p className="text-slate-700">
                Requesters are also independent users of the platform. You're responsible for accurately describing your items, 
                providing correct addresses, and being available for pickup/delivery.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Prohibited Items</h2>
              <p className="text-slate-700 mb-4">
                For safety and legal reasons, the following items are strictly prohibited on SpareCarry:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Illegal Items</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Controlled substances (drugs, narcotics)</li>
                    <li>Weapons, firearms, ammunition</li>
                    <li>Stolen goods</li>
                    <li>Counterfeit items</li>
                    <li>Items that violate export/import laws</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Hazardous Materials</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Explosives or flammable materials</li>
                    <li>Toxic or radioactive substances</li>
                    <li>Corrosive materials</li>
                    <li>Batteries that don't meet airline regulations</li>
                    <li>Perishable food without proper handling</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Living Things</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Live animals or plants</li>
                    <li>Human remains or biological samples</li>
                    <li>Seeds or agricultural products requiring permits</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Restricted Items</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Cash or currency over $500</li>
                    <li>Precious metals or gems over $1,000</li>
                    <li>Prescription medications (except with proper documentation)</li>
                    <li>Alcohol (varies by jurisdiction)</li>
                    <li>Items requiring special permits or licenses</li>
                  </ul>
                </div>
              </div>
              <p className="text-slate-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <strong>Important:</strong> If you're unsure whether an item is allowed, please contact us before posting. 
                Violations may result in account suspension and legal action. Travelers should refuse to carry prohibited items, 
                even if already matched.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Escrow and Payments</h2>
              <p className="text-slate-700 mb-4">
                We use Stripe to hold payments in escrow until delivery is confirmed. Here's how it works:
              </p>
              <ol className="list-decimal list-inside text-slate-700 space-y-3 mb-4">
                <li><strong>Payment:</strong> When you accept a match, payment (item cost + reward + platform fee) is held in escrow</li>
                <li><strong>Delivery:</strong> The traveler uploads proof of delivery (photo + GPS location)</li>
                <li><strong>Confirmation:</strong> You have 24 hours to confirm delivery or dispute</li>
                <li><strong>Release:</strong> If confirmed (or no dispute within 24h), funds are released to the traveler, minus platform fees</li>
              </ol>
              <p className="text-slate-700 mb-4">
                Platform fees are calculated dynamically based on:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li>Delivery method (plane: 12-18%, boat: 12-15%)</li>
                <li>Your delivery history and rating</li>
                <li>Subscription or Supporter status (may reduce or eliminate fees)</li>
              </ul>
              <p className="text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <strong>First 1,000 Deliveries:</strong> We're waiving platform fees for the first 1,000 completed deliveries on the platform 
                as part of our launch promotion. After that, normal fees apply. This promotion may end early if we reach 1,000 deliveries.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Refund Policy</h2>
              <p className="text-slate-700 mb-4">
                We want you to have a great experience. Here's our refund policy:
              </p>
              <div className="space-y-4 mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Before Delivery</h3>
                  <p className="text-slate-700 text-sm">
                    If a match is canceled before delivery begins, you'll receive a full refund of all fees and the item cost (if applicable). 
                    Platform fees are refunded in full.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Disputed Deliveries</h3>
                  <p className="text-slate-700 text-sm">
                    If you dispute a delivery (item damaged, wrong item, not delivered), we'll investigate. If the dispute is resolved in your favor, 
                    you'll receive a refund of the item cost and reward. Platform fees are non-refundable unless the dispute is due to platform error.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">First 1,000 Deliveries</h3>
                  <p className="text-slate-700 text-sm">
                    For the first 1,000 deliveries on the platform, we offer enhanced refund protection. If you're not satisfied with a delivery 
                    from this period, contact us within 7 days and we'll work with you to resolve the issue, including full refunds when appropriate.
                  </p>
                </div>
              </div>
              <p className="text-slate-700 text-sm">
                Refunds are processed to your original payment method within 5-10 business days.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-slate-700 mb-4">
                SpareCarry is a platform that connects users. We are not responsible for:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li>Lost, damaged, or stolen items (users are encouraged to purchase insurance)</li>
                <li>Delays in delivery (travel plans change, weather happens)</li>
                <li>Customs issues or import/export problems</li>
                <li>Injuries or accidents during delivery</li>
                <li>Disputes between users (though we'll help mediate)</li>
                <li>Items that violate these terms or local laws</li>
              </ul>
              <p className="text-slate-700 mb-4">
                <strong>Our maximum liability</strong> to you for any claims related to the platform is limited to the amount you paid 
                for the specific delivery in question, or $100, whichever is less.
              </p>
              <p className="text-slate-700 bg-teal-50 border border-teal-200 rounded-lg p-4">
                <strong>Tip:</strong> We offer optional insurance through our partners. For valuable items, we strongly recommend purchasing 
                insurance coverage. Travelers should also consider their own liability insurance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. User Responsibilities</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Requesters Must:</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Accurately describe items (size, weight, value, condition)</li>
                    <li>Provide correct pickup and delivery addresses</li>
                    <li>Be available for scheduled meetups</li>
                    <li>Only post items that are legal and allowed</li>
                    <li>Respond to messages in a timely manner</li>
                    <li>Confirm delivery within 24 hours or dispute if needed</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Travelers Must:</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Only accept items you can legally and safely transport</li>
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
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Account Termination</h2>
              <p className="text-slate-700 mb-4">
                We reserve the right to suspend or terminate accounts that:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li>Violate these terms or our community guidelines</li>
                <li>Post prohibited items</li>
                <li>Engage in fraudulent activity</li>
                <li>Harass or abuse other users</li>
                <li>Repeatedly fail to complete deliveries</li>
                <li>Provide false information</li>
              </ul>
              <p className="text-slate-700">
                If your account is terminated, you may lose access to pending deliveries and funds may be held pending investigation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to Terms</h2>
              <p className="text-slate-700">
                We may update these terms from time to time. We'll notify you of significant changes via email or through the platform. 
                Continued use of SpareCarry after changes constitutes acceptance of the new terms. If you don't agree with changes, 
                you can close your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact Us</h2>
              <p className="text-slate-700 mb-4">
                Questions about these terms? We're here to help:
              </p>
              <ul className="list-none text-slate-700 space-y-2">
                <li><strong>Email:</strong> legal@sparecarry.com</li>
                <li><strong>Support:</strong> support@sparecarry.com</li>
                <li><strong>Disputes:</strong> disputes@sparecarry.com</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>By using SpareCarry, you agree to these Terms of Service.</p>
          <p className="mt-2">
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">Privacy Policy</Link> •{" "}
            <Link href="/disclaimer" className="text-teal-600 hover:text-teal-700">Disclaimer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
