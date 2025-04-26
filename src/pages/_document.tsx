import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* React Quill styles will only be loaded client-side */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 