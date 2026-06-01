import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <section className="mb-12">
            <div className="glass rounded-3xl p-8 md:p-12 mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Terms of Service</h1>
              <p className="text-lg text-muted-foreground">Last updated: April 2026</p>
            </div>
          </section>

          <article className="glass rounded-2xl p-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using SPEAKSMART, you accept and agree to be bound by these terms and conditions.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">2. Use License</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to temporarily use our services for personal, non-commercial purposes. Under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to reverse engineer any software</li>
                <li>Remove any copyright or proprietary notations</li>
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">3. Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                The materials on SPEAKSMART are provided on an &apos;as is&apos; basis. SPEAKSMART makes no warranties, expressed or implied, and hereby disclaims all other warranties.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">4. Limitations</h2>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall SPEAKSMART be liable for any damages arising out of the use or inability to use our materials or services.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold mb-4">5. Contact Information</h2>
              <div className="glass rounded-lg p-4 bg-secondary/50">
                <p className="font-medium">SPEAKSMART Legal Team</p>
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
