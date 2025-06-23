# Admin Dashboard Konzept: Tigube v2 - Phase 1 ✅ ABGESCHLOSSEN!

## 🎉 **Phase 1 - Foundation FERTIG!**

**Implementiert am:** 2025-02-01

### ✅ **Was wurde umgesetzt:**

#### 🔐 **Admin Authentication System**
- **Database Migration**: `20250201000000_create_admin_system.sql`
  - Erweiterte `users` Tabelle um Admin-Felder (`is_admin`, `admin_role`, `totp_secret`)
  - Neue `admin_audit_logs` Tabelle für Audit-Logging
  - RLS Policies für sichere Admin-Zugriffe
  - Helper-Funktionen: `check_admin_access()`, `log_admin_action()`, `get_admin_dashboard_stats()`

#### 🛠️ **Admin Service Layer**
- **AdminService** (`src/lib/admin/adminService.ts`)
  - Vollständige Admin-Authentication-API
  - Dashboard-Statistiken mit Live-Daten
  - Audit-Logging für alle Admin-Aktionen
  - TOTP-Support für 2FA
- **useAdmin Hook** (`src/lib/admin/useAdmin.ts`)
  - React Hook für Admin-Status und Permissions
  - Permission-System mit Rollen-basiertem Zugriff

#### 🎨 **Admin UI Components**
- **AdminLayout** (`src/components/admin/AdminLayout.tsx`)
  - Vollständiges Admin-Layout mit Sidebar-Navigation
  - Mobile-responsive Design
  - Admin-User-Info Display
  - Access-Control mit Fehlerbehandlung
- **AdminDashboardPage** (`src/pages/admin/AdminDashboardPage.tsx`)
  - Live-Dashboard mit echten KPIs
  - User-Zahlen, Revenue, Subscriptions, Messages
  - "Coming Soon" Vorschau für nächste Phasen

#### 🔗 **System Integration**
- **Header-Navigation** erweitert
  - Shield-Icon für Admin-Zugang (nur für Admins sichtbar)
  - Link zu Admin Dashboard in neuem Tab
- **Multi-Page Vite Setup**
  - Separates `admin.html` + `AdminApp.tsx`
  - Unabhängiger Admin-Entry-Point
  - Konfiguriert für `/admin/*` Routen

### 🚀 **Wie du es testest:**

1. **Migration ausführen**: Die neue Migration anwenden
2. **Admin-User erstellen**: In Supabase Dashboard einen User als Admin markieren:
   ```sql
   UPDATE users SET is_admin = true, admin_role = 'super_admin' 
   WHERE email = 'deine-admin-email@domain.com';
   ```
3. **Zugriff testen**: Als Admin einloggen → Shield-Icon im Header → Admin Dashboard

### 📊 **Live-Funktionen:**
- **Real-time KPIs**: User-Zahlen, Umsatz, Subscriptions, Nachrichten
- **Admin-Audit-Trail**: Alle Admin-Aktionen werden automatisch geloggt
- **Permission-System**: Ready für verschiedene Admin-Rollen
- **Responsive Design**: Funktioniert auf Desktop und Mobile

### 🔜 **Bereit für Phase 2:**
Das Foundation-System ist vollständig implementiert und bereit für die nächsten Phasen:
- User Management Interface
- Advanced Analytics
- Revenue Management
- Advertising System

## 🎯 Übersicht

Das Tigube v2 Admin-Dashboard ist das zentrale Kontrollzentrum für die Haustierbetreuungsplattform. Es ermöglicht Administratoren die vollständige Überwachung und Steuerung aller Platform-Aspekte - von Business-Metriken über User-Management bis hin zu Werbe-Monetarisierung.

### Kern-Prinzipien
- **📊 Datengetrieben**: Alle Entscheidungen basieren auf echten Metriken
- **🔍 Transparenz**: Vollständige Einsicht in Platform-Performance  
- **⚡ Reaktionsfähig**: Schnelle Reaktion auf Probleme und Trends
- **🛡️ Sicherheit**: Multi-Level-Authentifizierung und Audit-Trails
- **🎯 Benutzerfreundlich**: Intuitive Bedienung für Non-Tech-Admins
- **📱 Mobile-Ready**: Administrative Aufgaben auch unterwegs

