import Head from "next/head";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Kontakt() {
  const { toast } = useToast();
  const [ime, setIme] = useState("");
  const [email, setEmail] = useState("");
  const [poruka, setPoruka] = useState("");

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ime || !email || !poruka) {
      toast({
        title: "Nedostaju polja",
        description: "Molimo vas da popunite sva polja pre nego što pošaljete.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/sendmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "info@padelplatz.rs", // ili fiksni prijemnik
          subject: `Poruka sa kontakt forme od ${ime}`,
          text: poruka,
          html: `<p><strong>Ime:</strong> ${ime}</p>
                 <p><strong>Email:</strong> ${email}</p>
                 <p><strong>Poruka:</strong><br>${poruka}</p>`,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Neuspešno slanje poruke.");
      }

      toast({
        title: "Poruka poslata",
        description: "Hvala što ste nas kontaktirali. Javićemo vam se uskoro.",
      });

      // Očisti formu
      setIme("");
      setEmail("");
      setPoruka("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Greška",
        description: "Neuspešno slanje poruke. Pokušajte ponovo kasnije.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <Head>
        <title>Kontaktirajte nas | Padel Terene</title>
        <meta name="description" content="Kontaktirajte nas" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-8">Kontaktirajte nas</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Pošaljite nam poruku</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <Input
                      placeholder="Vaše ime"
                      value={ime}
                      onChange={(e) => setIme(e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="email"
                      placeholder="Vaš email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Vaša poruka"
                      className="min-h-[150px]"
                      value={poruka}
                      onChange={(e) => setPoruka(e.target.value)}
                    />
                  </div>
                  <Button className="w-full">Pošaljite poruku</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kontakt informacije</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Adresa</h3>
                  <p className="text-muted-foreground">123 Padel ulica, Sportski Grad, 12345</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Telefon</h3>
                  <p className="text-muted-foreground">+1 234 567 890</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-muted-foreground">info@padelplatz.rs</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Radno vreme</h3>
                  <p className="text-muted-foreground">Ponedeljak - Nedelja: 08:00 - 00:00</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </Layout>
  );
}