import Head from "next/head";
import { Layout } from "@/components/layout/Layout";

const HistoryPage = () => {
  return (
    <Layout>
      <Head>
        <title>Istorija Padela - Padel Platz</title>
        <meta
          name="description"
          content="Otkrijte poreklo i evoluciju padela, sporta koji osvajaju srca širom sveta."
        />
        <link rel="icon" href="/logo-transparent.png" />
      </Head>

      <section className="py-20 bg-[#f4f1e3]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-[#1b362f] mb-6">Istorija Padela</h1>
          <p className="text-lg text-[#1b362f] max-w-3xl mx-auto">
            Padel je nastao u Meksiku 1969. godine, a izumeo ga je Enrique Corcuera. Brzo se proširio u
            Španiji i Argentini, gde je stekao ogromnu popularnost. Danas je jedan od najbrže rastućih
            sportova na svetu, poznat po svojoj pristupačnosti, brzom tempu igre i društvenoj prirodi.
          </p>
          <p className="text-lg text-[#1b362f] mt-6 max-w-3xl mx-auto">
            U Padel Platz-u poštujemo korene ovog neverovatnog sporta i pomažemo njegovom rastu u
            Srbiji. Bilo da ste novi u igri ili iskusni igrač, deo ste globalne zajednice sa bogatom
            istorijom i uzbudljivom budućnošću.
          </p>
        </div>
      </section>

      {/* Poreklo Padela */}
      <section className="py-20 bg-[#1b362f]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Poreklo Padela</h2>
          <p className="text-lg text-white max-w-3xl mx-auto">
            Priča o padelu počinje u Meksiku krajem 1960-ih. Enrique Corcuera, meksički preduzetnik,
            izumeo je igru kao varijaciju tenisa, koja se igra sa zidovima i manjim terenima. Prvi
            zvanični padel teren izgrađen je na Corcerinom imanju, a odatle se sport proširio, da bi
            1970-ih stigao u Španiju i Argentinu.
          </p>
        </div>
      </section>

      {/* Rast Padela */}
      <section className="py-20 bg-[#f4f1e3]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#1b362f] mb-6">Rast Padela</h2>
          <p className="text-lg text-[#1b362f] max-w-3xl mx-auto">
            Kako je padel postao sve popularniji u Evropi i Južnoj Americi, sport je postao poznat
            zbog svoje inkluzivne prirode i društvenog aspekta. Sport je posebno prihvaćen u Španiji,
            gde je doživeo ogromnu ekspanziju, sa hiljadama terena i milionima igrača. Danas je jedan
            od najpopularnijih sportova u Španiji i Argentini, a njegov uticaj se sada širi globalno,
            sa ligama i klubovima koji nastaju širom sveta.
          </p>
        </div>
      </section>

      {/* Ključni Milestones u Istoriji Padela */}
      <section className="py-20 bg-[#1b362f]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ključni Milestones u Istoriji Padela</h2>
          <ul className="text-lg text-white max-w-3xl mx-auto list-disc list-inside">
            <li>1969: Padel je izumio Enrique Corcuera u Meksiku.</li>
            <li>1974: Održan je prvi zvanični padel turnir u Španiji.</li>
            <li>1991: Osnovan je Padel Svetski šampionat.</li>
            <li>2000-ih: Padel tereni počinju brzo da se šire širom Evrope.</li>
            <li>2010-ih: Sport raste eksponencijalno, a Međunarodna padel federacija (FIP) dobija priznanje.</li>
            <li>2020-ih: Padel nastavlja da ulazi na nova tržišta, uključujući SAD, Švedsku i UK.</li>
          </ul>
        </div>
      </section>

      {/* Budućnost Padela */}
      <section className="py-20 bg-[#f4f1e3]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#1b362f] mb-6">Budućnost Padela</h2>
          <p className="text-lg text-[#1b362f] max-w-3xl mx-auto">
            Kako padel nastavlja da raste širom sveta, budućnost sporta je izuzetno svetla. Sa
            stalnim širenjem broja igrača, međunarodnim turnirima i povećanom medijskom pažnjom,
            padel će sigurno postati jedan od najpopularnijih sportova u narednim decenijama. U Padel
            Platz-u ponosni smo što smo deo ovog globalnog pokreta i pozivamo vas da nam se pridružite
            na ovom uzbudljivom putovanju.
          </p>
        </div>
      </section>

      {/* Zabavni Činjenice o Padelu */}
      <section className="py-20 bg-[#1b362f]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Zabavne Činjenice o Padelu</h2>
          <ul className="text-lg text-white max-w-3xl mx-auto list-disc list-inside">
            <li>Padel se igra na terenu koji je trećina veličine teniskog terena.</li>
            <li>Padel se igra u više od 30 zemalja širom sveta, a Španija je epicentar.</li>
            <li>Najveća zabeležena brzina lopte u padelu je preko 250 km/h (155 mph).</li>
            <li>Padel je društveni sport, a mečevi u parovima su najčešći format igre.</li>
          </ul>
        </div>
      </section>
    </Layout>
  );
};

export default HistoryPage;
