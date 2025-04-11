import { useRouter } from "next/router";
import { blogService } from "@/services/blogService";
import { BlogPost } from "@/types/booking";
import { Button } from "@/components/ui/button";
import Head from "next/head";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BlogPostPageProps {
  blogPost: BlogPost | null;
}

const BlogPostPage = ({ blogPost }: BlogPostPageProps) => {
  const router = useRouter();
  const { id } = router.query;

  if (!blogPost) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <Head>
        <title>{blogPost.title} - Padel Platz Vesti</title>
        <meta name="description" content={blogPost.content} />
        <link rel="icon" href="/logo-transparent.png" />
      </Head>

      <section className="py-16 bg-gray-100">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-8">{blogPost.title}</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Image
                src={blogPost.imageUrl || "/images.jpeg"}
                alt={blogPost.title}
                width={600}
                height={400}
                className="w-full h-auto rounded-lg"
              />
            </div>
            <div className="space-y-4">
              <p className="text-lg text-gray-600">{blogPost.content}</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getServerSideProps = async ({ params }: { params: { id: string } }) => {
  try {
    const blogPost = await blogService.getBlogById(params.id); // Assuming this function fetches a single blog post
    return {
      props: { blogPost: blogPost || null },
    };
  } catch (error) {
    console.error("Failed to fetch blog post", error);
    return {
      props: { blogPost: null },
    };
  }
};

export default BlogPostPage;
