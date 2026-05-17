import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { InstallPrompt } from "@/components/layout/InstallPrompt"
import { PwaRegister } from "@/components/layout/PwaRegister"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Toldos Fortaleza — Gestão Operacional",
  description: "App de pedidos, orçamentos e agendamentos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "TF App",
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0369a1" />
        <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full">
        {children}
        <InstallPrompt />
        <PwaRegister />
      </body>
    </html>
  )
}
