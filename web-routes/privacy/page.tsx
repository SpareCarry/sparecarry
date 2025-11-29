import { Card, CardContent } from "../../components/ui/card";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-teal-600 hover:text-teal-700 text-sm mb-4 inline-block">
            ← Back to SpareCarry
          </Link>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-8 prose prose-slate max-w-none">
            <p className="text-lg text-slate-700 leading-relaxed">
              Your privacy matters to us. This policy explains what information we collect, how we use it, 
              and how we protect it. We&apos;re committed to being transparent and giving you control over your data.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Account Information</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Email address (required for account creation)</li>
                    <li>Phone number (for verification and delivery coordination)</li>
                    <li>Profile information (boat name, bio, avatar)</li>
                    <li>Identity verification documents (processed securely through Stripe Identity)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Delivery Information</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Pickup and delivery locations</li>
                    <li>Item descriptions, photos, dimensions, and value</li>
                    <li>Travel dates and routes</li>
                    <li>Delivery photos and GPS coordinates (for proof of delivery)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Payment Information</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>Payment method details (processed securely by Stripe, we never see full card numbers)</li>
                    <li>Transaction history</li>
                    <li>Billing address</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Usage Information</h3>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm">
                    <li>How you use the platform (pages visited, features used)</li>
                    <li>Device information (browser type, operating system)</li>
                    <li>IP address and location data</li>
                    <li>Messages sent through the platform</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
              <p className="text-slate-700 mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li><strong>Provide the service:</strong> Match you with travelers/requesters, process payments, facilitate deliveries</li>
                <li><strong>Verify identity:</strong> Ensure users are who they say they are (through Stripe Identity)</li>
                <li><strong>Communicate:</strong> Send you updates about matches, deliveries, and account activity</li>
                <li><strong>Improve the platform:</strong> Analyze usage patterns to make SpareCarry better</li>
                <li><strong>Prevent fraud:</strong> Detect and prevent fraudulent activity</li>
                <li><strong>Support:</strong> Help you when you contact our support team</li>
                <li><strong>Legal compliance:</strong> Meet legal obligations and respond to legal requests</li>
              </ul>
              <p className="text-slate-700 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <strong>We never sell your personal information.</strong> We don&apos;t share it with third parties except as described 
                in this policy (e.g., Stripe for payments, service providers who help us operate the platform).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Information Sharing</h2>
              <p className="text-slate-700 mb-4">We share information only in these situations:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">With Other Users</h3>
                  <p className="text-slate-700 text-sm">
                    When you match with someone, they can see your profile information (boat name, verified badges, rating), 
                    pickup/delivery locations, and messages you exchange. This is necessary for coordinating deliveries.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">With Service Providers</h3>
                  <p className="text-slate-700 text-sm">
                    We work with trusted partners who help us operate:
                  </p>
                  <ul className="list-disc list-inside text-slate-700 space-y-1 text-sm ml-4 mt-2">
                    <li><strong>Stripe:</strong> Payment processing and identity verification</li>
                    <li><strong>Supabase:</strong> Database and authentication services</li>
                    <li><strong>Resend:</strong> Email delivery</li>
                    <li><strong>Expo:</strong> Push notifications (for mobile apps)</li>
                  </ul>
                  <p className="text-slate-700 text-sm mt-2">
                    These providers are contractually required to protect your information and only use it for the services we&apos;ve engaged them for.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">For Legal Reasons</h3>
                  <p className="text-slate-700 text-sm">
                    We may share information if required by law, court order, or to protect the rights, property, or safety of SpareCarry, 
                    our users, or others.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Business Transfers</h3>
                  <p className="text-slate-700 text-sm">
                    If SpareCarry is acquired or merged, your information may be transferred to the new owner, 
                    but this policy will continue to apply.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p className="text-slate-700 mb-4">
                We take security seriously. Here&apos;s what we do to protect your information:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li><strong>Encryption:</strong> All data is encrypted in transit (HTTPS) and at rest</li>
                <li><strong>Secure storage:</strong> We use industry-standard security practices and infrastructure</li>
                <li><strong>Access controls:</strong> Only authorized employees can access your data, and only when necessary</li>
                <li><strong>Payment security:</strong> We never store full credit card numbers. All payments are processed by Stripe, 
                which is PCI DSS compliant</li>
                <li><strong>Regular audits:</strong> We regularly review and update our security practices</li>
              </ul>
              <p className="text-slate-700 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <strong>Your part:</strong> Keep your account password secure and don&apos;t share it. Use a strong, unique password. 
                If you suspect unauthorized access, contact us immediately.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Your Rights and Choices</h2>
              <p className="text-slate-700 mb-4">You have control over your information:</p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Access and Update</h3>
                  <p className="text-slate-700 text-sm">
                    You can view and update most of your information in your profile settings. You can also request a copy of 
                    all data we have about you by contacting us.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Delete Your Account</h3>
                  <p className="text-slate-700 text-sm">
                    You can delete your account at any time from your profile settings. This will remove your profile and most 
                    of your data, though we may retain some information for legal or business purposes (e.g., transaction records 
                    required by law).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Opt Out of Communications</h3>
                  <p className="text-slate-700 text-sm">
                    You can opt out of marketing emails (we&apos;ll still send important account and delivery updates). 
                    You can also disable push notifications in your device settings.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Location Data</h3>
                  <p className="text-slate-700 text-sm">
                    We collect location data for delivery coordination and proof of delivery. You can disable location services 
                    in your device settings, though this may limit some features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Cookies and Tracking</h2>
              <p className="text-slate-700 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-2 mb-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze how the platform is used</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="text-slate-700 mb-4">
                We also use analytics services (like Google Analytics) to understand usage patterns. These services may use cookies 
                and collect information about your use of the platform.
              </p>
              <p className="text-slate-700">
                You can control cookies through your browser settings, though disabling cookies may affect platform functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Children&apos;s Privacy</h2>
              <p className="text-slate-700">
                SpareCarry is not intended for users under 18 years of age. We do not knowingly collect information from children. 
                If you believe we have collected information from a child, please contact us immediately and we&apos;ll delete it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">8. International Users</h2>
              <p className="text-slate-700 mb-4">
                SpareCarry operates globally, but our servers are primarily located in the United States. If you&apos;re using SpareCarry 
                from outside the U.S., your information may be transferred to and stored in the U.S.
              </p>
              <p className="text-slate-700">
                By using SpareCarry, you consent to the transfer of your information to the U.S. and other countries where we operate. 
                We comply with applicable data protection laws, including GDPR for users in the European Union.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-slate-700">
                We may update this privacy policy from time to time. We&apos;ll notify you of significant changes via email or through 
                the platform. The &quot;Last updated&quot; date at the top shows when this policy was last revised. Continued use of SpareCarry 
                after changes constitutes acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contact Us</h2>
              <p className="text-slate-700 mb-4">
                Questions about privacy? We&apos;re here to help:
              </p>
              <ul className="list-none text-slate-700 space-y-2">
                <li><strong>Privacy inquiries:</strong> privacy@sparecarry.com</li>
                <li><strong>Data requests:</strong> data@sparecarry.com</li>
                <li><strong>General support:</strong> support@sparecarry.com</li>
              </ul>
              <p className="text-slate-700 mt-4 text-sm">
                If you&apos;re in the EU and have concerns about how we handle your data, you can also contact your local data protection authority.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>By using SpareCarry, you agree to this Privacy Policy.</p>
          <p className="mt-2">
            <Link href="/terms" className="text-teal-600 hover:text-teal-700">Terms of Service</Link> •{" "}
            <Link href="/disclaimer" className="text-teal-600 hover:text-teal-700">Disclaimer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
