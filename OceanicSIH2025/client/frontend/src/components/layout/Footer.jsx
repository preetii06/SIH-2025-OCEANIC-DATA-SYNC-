export default function Footer() {
    return (
      <footer 
        style={{
          width: '100%',
          background: 'linear-gradient(90deg, #0b3b2f, #0f172a)',
          color: '#d1d5db',
          padding: '32px 24px',
          marginTop: '40px',
          borderTop: '1px solid rgba(16,185,129,0.25)',
          boxSizing: 'border-box'
        }}
      >
        {/* Top Section */}
        <div 
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '24px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}
        >
          {/* Column 1: Brand */}
          <div style={{ flex: '1 1 250px' }}>
            <h2 style={{ color: '#fff', marginBottom: 8 }}>🌊 Oceara</h2>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              A unified platform by CMLRE for managing, visualising and 
              integrating multidisciplinary marine datasets to support 
              research, conservation and the blue economy.
            </p>
          </div>
  
          {/* Column 2: Quick Links */}
          <div style={{ flex: '1 1 180px' }}>
            <h3 style={{ color: '#fff', marginBottom: 8, fontSize: 16 }}>Quick Links</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 14, lineHeight: 1.8 }}>
              <li><a href="/dashboard" style={{ color: '#9fb3cd', textDecoration: 'none' }}>Dashboard</a></li>
              <li><a href="/dashboard/records" style={{ color: '#9fb3cd', textDecoration: 'none' }}>Data Records</a></li>
              <li><a href="/dashboard/taxonomy" style={{ color: '#9fb3cd', textDecoration: 'none' }}>Taxonomy</a></li>
              <li><a href="/dashboard/oceanic-parameters" style={{ color: '#9fb3cd', textDecoration: 'none' }}>Oceanic Parameters</a></li>
              <li><a href="/dashboard/obis-records" style={{ color: '#9fb3cd', textDecoration: 'none' }}>OBIS Records</a></li>
              <li><a href="/dashboard/marine-data" style={{ color: '#9fb3cd', textDecoration: 'none' }}>Marine Data</a></li>
            </ul>
          </div>
  
          {/* Column 3: Contact Info */}
          <div style={{ flex: '1 1 220px' }}>
            <h3 style={{ color: '#fff', marginBottom: 8, fontSize: 16 }}>Contact</h3>
            <p style={{ fontSize: 14, marginBottom: 4 }}>📍 Kochi, Kerala, India</p>
            <p style={{ fontSize: 14, marginBottom: 4 }}>✉️ contact@cmlre.org</p>
            <p style={{ fontSize: 14, marginBottom: 4 }}>📞 +91-12345-67890</p>
          </div>
        </div>
  
        {/* Bottom Section */}
        <div 
          style={{
            borderTop: '1px solid rgba(16,185,129,0.25)',
            marginTop: 24,
            paddingTop: 12,
            textAlign: 'center',
            fontSize: 13,
            color: '#9fb3cd'
          }}
        >
          © {new Date().getFullYear()} OceanicSync | Built for CMLRE, Ministry of Earth Sciences
        </div>
      </footer>
    )
  }
  