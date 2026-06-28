import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/app-shell'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Bolão da Copa 2026',
  description: 'Dê seus palpites nos jogos da Copa do Mundo 2026 e suba na classificação!',
  generator: 'v0.app',
  icons: {
    // Ícone principal da aba: usa a Logo.png do projeto
    icon: [
      {
        url: '/Logo.png',
        type: 'image/png',
      },
    ],
    // Ícone para iOS (toque na tela inicial)
    apple: '/Logo.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#6B22CC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
