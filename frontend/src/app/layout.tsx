import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://craftlycv.in'),
  title: {
    default: 'CraftlyCV - AI-Powered ATS Resume Analyzer',
    template: '%s | CraftlyCV',
  },
  description: 'Analyze your resume with AI, get ATS scores, and land more interviews. Free resume analysis tool with professional insights.',
  keywords: ['resume analyzer', 'ATS score', 'resume checker', 'CV analyzer', 'job search', 'interview prep', 'AI resume'],
  authors: [{ name: 'CraftlyCV' }],
  creator: 'CraftlyCV',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://craftlycv.in',
    siteName: 'CraftlyCV',
    title: 'CraftlyCV - AI-Powered ATS Resume Analyzer',
    description: 'Analyze your resume with AI, get ATS scores, and land more interviews.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CraftlyCV' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CraftlyCV - AI-Powered ATS Resume Analyzer',
    description: 'Analyze your resume with AI, get ATS scores, and land more interviews.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
