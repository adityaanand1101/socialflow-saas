export const TermsOfService = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-white">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p className="text-gray-300 leading-relaxed">
            By accessing or using SocialFlow SaaS, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. Description of Service</h2>
          <p className="text-gray-300 leading-relaxed">
            SocialFlow SaaS provides tools for scheduling, managing, and analyzing social media content across various platforms. We reserve the right to modify, suspend, or discontinue the service at any time without notice.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. User Responsibilities</h2>
          <p className="text-gray-300 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You agree not to use the service for any illegal or unauthorized purpose, including but not limited to spamming, violating intellectual property rights, or distributing malicious content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. API Usage and Limitations</h2>
          <p className="text-gray-300 leading-relaxed">
            Our service interacts with third-party APIs (e.g., Facebook, X, LinkedIn). Your use of SocialFlow SaaS is also subject to the Terms of Service of these respective platforms. We are not responsible for actions taken by these third parties, including API rate limiting or account suspensions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Billing and Payments</h2>
          <p className="text-gray-300 leading-relaxed">
            Subscription fees are billed in advance on a recurring basis. All payments are securely processed via Razorpay. We do not store full credit card details on our servers.
          </p>
        </section>
      </div>
    </div>
  )
}