## 🏗️ Technische Integration

### Header-Navigation Erweiterung
```typescript
// src/components/layout/Header.tsx
{isAuthenticated && userProfile?.is_admin && (
  <a 
    href="/admin" 
    target="_blank" 
    className="btn btn-outline text-xs"
  >
    🛡️ Admin
  </a>
)}
```

### Route-Struktur
```
/admin                      # Admin-Login (2FA-protected)
/admin/dashboard           # Haupt-Dashboard mit KPIs
/admin/users              # Benutzer-Management
├── /admin/users/owners       # Owner-Management
├── /admin/users/caretakers   # Caretaker-Management
└── /admin/users/analytics    # User-Analytics
/admin/revenue            # Stripe Revenue Analytics
/admin/advertising        # Werbe-Management
├── /admin/advertising/campaigns  # Kampagnen-Übersicht
├── /admin/advertising/spots      # Werbeplätze-Verwaltung
└── /admin/advertising/analytics  # Ad-Performance
/admin/analytics          # Platform-Analytics
/admin/support            # Customer-Support
/admin/settings           # System-Einstellungen
```

## 📊 Core Dashboard Features

### 1. Business Intelligence Dashboard

#### Key Performance Indicators (KPIs)
```typescript
interface DashboardMetrics {
  // Revenue Tracking
  monthlyRevenue: number;
  revenueGrowth: number;
  arpu: number; // Average Revenue Per User
  
  // User Metrics  
  totalUsers: number;
  activeUsers: number;
  newRegistrations: {
    owners: number;
    caretakers: number;
  };
  
  // Platform Activity
  dailyMessages: number;
  contactRequests: number;
  bookingConversions: number;
  
  // Quality Metrics
  averageRating: number;
  complaintsRate: number;
  responseTime: number;
}
```

#### Real-time Monitoring Cards
```typescript
const DashboardCard = ({ title, value, trend, icon }: {
  title: string;
  value: string | number;
  trend?: number;
  icon: string;
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}% vs. letzter Monat
          </p>
        )}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);
```

### 2. Revenue Analytics System

#### Stripe Integration
```typescript
// Basierend auf bestehenden billing_history und subscriptions Tabellen
const RevenueAnalytics = () => {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  
  useEffect(() => {
    // SQL Query für Revenue Analytics
    const query = `
      SELECT 
        DATE_TRUNC('month', billing_period_start) as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions,
        AVG(amount) as avg_transaction
      FROM billing_history 
      WHERE payment_status = 'paid'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12;
    `;
    
    executeQuery(query).then(setRevenueData);
  }, []);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">💰 Revenue Entwicklung</h3>
      <LineChart data={revenueData}>
        <Line dataKey="revenue" stroke="#10B981" name="Umsatz" />
        <Line dataKey="transactions" stroke="#8B5CF6" name="Transaktionen" />
      </LineChart>
    </div>
  );
};
```

#### Revenue Metriken
- **Monatlicher Umsatz**: Aus `billing_history` Tabelle
- **ARPU (Average Revenue Per User)**: Revenue / Anzahl aktive Subscriptions
- **Churn Rate**: Gekündigte vs. neue Subscriptions
- **LTV (Lifetime Value)**: Durchschnittlicher User-Wert
- **MRR (Monthly Recurring Revenue)**: Vorhersagbare monatliche Einnahmen

### 3. User Management & Analytics

#### User-Übersicht Dashboard
```typescript
interface UserManagementView {
  // Basierend auf users, subscriptions und usage_tracking Tabellen
  totalUsers: {
    owners: number;
    caretakers: number;
    trial: number;
    premium: number;
    professional: number;
  };
  
  geographic: {
    topCities: Array<{ city: string; count: number }>;
    plzDistribution: Map<string, number>;
  };
  
  engagement: {
    dailyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionDuration: number;
    messagesPerUser: number;
  };
}
```

