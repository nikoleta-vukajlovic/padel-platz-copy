import Head from "next/head";
import {Layout} from "@/components/layout/Layout";
import {FaEnvelope, FaPhoneAlt} from "react-icons/fa";

const AboutUs = () => {
    return (
        <Layout>
            <Head>
                <title>O Nama - Padel Platz</title>
                <meta
                    name="description"
                    content="Saznajte više o Padel Platz-u, našoj misiji i objektima u Kraljevu."
                />
                <link rel="icon" href="/logo-transparent.png"/>
            </Head>

            <section className="py-20 bg-[#1b362f] text-white">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-5xl font-bold mb-6">O Nama</h1>
                    <p className="text-lg max-w-3xl mx-auto">
                        Dobrodošli u <span className="font-semibold">Padel Platz Kraljevo</span>, ultimativnu
                        destinaciju
                        za padel entuzijaste u srcu Srbije! Bilo da ste iskusan igrač ili tek
                        otkrivate ovaj sport, naš objekat nudi sve što vam je potrebno za
                        uživanje u igri. <span className="font-semibold">Naša misija</span> je da stvorimo prostor gde
                        svako, bez obzira na uzrast ili
                        nivo veštine, može da uživa u padelu. <span className="font-semibold">Cilj nam je da razvijemo ovaj sport u Kraljevu i šire</span>,
                        nudeći visoko kvalitetne terene, profesionalne trenere i dinamičnu zajednicu.
                    </p>
                </div>
            </section>

            <section className="py-20 bg-[#1b362f]">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">Kontaktirajte Nas</h2>
                    <p className="text-lg max-w-3xl mx-auto">
                        Imate pitanja? <span className="font-semibold">Slobodno nas kontaktirajte!</span> Uvek smo tu da
                        pomognemo sa
                        rezervacijama, pitanjima ili bilo čim vezanim za Padel Platz.
                    </p>
                    <div className="mt-6">
                        <p className="text-lg">
                            <FaEnvelope className="inline mr-2 text-[#ff7f50]"/> Email:{" "}
                            <a href="mailto:info@padelplatz.com" className="underline">
                                info@padelplatz.com
                            </a>
                        </p>
                        <p className="text-lg mt-4">
                            <FaPhoneAlt className="inline mr-2 text-[#ff7f50]"/> Telefon: +381 64 123 4567
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default AboutUs;
