import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12">
            <div className="glass rounded-3xl p-8 md:p-12 mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Privacy Policy</h1>
              <p className="text-lg text-muted-foreground">Last updated: April 2026</p>
            </div>
          </section>

          <article className="glass rounded-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                At SPEAKSMART, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
                <li><strong>Personal Data:</strong> Name, email address, and contact information you provide when registering.</li>
                <li><strong>Learning Data:</strong> Your language learning progress, lessons completed, and performance metrics.</li>
                <li><strong>Voice Data:</strong> Audio recordings of your voice when you practice pronunciation.</li>
                <li><strong>Device Information:</strong> Information about your device, browser type, and usage patterns.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">3. Use of Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Create and manage your account</li>
                <li>Personalize your learning experience</li>
                <li>Improve our services and platform features</li>
                <li>Send you promotional materials (with your consent)</li>
                <li>Respond to your inquiries</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use administrative, technical, and physical security measures to protect your personal information. Your data is contained behind secured networks and is only accessible by authorized personnel.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">5. Contact Us</h2>
              <div className="glass rounded-lg p-4 bg-secondary/50">
                <p className="font-medium">SPEAKSMART Support</p>
                <p className="text-muted-foreground">Email: allengabrielsilvagaspar@gmail.com</p>
                <p className="text-muted-foreground">Address: Pinagkawitan, Lipa City, Batangas, Philippines</p>
              </div>
            </section>
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}
