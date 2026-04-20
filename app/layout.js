import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'KodeBattle — Cloud-Powered 1v1 Competitive Quiz Platform',
  description: 'A cloud-native 1v1 DSA quiz platform built on AWS EC2, RDS, S3, and Load Balancer. No crypto, just pure competitive coding.',
  keywords: 'AWS, EC2, RDS, S3, load balancer, quiz, coding, competitive, cloud',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <div style={{ flex: 1 }}>
              {children}
            </div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
