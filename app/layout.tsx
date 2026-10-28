import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Europe Hiring Network | Hire with clarity', description:'Engineer-led recruitment. Share your hiring needs and follow every position in your employer workspace.'};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
