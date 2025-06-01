import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Logo } from '@/components/Logo'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Object Whisperer',
  description: 'Make your objects come alive with AI-powered conversations and animations!',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Logo />
        {children}
      </body>
    </html>
  )
} 