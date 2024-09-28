import './globals.css';

export const metadata = {
  title: 'LLM Playground',
  description: 'An LLM Playground using OpenAI API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
