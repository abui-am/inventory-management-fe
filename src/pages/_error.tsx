import * as Sentry from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import NextErrorComponent from 'next/error';

type ErrorPageProps = { statusCode: number };

function ErrorPage({ statusCode }: ErrorPageProps): JSX.Element {
  return <NextErrorComponent statusCode={statusCode} />;
}

// Error yang terjadi saat render di server tidak lewat sentry.client.config — halaman
// _error adalah satu-satunya tempat menangkapnya di Pages Router.
ErrorPage.getInitialProps = async (context: NextPageContext): Promise<ErrorPageProps> => {
  await Sentry.captureUnderscoreErrorException(context);

  return NextErrorComponent.getInitialProps(context);
};

export default ErrorPage;
