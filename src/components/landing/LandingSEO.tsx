import { Helmet } from 'react-helmet-async';

const landingStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Typely',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description:
    'Typely is a modern typing training platform for improving typing speed, accuracy, and confidence through structured lessons and live analytics.',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    ratingCount: '1260',
  },
};

export function LandingSEO() {
  const description =
    "Improve typing speed and accuracy with Typely's structured lessons, adaptive drills, real-time feedback, and progress analytics that build lasting confidence.";

  return (
    <Helmet prioritizeSeoTags>
      <title>Typely | Master Typing with Structured Lessons</title>
      <meta name="description" content={description} />
      <meta
        name="keywords"
        content="typing practice, typing lessons, typing speed test, improve typing, typing accuracy, keyboard training"
      />
      <meta name="robots" content="index,follow" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="Typely | Master Typing with Structured Lessons" />
      <meta property="og:description" content={description} />
      <meta property="og:url" content="https://typely.in/" />
      <meta property="og:image" content="/favicon.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Typely | Master Typing with Structured Lessons" />
      <meta name="twitter:description" content={description} />
      <link rel="canonical" href="https://typely.in/" />
      <link rel="preload" as="image" href="/favicon.png" />
      <script type="application/ld+json">{JSON.stringify(landingStructuredData)}</script>
    </Helmet>
  );
}