#### User-Detail-Views
```typescript
const UserDetailModal = ({ userId }: { userId: string }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  
  // Aggregierte Daten aus mehreren Tabellen
  const fetchUserDetails = async (id: string) => {
    const query = `
      SELECT 
        u.*,
        s.plan_type,
        s.status as subscription_status,
        COUNT(m.id) as message_count,
        COUNT(DISTINCT c.id) as conversation_count,
        ut.contact_requests_this_month
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN messages m ON u.id = m.sender_id
      LEFT JOIN conversations c ON (u.id = c.owner_id OR u.id = c.caretaker_id)
      LEFT JOIN (
        SELECT user_id, 
               SUM(count) as contact_requests_this_month 
        FROM usage_tracking 
        WHERE action_type = 'contact_request' 
        AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        GROUP BY user_id
      ) ut ON u.id = ut.user_id
      WHERE u.id = $1
      GROUP BY u.id, s.plan_type, s.status, ut.contact_requests_this_month;
    `;
    
    return await executeQuery(query, [id]);
  };
  
  return (
    <Modal>
      <div className="space-y-6">
        <UserBasicInfo user={userDetails} />
        <SubscriptionInfo subscription={userDetails?.subscription} />
        <UsageMetrics usage={userDetails?.usage} />
        <ChatHistory userId={userId} />
        <AdminActions userId={userId} />
      </div>
    </Modal>
  );
};
```

### 4. Werbe-Management System

#### Database Schema für Werbung
```sql
-- Neue Tabellen für das Werbe-System
CREATE TABLE ad_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- "Homepage Hero", "Search Sidebar"
  description TEXT,
  dimensions TEXT NOT NULL, -- "970x250px"
  price_per_day DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL, -- "homepage_hero", "search_sidebar", "profile_banner"
  is_active BOOLEAN DEFAULT true,
  max_file_size_mb INTEGER DEFAULT 5,
  allowed_formats TEXT[] DEFAULT ARRAY['jpg', 'png', 'gif', 'webp'],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_spot_id UUID REFERENCES ad_spots(id),
  advertiser_name TEXT NOT NULL,
  advertiser_email TEXT NOT NULL,
  advertiser_phone TEXT,
  company_name TEXT,
  creative_url TEXT NOT NULL,
  landing_url TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'active',
  target_audience JSON, -- Targeting-Optionen
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id),
  date DATE DEFAULT CURRENT_DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,4) DEFAULT 0, -- Click-Through-Rate
  revenue DECIMAL(10,2) DEFAULT 0,
  user_demographics JSON, -- Age, location, user_type breakdown
  UNIQUE(campaign_id, date)
);

-- Indexes für Performance
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX idx_ad_analytics_campaign_date ON ad_analytics(campaign_id, date);
CREATE INDEX idx_ad_spots_location ON ad_spots(location);
```

#### Werbeplätze-Management Interface
```typescript
const AdSpotManager = () => {
  const [adSpots, setAdSpots] = useState<AdSpot[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  const availableLocations = [
    { id: 'homepage_hero', name: 'Homepage Hero Banner', dimensions: '970x250' },
    { id: 'search_sidebar', name: 'Suchseite Sidebar', dimensions: '300x250' },
    { id: 'profile_banner', name: 'Profil-Seite Banner', dimensions: '728x90' },
    { id: 'chat_interface', name: 'Chat-Interface Ad', dimensions: '320x50' },
    { id: 'search_results', name: 'Suchergebnisse Sponsored', dimensions: 'native' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🎯 Werbeplätze Übersicht</h3>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Platz</th>
                <th className="text-left p-3">Größe</th>
                <th className="text-left p-3">Preis/Tag</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Aktuelle Kampagne</th>
                <th className="text-left p-3">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {adSpots.map(spot => (
                <AdSpotRow key={spot.id} spot={spot} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <AdCampaignCalendar campaigns={campaigns} />
      <AdRevenueChart />
    </div>
  );
};
```

