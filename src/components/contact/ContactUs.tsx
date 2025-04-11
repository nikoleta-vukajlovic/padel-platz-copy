import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ContactSection() {
    const { toast } = useToast();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email || !message) {
            toast({
                title: "Nedostajući podaci",
                description: "Molimo vas da popunite sva polja pre slanja.",
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
                    to: "info@padelplatz.rs",
                    subject: `Poruka sa kontakt forme od ${name}`,
                    text: message,
                    html: `<p><strong>Ime:</strong> ${name}</p>
                           <p><strong>Email:</strong> ${email}</p>
                           <p><strong>Poruka:</strong><br>${message}</p>`,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Nije uspelo slanje poruke.");
            }

            toast({
                title: "Poruka poslata",
                description: "Hvala što ste nas kontaktirali. Uskoro ćemo vam odgovoriti.",
            });

            setName("");
            setEmail("");
            setMessage("");
        } catch (err) {
            console.error(err);
            toast({
                title: "Greška",
                description: "Nije uspelo slanje poruke. Pokušajte ponovo kasnije.",
                variant: "destructive",
            });
        }
    };

    return (
        <section className="py-8 md:py-16 bg-gray-100 px-4">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                {/* Kontakt forma */}
                <div className="bg-white p-4 md:p-8 rounded-lg shadow-md md:shadow-lg flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl md:text-4xl font-bold text-[#233c1d] mb-4 md:mb-6 text-center">
                            Kontaktirajte nas
                        </h2>
                        <p className="text-sm md:text-lg text-gray-600 mb-4 md:mb-6 text-center">
                            Imate pitanje? Ispunite formu ispod i mi ćemo vam se javiti u najkraćem mogućem roku!
                        </p>
                    </div>

                    <form onSubmit={handleSendEmail} className="flex-grow">
                        <div className="mb-3 md:mb-4">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                                placeholder="Vaše ime"
                                required
                            />
                        </div>

                        <div className="mb-3 md:mb-4">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                                placeholder="Vaš email"
                                required
                            />
                        </div>

                        <div className="mb-4 md:mb-6">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                                rows={4}
                                placeholder="Vaša poruka"
                                required
                            ></textarea>
                        </div>

                        <Button type="submit" className="w-full text-sm md:text-base py-2 md:py-3">
                            Pošaljite poruku
                        </Button>
                    </form>
                </div>

                {/* Sekcija sa mapom */}
                <div className="w-full border-2 md:border-4 border-gray-300 rounded-lg shadow-md md:shadow-lg overflow-hidden h-full min-h-[300px] md:min-h-[450px]">
                    <iframe
                        className="w-full h-full"
                        src="https://www.google.com/maps?q=43.720972,20.682542&hl=sr;z=14&output=embed"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                </div>
            </div>
        </section>
    );
}