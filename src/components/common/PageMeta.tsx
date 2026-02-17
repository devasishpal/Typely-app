import { HelmetProvider, Helmet } from "react-helmet-async";

interface PageMetaProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article";
}

const PageMeta = ({
  title,
  description,
  canonicalUrl,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
}: PageMetaProps) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
    <meta property="og:type" content={ogType} />
    <meta property="og:title" content={ogTitle || title} />
    <meta property="og:description" content={ogDescription || description} />
    {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
    {ogImage ? <meta property="og:image" content={ogImage} /> : null}
    <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
    <meta name="twitter:title" content={ogTitle || title} />
    <meta name="twitter:description" content={ogDescription || description} />
    {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
  </Helmet>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>{children}</HelmetProvider>
);

export default PageMeta;
