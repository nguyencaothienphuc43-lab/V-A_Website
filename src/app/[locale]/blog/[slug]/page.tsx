import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, CalendarDays } from "lucide-react";
import Link from "next/link";
import fs from "fs/promises";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Post = { slug: string; category: string; date: string; title: string; excerpt: string };

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

async function getBlogContent(slug: string): Promise<string | null> {
  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({ slug: f.replace(/\.md$/, "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = t.raw("posts") as Post[];
  const post = posts.find((p) => p.slug === slug);
  return { title: post?.title ?? "Blog" };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = t.raw("posts") as Post[];
  const post = posts.find((p) => p.slug === slug);

  if (!post) notFound();

  const markdown = await getBlogContent(slug);
  if (!markdown) notFound();

  const contentWithoutH1 = markdown.replace(/^#\s+.+\n*/m, "");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href={`/${locale}/blog`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToList")}
      </Link>

      <header className="mb-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-4">
          {post.category}
        </span>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-navy-800 mb-4 leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <CalendarDays className="w-4 h-4" />
          {post.date}
        </div>
      </header>

      <article className="prose prose-lg prose-gray max-w-none
        prose-headings:font-display prose-headings:text-navy-800
        prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
        prose-p:text-gray-600 prose-p:leading-relaxed
        prose-li:text-gray-600
        prose-strong:text-navy-800
        prose-blockquote:border-brand-500 prose-blockquote:bg-brand-50/50 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-4
        prose-table:text-sm
        prose-th:bg-navy-800 prose-th:text-white prose-th:font-semibold prose-th:py-3 prose-th:px-4
        prose-td:py-3 prose-td:px-4 prose-td:border-gray-200
        prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentWithoutH1}</ReactMarkdown>
      </article>
    </div>
  );
}