#### Frontend Werbe-Integration
```typescript
// Dynamische Werbeanzeigen in bestehenden Komponenten
const AdBanner = ({ location, className }: { 
  location: string; 
  className?: string;
}) => {
  const [currentAd, setCurrentAd] = useState<Campaign | null>(null);
  
  useEffect(() => {
    const fetchCurrentCampaign = async () => {
      const { data } = await supabase
        .from('ad_campaigns')
        .select(`
          *,
          ad_spots(name, dimensions, location)
        `)
        .eq('ad_spots.location', location)
        .eq('status', 'active')
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      setCurrentAd(data);
    };
    
    fetchCurrentCampaign();
  }, [location]);
  
  const trackAdClick = async () => {
    if (!currentAd) return;
    
    await supabase.rpc('track_ad_click', {
      campaign_id: currentAd.id,
      click_timestamp: new Date().toISOString()
    });
  };
  
  if (!currentAd) return null;
  
  return (
    <div className={cn("ad-banner border rounded-lg p-4 bg-gray-50", className)}>
      <div className="text-xs text-gray-400 mb-2">Werbung</div>
      <a 
        href={currentAd.landing_url}
        onClick={trackAdClick}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img 
          src={currentAd.creative_url} 
          alt={`Werbung von ${currentAd.advertiser_name}`}
          className="w-full h-auto rounded"
        />
      </a>
    </div>
  );
};

// Integration in bestehende Seiten
const HomePage = () => (
  <Layout>
    {/* Hero Section mit Werbung */}
    <section className="bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="container-custom py-16">
        <AdBanner location="homepage_hero" className="mb-8" />
        <SearchForm />
      </div>
    </section>
    
    {/* Weitere Inhalte */}
  </Layout>
);

const SearchPage = () => (
  <Layout>
    <div className="container-custom py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <SearchResults />
        </div>
        <div className="lg:col-span-1">
          <AdBanner location="search_sidebar" />
          <SearchFilters />
        </div>
      </div>
    </div>
  </Layout>
);
```

## 🔐 Sicherheits-Framework

### Admin-Authentifizierung
```sql
-- Database Schema Erweiterung
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN admin_role TEXT CHECK (admin_role IN ('super_admin', 'admin', 'moderator', 'support'));
ALTER TABLE users ADD COLUMN totp_secret TEXT; -- für 2FA
ALTER TABLE users ADD COLUMN last_admin_login TIMESTAMPTZ;

-- Admin-spezifische Tabelle für Audit-Logs
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  old_values JSON,
  new_values JSON,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Multi-Factor Authentication
```typescript
// Admin 2FA Implementation
import { authenticator } from 'otplib';

const AdminLogin = () => {
  const [step, setStep] = useState<'email' | 'totp'>('email');
  const [totpCode, setTotpCode] = useState('');
  
  const handleEmailLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('is_admin, totp_secret')
      .eq('id', data.user.id)
      .single();
      
    if (!userProfile?.is_admin) {
      throw new Error('Keine Admin-Berechtigung');
    }
    
    setStep('totp');
  };
  
  const handleTotpVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Nicht authentifiziert');
    
    const { data: userProfile } = await supabase
      .from('users')
      .select('totp_secret')
      .eq('id', user.id)
      .single();
    
    const isValid = authenticator.verify({
      token: totpCode,
      secret: userProfile.totp_secret
    });
    
    if (!isValid) {
      throw new Error('Ungültiger TOTP-Code');
    }
    
    // Log successful admin login
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: user.id,
      action: 'admin_login',
      ip_address: await getClientIP(),
      user_agent: navigator.userAgent
    });
    
    // Redirect to admin dashboard
    window.location.href = '/admin/dashboard';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">🛡️ Admin Login</h2>
        </div>
        
        {step === 'email' ? (
          <EmailLoginForm onSubmit={handleEmailLogin} />
        ) : (
          <TotpVerificationForm 
            onSubmit={handleTotpVerification}
            totpCode={totpCode}
            onTotpChange={setTotpCode}
          />
        )}
      </div>
    </div>
  );
};
```

### Role-Based Access Control
```typescript
// RBAC Implementation
enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin', 
  MODERATOR = 'moderator',
  SUPPORT = 'support'
}

const ROLE_PERMISSIONS = {
  [AdminRole.SUPER_ADMIN]: ['*'], // All permissions
  [AdminRole.ADMIN]: [
    'users.read', 'users.write', 'users.delete',
    'revenue.read', 'analytics.read',
    'advertising.read', 'advertising.write',
    'content.moderate'
  ],
  [AdminRole.MODERATOR]: [
    'users.read', 'content.moderate', 'support.read'
  ],
  [AdminRole.SUPPORT]: [
    'users.read', 'support.read', 'support.write'
  ]
};

