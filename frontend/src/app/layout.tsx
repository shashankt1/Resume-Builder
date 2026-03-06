import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://craftlycv.in'),
  title: {
    default: 'CraftlyCV - AI-Powered Resume Builder',
    template: '%s | CraftlyCV',
  },
  description: 'Create professional, ATS-friendly resumes with AI-powered analysis and interview preparation. Build your perfect resume in minutes.',
  keywords: ['resume builder', 'CV maker', 'AI resume', 'ATS friendly', 'interview questions', 'career tools'],
  authors: [{ name: 'CraftlyCV' }],
  creator: 'CraftlyCV',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://craftlycv.in',
    siteName: 'CraftlyCV',
    title: 'CraftlyCV - AI-Powered Resume Builder',
    description: 'Create professional, ATS-friendly resumes with AI-powered analysis and interview preparation.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CraftlyCV - AI-Powered Resume Builder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CraftlyCV - AI-Powered Resume Builder',
    description: 'Create professional, ATS-friendly resumes with AI-powered analysis and interview preparation.',
    images: ['/og-image.png'],
    creator: '@craftlycv',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  )
}
