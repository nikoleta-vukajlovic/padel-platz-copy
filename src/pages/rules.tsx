import Head from "next/head";
import {Layout} from "@/components/layout/Layout";
import {Card, CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useState} from "react";

type RuleTab = "service" | "scoring" | "walls" | "ball" | "racket" | "court";

const ruleContent: Record<RuleTab, { title: string; content: string }> = {
    service: {
        title: "Servis",
        content: `Za razliku od tenisa, u padelu je servis uvek ispod ruke i mora biti izveden ispod nivoa struka. Igrač servira nakon što lopta odskoči jednom od zemlje, a udarac se izvodi tako da se lopta pošalje dijagonalno u protivničko servis polje.

Servis se izvodi s desne strane terena i mora se ponoviti ako lopta dotakne mrežu, ali ipak uđe u ispravno servis polje. Igrači imaju pravo na dva pokušaja servisa.`
    },
    scoring: {
        title: "Bodovanje",
        content: `Sistem bodovanja u padelu je identičan teniskom: 15, 30, 40 i gem. U slučaju izjednačenja na 40:40, koristi se prednost ("deuce" sistem).

Set se osvaja kada jedan par osvoji šest gemova, s tim da mora imati prednost od najmanje dva gema. Meč se igra na dva dobijena seta.`
    },
    walls: {
        title: "Pravila o Zidovima",
        content: `Zidovi su sastavni deo igre u padelu i donose dodatnu dinamiku. Igrač može da udari lopticu tako da se odbije od sopstvenog zida nakon što ona pređe mrežu – ovo je dozvoljeno.

Međutim, ako lopta direktno pogodi zid na protivničkoj strani bez prethodnog dodira tla, to se smatra greškom. Isto važi i ako se nakon odskoka lopta odbije od zida pa potom od metalne ograde, ili ako se odbije od zida na sopstvenoj strani i vrati u svoje polje.`
    },
    ball: {
        title: "Loptice",
        content: `Iako podseća na tenisku, padel lopta ima manji unutrašnji pritisak, što joj daje blaži i niži odskok – savršen za manji teren i brze reakcije.

Standardna boja je žuta, a ranije su se koristile i narandžaste lopte. Težina lopte je između 56 i 59,5 grama, a kada se ispusti sa visine od 2,54 m, treba da odskoči između 135 i 147 cm.`
    },
    racket: {
        title: "Reket",
        content: `Za razliku od teniskog reketa, padel reket je kraći, širi i nema žice. Napravljen je od kompozitnih materijala i ima rupice koje smanjuju otpor vazduha.

Reketi se razlikuju po obliku (okrugli, dijamantski, suza), balansu i težini. Izbor reketa zavisi od stila igre – kontrola, snaga ili balansirana igra. Početnici obično biraju lakše rekete sa većim "sweet spotom" za lakše udaranje.`
    },
    court: {
        title: "Teren",
        content: `Padel teren je dimenzija 20 m x 10 m, ograđen zidovima i metalnim mrežama koje su deo igre. Najčešći tip terena ima zadnje zidove od stakla visine 3 m, uz dodatnu mrežu do visine od 4 m. Bočne strane mogu biti u kombinaciji stakla i mreže.

Postoje varijacije terena gde je kompletna ograda visine 4 m. Zidovi mogu biti izrađeni od stakla, pleksiglasa ili čak cigle, u zavisnosti od konstrukcije kluba.`
    }
};

const PadelRules = () => {
    const [selectedRuleTab, setSelectedRuleTab] = useState<RuleTab>('service');

    return (
        <Layout>
            <Head>
                <title>Padel Pravila - Padel Platz</title>
                <meta
                    name="description"
                    content="Learn the basic rules of padel at Padel Platz Kraljevo."
                />
                <link rel="icon" href="/logo-transparent.png"/>
            </Head>

            <section id='rules' className='py-16 bg-[#1b362f]'>
                <div className='w-full'>
                    <Card className='shadow-none border-none backdrop-blur-sm bg-[#1b362f] px-0 lg:px-[200px]'>
                        <CardContent>
                            <div className='grid grid-cols-1 md:grid-cols-6 text-white'>
                                {(Object.keys(ruleContent) as RuleTab[]).map((tab) => (
                                    <Button
                                        key={tab}
                                        variant={selectedRuleTab === tab ? 'default' : 'outline'}
                                        style={{padding: '1.6rem 2rem'}}
                                        className='text-lg font-medium rounded-none'
                                        onClick={() => setSelectedRuleTab(tab)}
                                    >
                                        {ruleContent[tab].title}
                                    </Button>
                                ))}
                            </div>

                            <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-white'>
                                <div>
                                    <img
                                        src='/campi-da-padel-i8730-k6noro-w600-l1-m8kbs7e5.jpg'
                                        alt='Padel Court'
                                        className='w-full h-auto rounded-lg'
                                    />
                                </div>
                                <div className='space-y-4'>
                                    <h3 className='text-2xl font-bold'>{ruleContent[selectedRuleTab].title}</h3>
                                    <p className='text-lg whitespace-pre-line'>
                                        {ruleContent[selectedRuleTab].content}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </Layout>
    );
};

export default PadelRules;