const useAdminPermissions = () => {
  const { userProfile } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!userProfile?.is_admin) return false;
    
    const userPermissions = ROLE_PERMISSIONS[userProfile.admin_role];
    return userPermissions.includes('*') || userPermissions.includes(permission);
  };
  
  return { hasPermission };
};

// Usage in components
const UserManagement = () => {
  const { hasPermission } = useAdminPermissions();
  
  if (!hasPermission('users.read')) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      <UserList />
      {hasPermission('users.write') && <UserEditModal />}
      {hasPermission('users.delete') && <UserDeleteButton />}
    </div>
  );
};
```

## 📈 SQL Queries für Analytics

### Revenue Analytics
```sql
-- Monatliche Revenue-Entwicklung
CREATE OR REPLACE FUNCTION get_revenue_analytics(months_back INTEGER DEFAULT 12)
RETURNS TABLE (
  month DATE,
  total_revenue DECIMAL(10,2),
  transaction_count INTEGER,
  average_transaction DECIMAL(10,2),
  new_subscribers INTEGER,
  churned_subscribers INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH monthly_revenue AS (
    SELECT 
      DATE_TRUNC('month', billing_period_start)::DATE as month,
      SUM(amount) as total_revenue,
      COUNT(*) as transaction_count,
      AVG(amount) as average_transaction
    FROM billing_history 
    WHERE payment_status = 'paid'
    AND billing_period_start >= CURRENT_DATE - INTERVAL '1 month' * months_back
    GROUP BY DATE_TRUNC('month', billing_period_start)
  ),
  monthly_subscriptions AS (
    SELECT 
      DATE_TRUNC('month', created_at)::DATE as month,
      COUNT(*) as new_subscribers
    FROM subscriptions
    WHERE status IN ('active', 'trial')
    AND created_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
    GROUP BY DATE_TRUNC('month', created_at)
  ),
  monthly_churn AS (
    SELECT 
      DATE_TRUNC('month', updated_at)::DATE as month,
      COUNT(*) as churned_subscribers
    FROM subscriptions
    WHERE status = 'cancelled'
    AND updated_at >= CURRENT_DATE - INTERVAL '1 month' * months_back
    GROUP BY DATE_TRUNC('month', updated_at)
  )
  SELECT 
    COALESCE(mr.month, ms.month, mc.month) as month,
    COALESCE(mr.total_revenue, 0) as total_revenue,
    COALESCE(mr.transaction_count, 0) as transaction_count,
    COALESCE(mr.average_transaction, 0) as average_transaction,
    COALESCE(ms.new_subscribers, 0) as new_subscribers,
    COALESCE(mc.churned_subscribers, 0) as churned_subscribers
  FROM monthly_revenue mr
  FULL OUTER JOIN monthly_subscriptions ms ON mr.month = ms.month
  FULL OUTER JOIN monthly_churn mc ON mr.month = mc.month
  ORDER BY month DESC;
END;
$$;
```

### User Analytics
```sql
-- User Growth und Engagement Metriken
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS TABLE (
  metric_name TEXT,
  current_value INTEGER,
  previous_value INTEGER,
  change_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  previous_month_start DATE := current_month_start - INTERVAL '1 month';
BEGIN
  RETURN QUERY
  WITH current_metrics AS (
    SELECT 
      'total_users' as metric,
      COUNT(*) as value
    FROM users
    WHERE created_at < current_month_start
    
    UNION ALL
    
    SELECT 
      'new_users_this_month',
      COUNT(*)
    FROM users
    WHERE created_at >= current_month_start
    
    UNION ALL
    
    SELECT 
      'active_conversations_this_month',
      COUNT(DISTINCT c.id)
    FROM conversations c
    JOIN messages m ON c.id = m.conversation_id
    WHERE m.created_at >= current_month_start
    
    UNION ALL
    
    SELECT 
      'messages_this_month',
      COUNT(*)
    FROM messages
    WHERE created_at >= current_month_start
  ),
  previous_metrics AS (
    SELECT 
      'new_users_this_month' as metric,
      COUNT(*) as value
    FROM users
    WHERE created_at >= previous_month_start 
    AND created_at < current_month_start
    
    UNION ALL
    
    SELECT 
      'active_conversations_this_month',
      COUNT(DISTINCT c.id)
    FROM conversations c
    JOIN messages m ON c.id = m.conversation_id
    WHERE m.created_at >= previous_month_start 
    AND m.created_at < current_month_start
    
    UNION ALL
    
    SELECT 
      'messages_this_month',
      COUNT(*)
    FROM messages
    WHERE created_at >= previous_month_start 
    AND created_at < current_month_start
  )
  SELECT 
    cm.metric as metric_name,
    cm.value as current_value,
    COALESCE(pm.value, 0) as previous_value,
    CASE 
      WHEN COALESCE(pm.value, 0) = 0 THEN 100.0
      ELSE ROUND(((cm.value - COALESCE(pm.value, 0))::DECIMAL / COALESCE(pm.value, 1)) * 100, 2)
    END as change_percentage
  FROM current_metrics cm
  LEFT JOIN previous_metrics pm ON cm.metric = pm.metric;
END;
$$;
```

### Geographic Distribution
```sql
-- Geografische Verteilung der User
CREATE OR REPLACE VIEW user_geographic_distribution AS
SELECT 
  u.plz,
  u.city,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE u.user_type = 'owner') as owners,
  COUNT(*) FILTER (WHERE u.user_type = 'caretaker') as caretakers,
  COUNT(*) FILTER (WHERE s.plan_type = 'premium') as premium_users,
  COUNT(*) FILTER (WHERE s.plan_type = 'professional') as professional_users,
  AVG(CASE WHEN u.user_type = 'caretaker' THEN cp.rating END) as avg_caretaker_rating
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN caretaker_profiles cp ON u.id = cp.id AND u.user_type = 'caretaker'
WHERE u.plz IS NOT NULL AND u.city IS NOT NULL
GROUP BY u.plz, u.city
HAVING COUNT(*) >= 5  -- Nur PLZ mit mindestens 5 Usern
ORDER BY total_users DESC;
```

## 🚀 Implementation Roadmap

### Phase 1: Foundation (1-2 Wochen)
- [ ] **Admin-Authentication System**
  - `is_admin` Flag in users-Tabelle
  - 2FA mit TOTP implementieren
  - Admin-Audit-Logs einrichten
  - Role-Based Access Control
  
- [ ] **Basic Dashboard Layout**
  - Admin-Layout-Komponente
  - Navigation-Sidebar
  - Header mit Admin-Indikator
  - Responsive Design

- [ ] **Header Integration**
  - Admin-Link für berechtigte User
  - Öffnet in neuem Tab
  - Security-Check vor Anzeige

### Phase 2: Core Analytics (2-3 Wochen)
- [ ] **Revenue Dashboard**
  - Stripe-Integration für Live-Daten
  - Monatliche/Tägliche Revenue-Charts
  - ARPU und LTV Berechnung
  - Subscription-Metriken

- [ ] **User Analytics**
  - User-Growth-Charts
  - Geographic Distribution Maps  
  - Engagement-Metriken
  - Cohort-Analysen

- [ ] **Platform Metrics**
  - Chat-Activity-Monitoring
  - Conversion-Rate-Tracking
  - Performance-Indikatoren
  - Real-time-User-Count

### Phase 3: User Management (2-3 Wochen)
- [ ] **User-Management Interface**
  - Filterable User-Listen
  - User-Detail-Views
  - Subscription-Management
  - Account-Actions (Warn/Suspend/Delete)

- [ ] **Advanced User Analytics**
  - User-Journey-Tracking
  - Behavioral-Segmentation
  - Usage-Pattern-Analysis
  - Support-Ticket-Integration

### Phase 4: Werbe-System (3-4 Wochen)
- [ ] **Advertising Database Schema**
  - ad_spots, ad_campaigns, ad_analytics Tabellen
  - RLS Policies für Werbe-Daten
  - SQL-Funktionen für Ad-Tracking

- [ ] **Ad-Management Interface**
  - Werbeplätze-Verwaltung
  - Kampagnen-Erstellung und -Management
  - Advertiser-CRM
  - Revenue-Tracking

- [ ] **Frontend Ad-Integration**
  - Dynamic Ad-Spots in Homepage
  - Search-Page Ad-Placements
  - Profile-Page Banner-Ads
  - Click/Impression-Tracking

### Phase 5: Advanced Features (2-3 Wochen)
- [ ] **Content Moderation**
  - Reported Content Dashboard
  - Automated Flag-Detection
  - Moderation-Queue-Management
  - Appeal-System

- [ ] **Advanced Analytics**
  - Custom Dashboard Builder
  - Exportable Reports (CSV/PDF)
  - Scheduled Reports via Email
  - Predictive Analytics

- [ ] **Mobile Optimization**
  - Responsive Admin-Interface
  - Mobile-First Dashboard-Cards
  - Touch-optimized Controls

## 📊 Erwartete Auswirkungen

### Business Impact
- **📈 Revenue Growth**: 20-30% durch Werbe-Monetarisierung
- **🎯 Better Targeting**: Datenbasierte Geschäftsentscheidungen
- **⚡ Faster Problem Resolution**: Real-time Monitoring und Alerts
- **📊 User Retention**: Verbesserte UX durch datengetriebene Optimierungen

### Technical Benefits
- **🔍 Complete Visibility**: 360°-Sicht auf Platform-Performance
- **🛡️ Enhanced Security**: Multi-layer Admin-Security
- **📱 Mobile Admin**: Administration von überall möglich
- **🤖 Automation**: Automatisierte Moderation und Reporting

### Operational Efficiency
- **⏱️ Reduced Manual Work**: Automatisierte Reports und Alerts
- **🎯 Focused Decisions**: KPI-basierte Prioritätensetzung  
- **📞 Better Support**: Integrierte User-Support-Tools
- **📈 Scaling Preparation**: Analytics für Wachstums-Planning

## 🔧 Technische Anforderungen

### Dependencies
```json
{
  "devDependencies": {
    "@types/node": "^20.0.0",
    "recharts": "^2.8.0",
    "date-fns": "^2.30.0",
    "otplib": "^12.0.1",
    "qrcode": "^1.5.3"
  }
}
```

### Environment Variables
```env
# Admin-spezifische Konfiguration
VITE_ADMIN_TOTP_ISSUER=Tigube_Admin
VITE_ADMIN_SESSION_TIMEOUT=3600000
VITE_ENABLE_ADMIN_DEBUG=false

# Werbe-System
VITE_AD_CLICK_TRACKING_URL=/api/ad-click
VITE_AD_IMPRESSION_TRACKING_URL=/api/ad-impression
```

### Database Functions
```sql
-- Ad-Tracking-Funktionen
CREATE OR REPLACE FUNCTION track_ad_impression(
  campaign_id UUID,
  user_demographics JSON DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ad_analytics (campaign_id, date, impressions, user_demographics)
  VALUES (campaign_id, CURRENT_DATE, 1, user_demographics)
  ON CONFLICT (campaign_id, date)
  DO UPDATE SET 
    impressions = ad_analytics.impressions + 1,
    user_demographics = COALESCE(ad_analytics.user_demographics, '{}')::jsonb || COALESCE(user_demographics, '{}')::jsonb;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION track_ad_click(
  campaign_id UUID,
  click_timestamp TIMESTAMPTZ DEFAULT NOW()
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ad_analytics (campaign_id, date, clicks)
  VALUES (campaign_id, click_timestamp::DATE, 1)
  ON CONFLICT (campaign_id, date)
  DO UPDATE SET clicks = ad_analytics.clicks + 1;
  
  -- Update CTR
  UPDATE ad_analytics 
  SET ctr = CASE 
    WHEN impressions > 0 THEN (clicks::DECIMAL / impressions) * 100
    ELSE 0
  END
  WHERE campaign_id = track_ad_click.campaign_id 
  AND date = click_timestamp::DATE;
END;
$$ LANGUAGE plpgsql;
```

---

## 📝 Zusammenfassung

Das Admin Dashboard für Tigube v2 wird ein mächtiges Tool zur Platform-Verwaltung und -Optimierung. Mit vollständiger Integration in die bestehende Supabase-Architektur, modernem React-Frontend und umfassenden Analytics-Funktionen schafft es die Grundlage für datengetriebenes Wachstum und erfolgreiche Monetarisierung durch Werbung.

**Nächster Schritt**: Welche Phase sollen wir zuerst angehen? Ich empfehle mit Phase 1 (Foundation) zu beginnen und das Admin-Authentication-System zu implementieren. 