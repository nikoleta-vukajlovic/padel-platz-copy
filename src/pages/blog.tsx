import Head from "next/head";
import {Layout} from "@/components/layout/Layout";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ArrowLeft, ArrowRight} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react"
import {useEffect, useState} from "react";
import {BlogPost} from "@/types/booking";
import {blogService} from "@/services/blogService";

const BlogPage = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({loop: false, align: "start"})
    const [blogs, setBlogs] = useState<BlogPost[]>([]);
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)

    useEffect(() => {
        // Fetch blogs data
        const fetchBlogs = async () => {
            try {
                const blogsData = await blogService.getBlogs();
                setBlogs(blogsData);
            } catch (error) {
                console.error("Failed to fetch blogs", error);
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
                <title>Vesti - Padel Platz</title>
                <meta
                    name="description"
                    content="Read the latest news, stories, and updates from Padel Platz Kraljevo."
                />
                <link rel="icon" href="/logo-transparent.png"/>
            </Head>

            <section id="blogs" className="py-16 bg-[#1b362f]">
                <div className="container mx-auto text-center">
                    <h2 className="text-4xl font-bold text-white mb-8">Najnovije Vesti</h2>

                    {/* Carousel Container */}
                    <div className="relative">
                        <div ref={emblaRef} className="overflow-hidden">
                            <div className="flex">
                                {blogs.map((blog) => (
                                    <div key={blog.id} className="flex-shrink-0 w-full sm:w-1/2 md:w-1/3 p-4">
                                        <Card className="shadow-lg hover:shadow-2xl transition duration-300 ">
                                            <CardHeader>
                                                <Image
                                                    src={blog.imageUrl || "/images.jpeg"} // Use a default image if none is provided
                                                    alt={blog.title}
                                                    width={350}
                                                    height={200}
                                                    className="w-full h-auto rounded-t-lg"
                                                />
                                                <CardTitle className="text-lg font-bold mt-4">{blog.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <Link href={`/blog/${blog.id}`} passHref>
                                                    <Button className="mt-4">Saznaj ViŠe</Button>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Carousel Navigation Arrows */}
                        <button
                            onClick={() => emblaApi && emblaApi.scrollPrev()}
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10"
                            disabled={!emblaApi?.canScrollPrev()}
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600"/>
                        </button>

                        <button
                            onClick={() => emblaApi && emblaApi.scrollNext()}
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10"
                            disabled={!emblaApi?.canScrollNext()}
                        >
                            <ArrowRight className="w-6 h-6 text-gray-600"/>
                        </button>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default BlogPage;
