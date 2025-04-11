import {Button} from "@/components/ui/button";
import Head from "next/head";
import {BookingForm} from "@/components/booking/BookingForm";
import ContactSection from "@/components/contact/ContactUs";
import {Layout} from "@/components/layout/Layout";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image";
import {useState, useEffect} from "react";
import useEmblaCarousel from "embla-carousel-react"
import {ArrowLeft, ArrowRight} from "lucide-react"
import {Accordion, AccordionItem, AccordionTrigger, AccordionContent} from "@/components/ui/accordion";
import {blogService} from "@/services/blogService";
import {BlogPost} from "@/types/booking";
import {
    AlertDialog, AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {format} from "date-fns";
import Link from "next/link";
import {Court, Booking} from '@/types/booking';

type RuleTab = "service" | "scoring" | "walls" | "ball" | "racket" | "court";

const ruleContent: Record<RuleTab, { title: string; src: string; content: string }> = {
    service: {
        title: "Servis",
        src: "/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg",
        content: `Za razliku od tenisa, u padelu je servis uvek ispod ruke i mora biti izveden ispod nivoa struka. Igrač servira nakon što lopta odskoči jednom od zemlje, a udarac se izvodi tako da se lopta pošalje dijagonalno u protivničko servis polje.

Servis se izvodi s desne strane terena i mora se ponoviti ako lopta dotakne mrežu, ali ipak uđe u ispravno servis polje. Igrači imaju pravo na dva pokušaja servisa.`
    },
    scoring: {
        title: "Bodovanje",
        src: "/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg",
        content: `Sistem bodovanja u padelu je identičan teniskom: 15, 30, 40 i gem. U slučaju izjednačenja na 40:40, koristi se prednost ("deuce" sistem).

Set se osvaja kada jedan par osvoji šest gemova, s tim da mora imati prednost od najmanje dva gema. Meč se igra na dva dobijena seta.`
    },
    walls: {
        title: "Zidovi",
        src: "/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg",
        content: `Zidovi su sastavni deo igre u padelu i donose dodatnu dinamiku. Igrač može da udari lopticu tako da se odbije od sopstvenog zida nakon što ona pređe mrežu – ovo je dozvoljeno.

Međutim, ako lopta direktno pogodi zid na protivničkoj strani bez prethodnog dodira tla, to se smatra greškom. Isto važi i ako se nakon odskoka lopta odbije od zida pa potom od metalne ograde, ili ako se odbije od zida na sopstvenoj strani i vrati u svoje polje.`
    },
    ball: {
        title: "Loptice",
        src: "/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg",
        content: `Iako podseća na tenisku, padel lopta ima manji unutrašnji pritisak, što joj daje blaži i niži odskok – savršen za manji teren i brze reakcije.

Standardna boja je žuta, a ranije su se koristile i narandžaste lopte. Težina lopte je između 56 i 59,5 grama, a kada se ispusti sa visine od 2,54 m, treba da odskoči između 135 i 147 cm.`
    },
    racket: {
        title: "Reket",
        src: "/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg",
        content: `Za razliku od teniskog reketa, padel reket je kraći, širi i nema žice. Napravljen je od kompozitnih materijala i ima rupice koje smanjuju otpor vazduha.

Reketi se razlikuju po obliku (okrugli, dijamantski, suza), balansu i težini. Izbor reketa zavisi od stila igre – kontrola, snaga ili balansirana igra. Početnici obično biraju lakše rekete sa većim "sweet spotom" za lakše udaranje.`
    },
    court: {
        title: "Teren",
        src: "/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg",
        content: `Padel teren je dimenzija 20 m x 10 m, ograđen zidovima i metalnim mrežama koje su deo igre. Najčešći tip terena ima zadnje zidove od stakla visine 3 m, uz dodatnu mrežu do visine od 4 m. Bočne strane mogu biti u kombinaciji stakla i mreže.

Postoje varijacije terena gde je kompletna ograda visine 4 m. Zidovi mogu biti izrađeni od stakla, pleksiglasa ili čak cigle, u zavisnosti od konstrukcije kluba.`
    }
};

const Home = () => {
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [selectedRuleTab, setSelectedRuleTab] = useState<RuleTab>('service');
    const [emblaRef, emblaApi] = useEmblaCarousel({loop: false, align: "start"})
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)
    const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [activeTab, setActiveTab] = useState<"hourly" | "membership" | "equipment">("hourly");

    const handleBookingSuccess = (booking: Booking) => {
        console.log('Uspešna rezervacija:', booking);
        setConfirmedBooking(booking);
        setShowSuccessModal(true);
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({behavior: 'smooth'});
            const url = new URL(window.location.href);
            if (id === 'booking') {
                url.searchParams.set('showBooking', 'true');
                window.dispatchEvent(new CustomEvent('showBookingForm'));
                element.scrollIntoView({behavior: "smooth"});
            }
            window.history.pushState({}, '', url);
        }
    };

    const images = [
        {src: "/images(3).jpeg", alt: "Slika 1"},
        {src: "/images (4).jpeg", alt: "Slika 2"},
        {src: "/images (5).jpeg", alt: "Slika 3"},
        {src: "/images (6).jpeg", alt: "Slika 4"},
        {src: "/download.jpeg", alt: "Slika 5"},
    ];

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const blogsData = await blogService.getBlogs();
                setBlogs(blogsData);
            } catch (error) {
                console.error("Greška pri učitavanju blogova", error);
            }
        };

        fetchBlogs();
    }, []);

    useEffect(() => {
        if (!emblaApi) return
        const updateArrows = () => {
            setCanScrollPrev(emblaApi.canScrollPrev())
            setCanScrollNext(emblaApi.canScrollNext())
        }
        emblaApi.on("select", updateArrows)
        emblaApi.on("reInit", updateArrows)
        updateArrows()
    }, [emblaApi])
    return (
        <Layout>
            <Head>
                <title>Padel Platz</title>
                <meta name="description" content="Rezervišite padel teren online u Kraljevu"/>
                <link rel="icon" href="/logo-transparent.png"/>
            </Head>

            {/* Hero Sekcija */}
            <section
                className="relative h-[70vh] md:h-screen flex items-start pt-12 md:items-center md:pt-0 justify-center bg-cover bg-center"
                style={{
                    backgroundImage: "url('/Padel-Social-Club-Hero-p-2600_1944x.webp')",
                    backgroundPosition: "center center"
                }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
                <div className="text-center relative z-10 text-white px-4 mt-16 md:mt-0">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4 md:mb-6">Padel Platz Kraljevo</h1>
                    <p className="text-base md:text-xl max-w-xl mx-auto mb-6 md:mb-14">
                        Dobrodošli u prvi padel centar u Kraljevu! Istražite svet najbrže rastućeg sporta na svetu –
                        igrajte, učite i uživajte na našim vrhunskim terenima.
                    </p>
                    <Button
                        className="bg-[#FF7F50] text-white px-6 py-4 md:px-7 md:py-8 font-bold text-xl md:text-2xl transition-transform duration-300 transform hover:scale-105 hover:bg-[#FF7F50]"
                        onClick={() => scrollToSection('booking')}
                    >
                        Rezerviši
                    </Button>
                </div>
            </section>

            {/* O Nama Sekcija */}
            <section id="about" className="py-12 md:py-16 bg-gray-100 px-4">
                <div className="container mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-800 mb-6 md:mb-8">O Nama</h2>
                    <p className="text-base md:text-lg max-w-3xl mx-auto text-gray-600 mb-8 md:mb-12 px-2">
                        Dobrodošli u Padel Platz, ultimativnu destinaciju za ljubitelje padela u srcu Srbije! Bilo da
                        ste iskusan igrač ili tek otkrivate ovaj sport, naša vrhunsko opremljena ustanova nudi sve što
                        vam je potrebno da uživate u igri.
                    </p>

                    {/* Sadržaj sa ikonama */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                        {[
                            {
                                icon: "/padel.png",
                                title: "3 Otvorena Padel Terena",
                                text: "Igrajte na našim profesionalnim otvorenim padel terenima"
                            },
                            {
                                icon: "/padel%20(1).png",
                                title: "Oprema",
                                text: "Nudimo vrhunsku padel opremu"
                            },
                            {
                                icon: "/placeholder.png",
                                title: "Parking",
                                text: "Besplatan parking za sve naše posetioce"
                            },
                            {
                                icon: "/water-bottle.png",
                                title: "Osveženje",
                                text: "Uživajte u osveženju nakon igre"
                            }
                        ].map((item, index) => (
                            <div key={index} className="flex flex-col items-center text-center p-2">
                                <img src={item.icon} alt={item.title}
                                     className="w-12 h-12 md:w-16 md:h-16 mb-2 md:mb-4"/>
                                <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2 text-[#1b362f]">{item.title}</h3>
                                <p className="text-xs md:text-sm text-gray-600">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Galerija Sekcija */}
            <section id="gallery" className="py-12 md:py-16 bg-gray-200 px-4">
                <div className="container mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8">Galerija Slika</h2>

                    <div className="relative max-w-5xl mx-auto">
                        <button
                            onClick={() => emblaApi && emblaApi.scrollPrev()}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10 transition ${
                                !canScrollPrev ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={!canScrollPrev}
                        >
                            <ArrowLeft className="w-4 h-4 md:w-6 md:h-6 text-gray-600"/>
                        </button>

                        <div ref={emblaRef} className="overflow-hidden">
                            <div className="flex">
                                {images.map((image, index) => (
                                    <div key={index} className="flex-shrink-0 px-1 md:px-2 w-2/3 md:w-1/4">
                                        <img
                                            src={image.src}
                                            alt={image.alt}
                                            className="object-cover w-full h-48 md:h-64 rounded-lg"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => emblaApi && emblaApi.scrollNext()}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10 transition ${
                                !canScrollNext ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            disabled={!canScrollNext}
                        >
                            <ArrowRight className="w-4 h-4 md:w-6 md:h-6 text-gray-600"/>
                        </button>
                    </div>
                </div>
            </section>

            {/* Uspešna Modalna Poruka */}
            {confirmedBooking && (
                <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                    <AlertDialogContent className="bg-white">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Rezervacija Potvrđena!</AlertDialogTitle>
                            <AlertDialogDescription>
                                Vaš teren je uspešno rezervisan.
                                <p>
                                    Uvek možete proveriti svoje rezervacije u sekciji{" "}
                                    <Link href="/profile" className="text-primary hover:underline">
                                        Moj Profil
                                    </Link>{" "}.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2 text-black">
                                <div><strong>Datum:</strong> {format(new Date(confirmedBooking.date), 'MMMM d, yyyy')}
                                </div>
                                <div><strong>Vreme:</strong> {confirmedBooking.startTime} - {confirmedBooking.endTime}
                                </div>
                                <div><strong>Cena:</strong> {confirmedBooking.price} RSD</div>
                            </div>
                            <AlertDialogFooter>
                                <AlertDialogAction
                                    onClick={() => {
                                        setShowSuccessModal(false);
                                        setShowBookingForm(false);
                                        window.scrollTo({top: 0, behavior: 'smooth'});
                                    }}
                                >
                                    Zatvori
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </div>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Rezervacija Sekcija */}
            <section className="py-10 md:py-16 bg-[#1b362f] px-4" id="booking">
                <div className="container mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6 md:mb-8">Rezervišite Vaš Termin</h2>

                    <div className="max-w-sm md:max-w-md mx-auto">
                        <BookingForm
                            onBookingSuccess={handleBookingSuccess}
                            className="text-base"
                        />
                    </div>
                </div>
            </section>

            {/* Pravila Sekcija */}
            <section id='rules' className='py-8 md:py-16 bg-white px-4'>
                <div className='w-full max-w-4xl mx-auto' style={{minHeight: '45vh'}}>
                    <Card className='shadow-none border-none bg-white/95'>
                        <CardContent>
                            {/* Tab Buttons - 2 rows on mobile, 1 row on desktop */}
                            <div className='flex flex-col md:flex-row items-center -my-1'>
                                {/* Mobile: First row (3 buttons) */}
                                <div className='flex w-full md:hidden -mx-0 mb-0'>
                                    {(Object.keys(ruleContent) as RuleTab[]).slice(0, 3).map((tab) => (
                                        <Button
                                            key={tab}
                                            variant={selectedRuleTab === tab ? 'default' : 'outline'}
                                            className='text-xs md:text-base font-medium rounded-none py-2 md:py-3 px-2 md:px-4 mx-0 flex-1 text-center min-w-0 truncate'
                                            onClick={() => setSelectedRuleTab(tab)}
                                        >
                                            {ruleContent[tab].title}
                                        </Button>
                                    ))}
                                </div>
                                {/* Mobile: Second row (3 buttons) */}
                                <div className='flex w-full md:hidden -mx-0'>
                                    {(Object.keys(ruleContent) as RuleTab[]).slice(3).map((tab) => (
                                        <Button
                                            key={tab}
                                            variant={selectedRuleTab === tab ? 'default' : 'outline'}
                                            className='text-xs md:text-base font-medium rounded-none py-2 md:py-3 px-2 md:px-4 mx-0 flex-1 text-center min-w-0 truncate'
                                            onClick={() => setSelectedRuleTab(tab)}
                                        >
                                            {ruleContent[tab].title}
                                        </Button>
                                    ))}
                                </div>
                                {/* Desktop: Single row (6 buttons) */}
                                <div className='hidden md:flex w-full -mx-0'>
                                    {(Object.keys(ruleContent) as RuleTab[]).map((tab) => (
                                        <Button
                                            key={tab}
                                            variant={selectedRuleTab === tab ? 'default' : 'outline'}
                                            className='text-base font-medium rounded-none py-3 px-4 mx-0 flex-1 text-center min-w-0'
                                            onClick={() => setSelectedRuleTab(tab)}
                                        >
                                            {ruleContent[tab].title}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className='mt-4 md:mt-6 flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-8'>
                                <div className='order-2 md:order-1'>
                                    <img
                                        src={ruleContent[selectedRuleTab].src}
                                        alt='Padel Teren'
                                        className='w-full h-auto rounded-lg max-h-[400px] object-cover'
                                    />
                                </div>
                                <div className='space-y-2 md:space-y-4 order-1 md:order-2'>
                                    <h3 className='text-lg md:text-2xl font-bold'>{ruleContent[selectedRuleTab].title}</h3>
                                    <p className='text-sm md:text-lg whitespace-pre-line leading-relaxed'>
                                        {ruleContent[selectedRuleTab].content}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>


            <section id="pricing" className="py-8 md:py-16 bg-white text-[#1b362f] px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-2xl md:text-4xl font-bold text-center mb-4">Cenovnik</h2>

                    {/* Tab Buttons */}
                    <div className="flex flex-wrap justify-center gap-2 mb-6 md:mb-8">
                        <button
                            className={`px-4 py-1 md:px-6 md:py-2 text-sm md:text-lg font-semibold rounded-full transition ${
                                activeTab === "hourly" ? "bg-[#1b362f] text-white" : "bg-gray-200 text-[#1b362f]"
                            }`}
                            onClick={() => setActiveTab("hourly")}
                        >
                            Po Satu
                        </button>
                        <button
                            className={`px-4 py-1 md:px-6 md:py-2 text-sm md:text-lg font-semibold rounded-full transition ${
                                activeTab === "membership" ? "bg-[#1b362f] text-white" : "bg-gray-200 text-[#1b362f]"
                            }`}
                            onClick={() => setActiveTab("membership")}
                        >
                            Članarina
                        </button>
                        <button
                            className={`px-4 py-1 md:px-6 md:py-2 text-sm md:text-lg font-semibold rounded-full transition ${
                                activeTab === "equipment" ? "bg-[#1b362f] text-white" : "bg-gray-200 text-[#1b362f]"
                            }`}
                            onClick={() => setActiveTab("equipment")}
                        >
                            Oprema
                        </button>
                    </div>

                    {/* Hourly Pricing */}
                    {activeTab === "hourly" && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                            {[
                                {time: "08:00 – 16:00", price: "2200 RSD", label: "Radnim danima"},
                                {time: "16:00 – 00:00", price: "2800 RSD", label: "Radnim danima"},
                                {time: "Ceo dan", price: "2800 RSD", label: "Vikendom"}
                            ].map((item, index) => (
                                <div key={index}
                                     className="bg-[#f1f5f3] rounded-xl md:rounded-2xl p-4 md:p-6 text-center shadow-md">
                                    <h3 className="text-lg md:text-xl font-semibold mb-2">{item.label}</h3>
                                    <p className="text-xs md:text-sm mb-1">{item.time}</p>
                                    <p className="text-xl md:text-2xl font-bold">{item.price}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Membership Pricing */}
                    {activeTab === "membership" && (
                        <div className="space-y-6">
                            <p className="text-center text-sm md:text-lg mb-4 md:mb-8 max-w-3xl mx-auto text-gray-700">
                                Članarina uključuje nedeljne rezervacije za 1, 1.5 ili 2-satne sesije tokom 6-mesečnog
                                perioda.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                {[
                                    {
                                        title: "Radnim danima (08:00 – 16:00)",
                                        items: [
                                            {duration: "1h", price: "48,400 RSD"},
                                            {duration: "1.5h", price: "72,600 RSD"},
                                            {duration: "2h", price: "96,800 RSD"}
                                        ]
                                    },
                                    {
                                        title: "Radnim danima (16:00 – 00:00) & Vikend",
                                        items: [
                                            {duration: "1h", price: "61,600 RSD"},
                                            {duration: "1.5h", price: "92,400 RSD"},
                                            {duration: "2h", price: "123,000 RSD"}
                                        ]
                                    }
                                ].map((group, index) => (
                                    <div key={index}
                                         className="bg-[#f1f5f3] rounded-xl md:rounded-2xl p-4 md:p-8 shadow-md">
                                        <h3 className="text-lg md:text-2xl font-semibold mb-4 text-center">{group.title}</h3>
                                        <ul className="space-y-2 md:space-y-3 text-sm md:text-lg">
                                            {group.items.map((item, i) => (
                                                <li key={i} className="flex justify-between">
                                                    <span>{item.duration}</span>
                                                    <span className="font-medium">{item.price}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Equipment Pricing */}
                    {activeTab === "equipment" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-[#f1f5f3] rounded-xl md:rounded-2xl p-4 md:p-6 text-center shadow-md">
                                <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Reketi</h3>
                                <ul className="space-y-1 text-sm md:text-lg">
                                    <li><strong>Pro</strong> – 500 RSD/h</li>
                                    <li><strong>Početnički</strong> – 200 RSD/h</li>
                                </ul>
                            </div>
                            <div className="bg-[#f1f5f3] rounded-xl md:rounded-2xl p-4 md:p-6 text-center shadow-md">
                                <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-4">Loptica</h3>
                                <p className="text-sm md:text-lg">1000 RSD</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* FAQ Sekcija */}
            <section id="faq" className="py-8 md:py-16 bg-[#F5F0E1] px-4">
                <div className="container mx-auto text-center">
                    <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-8 text-[#233c1d]">Često Postavljana
                        Pitanja</h2>
                    <div className="max-w-3xl mx-auto text-left">
                        <Accordion type="single" collapsible>
                            <AccordionItem value="q1">
                                <AccordionTrigger
                                    className="text-[#233c1d] text-base md:text-xl font-medium px-2 py-3 md:px-4">
                                    Kako mogu rezervisati padel teren?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600 text-sm md:text-base px-2 pb-3">
                                    Za rezervaciju terena, posetite našu stranicu za rezervacije,
                                    odaberite željeni termin, i pratite uputstva. Takođe, možete nas kontaktirati
                                    putem telefona ili e-maila za pomoć pri rezervaciji.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="q2">
                                <AccordionTrigger
                                    className="text-[#233c1d] text-base md:text-xl font-medium px-2 py-3 md:px-4">
                                    Kakvu opremu mi je potrebno?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600 text-sm md:text-base px-2 pb-3">
                                    Preporučujemo da imate padel reket i lopte. Oprema je dostupna za iznajmljivanje
                                    u našem centru, ali ako želite, možete doneti svoju opremu. Takođe, možete kupiti
                                    opremu direktno kod nas.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="q3">
                                <AccordionTrigger
                                    className="text-[#233c1d] text-base md:text-xl font-medium px-2 py-3 md:px-4">
                                    Koji su uslovi za članstvo?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600 text-sm md:text-base px-2 pb-3">
                                    Članstvo uključuje nedeljne rezervacije za 1, 1.5 ili 2-satne sesije tokom
                                    6-mesečnog perioda. Idealno je za redovne igrače koji žele fleksibilnost i uštedu.
                                    Više informacija o članstvu možete pronaći na stranici sa cenama.
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="q4">
                                <AccordionTrigger
                                    className="text-[#233c1d] text-base md:text-xl font-medium px-2 py-3 md:px-4">
                                    Koji su radni sati?
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600 text-sm md:text-base px-2 pb-3">
                                    Naši tereni su otvoreni od 8:00 do 00:00 svakog dana.
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </section>

            <ContactSection/>
        </Layout>
    );
};

export default Home;