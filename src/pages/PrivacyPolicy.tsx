export const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-white">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          <p className="text-gray-300 leading-relaxed">
            At SocialFlow SaaS, we collect information that you provide directly to us, including but not limited to your name, email address, and social media authentication tokens. These tokens are required to publish content on your behalf and are stored using industry-standard encryption.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
          <p className="text-gray-300 leading-relaxed">
            We use the information we collect to provide, maintain, and improve our services. Specifically, your OAuth tokens are used strictly for the purpose of interacting with the APIs of the platforms you connect (e.g., publishing posts, reading engagement metrics) according to the schedules you define.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Data Storage and Security</h2>
          <p className="text-gray-300 leading-relaxed">
            Your data is stored in secure, encrypted databases. We utilize Supabase for our core infrastructure and Backblaze B2 for media asset storage. All communication between our servers and third-party APIs occurs over secure HTTPS connections.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Third-Party Access</h2>
          <p className="text-gray-300 leading-relaxed">
            We do not sell your personal data. We only share necessary information with our trusted infrastructure partners (such as our payment processor, Razorpay) and the specific social media platforms you explicitly choose to connect.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Your Rights</h2>
          <p className="text-gray-300 leading-relaxed">
            You have the right to access, update, or delete your personal information at any time. Revoking access to a social channel within our platform immediately deletes the associated authentication tokens from our active database.
          </p>
        </section>

        <section className="space-y-4 pt-8 border-t border-white/10">
          <p className="text-sm text-muted-foreground">
            For any questions regarding this Privacy Policy, please contact our support team.
          </p>
        </section>
      </div>
    </div>
  )
}
