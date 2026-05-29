export const metadata = { title: 'Companheiro Idoso' };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 20, backgroundColor: '#1a1a1a', color: '#fff', fontFamily: 'system-ui', fontSize: '20px', lineHeight: '1.6' }}>
        {children}
      </body>
    </html>
  );
}
