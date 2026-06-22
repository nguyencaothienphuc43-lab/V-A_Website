import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Blog" };

type Post = { slug: string; category: string; date: string; title: string; excerpt: string };

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = t.raw("posts") as Post[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <p className="section-label mb-3">{t("label")}</p>
        <h1 className="section-title mb-4">{t("title")}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">{t("sub")}</p>
      </div>

      {/* Posts grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {posts.map((post, i) => {
          const cardClass = "group flex flex-col bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 overflow-hidden";

          const content = (
            <>
              {/* Coloured header band */}
              <div className="relative h-32 bg-gradient-to-br from-navy-800 to-brand-600 p-6 flex items-end">
                <span className="absolute top-4 right-4 text-[0.65rem] font-bold uppercase tracking-wider
                                 bg-white/20 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {t("badge")}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-200">{post.category}</span>
              </div>

              <div className="flex flex-col flex-1 p-6">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <CalendarDays className="w-3.5 h-3.5" /> {post.date}
                </div>
                <h2 className="font-display font-bold text-xl text-navy-800 mb-3 group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-5 flex-1">{post.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                  {t("readMore")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </>
          );

          return post.slug ? (
            <Link key={i} href={`/${locale}/blog/${post.slug}`} className={cardClass}>
              {content}
            </Link>
          ) : (
            <article key={i} className={cardClass}>
              {content}
            </article>
          );
        })}
      </div>
    </div>
  );
}
