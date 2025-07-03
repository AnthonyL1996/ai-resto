None technical summary:
 Samenvatting Het project omvat de ontwikkeling van een zelfbedieningskiosk-systeem voor een kleine afhaalrestaurant in België, geïntegreerd met een keukendisplaysysteem (KDS). Het doel is om de workflow te stroomlijnen, handmatig werk te verminderen en de klantervaring te verbeteren. Het systeem omvat: Klantgerichte Kiosk: Een touchscreen-interface voor het plaatsen van bestellingen, betalingen en het printen van bonnetjes. Keukendisplaysysteem (KDS): Real-time orderopvolging voor de keukenmedewerkers. Hardware-integratie: Axepta-betaalterminal, thermische printer en industriële touchscreens. Het systeem zal ondersteuning bieden voor meerdere talen: Nederlands, Frans, Duits, Engels en Kantonees, zodat het toegankelijk is voor een breed scala aan klanten. Vereisten Functionele Vereisten 1. Kiosk: 1. Ondersteuning voor meerdere talen (Nederlands, Frans, Duits, Engels, Kantonees). 2. Menutonnel met afbeeldingen, prijzen en dieetfilters (bijv. vegan, glutenvrij). 3. Aanpasbare bestellingen (bijv. extra toppings, geen ui). 4. Integratie met de Axepta-betaalterminal (BNP Paribas Fortis). 5. Bonnetjesprinten voor klanten en keukentickets. 6. Real-time orderupdates naar het KDS. 2. KDS: 1. Real-time weergave van bestellingen met statusopvolging (nieuw, in behandeling, voltooid). 2. Mogelijkheid om bestellingen te markeren als gestart of voltooid. 3. Visuele en optionele geluidsmeldingen voor nieuwe bestellingen. 4. Eenvoudige, touchvriendelijke interface voor keukenpersoneel. 3. Admin Dashboard: 1. Menubeheer (items toevoegen/verwijderen, prijzen aanpassen). 2. Bestelgeschiedenis en analyse bekijken (bijv. populaire items, piekuren). 4. Hardware: 1. Industriële touchscreen-kiosken (bijv. Elo of Advantech). 2. Thermische printers (Epson TM-T88VI) voor bonnetjes en keukentickets. 3. Axepta-betaalterminal (bestaande hardware). Niet-functionele Vereisten * Prestaties: Ondersteuning voor 5+ gelijktijdige gebruikers met <2s responstijd. * Betrouwbaarheid: 99% uptime; back-up- en herstelplan. * Beveiliging: GDPR-conformiteit voor klantgegevens; PCI DSS-conformiteit voor betalingen. * Gebruiksvriendelijkheid: Intuïtieve interface voor klanten en personeel; minimale training vereist. Juridische & Compliance GDPR voor klantgegevens. PCI DSS voor betalingsverwerking. Belgische BTW (21%) en toegankelijkheidsnormen. I would like to add: -Bestellen op website  -15 min tussen maaltijden waar klanten kunnen reserveren op de website. -Cash betalingen kunnen verwijderen van bestelling -2 printers, 1 grote printer (keuken), 1 kleine printer -Opties zelf toevoegen van bv geen champignons of extra pikant. -Mogelijkheid om factuur te maken. 


# Restaurant Kiosk SaaS - Technical Architecture Summary

## System Overview

Self-service kiosk system for Belgian takeaway restaurants with integrated kitchen display system (KDS), supporting multi-language ordering, payments, and real-time order management.

## Core Features

- **Multi-language**: Dutch, French, German, English, Cantonese
- **Visual menu**: Images, prices, dietary filters, customizations
- **Payments**: Axepta terminal integration, cash removal, invoice generation
- **Time slots**: 15-minute reservation system for pickup
- **Dual printing**: Large kitchen printer, small receipt printer
- **Real-time KDS**: Order tracking with status updates
- **Admin dashboard**: Menu management, analytics, multi-location support

## Technology Stack

- **Frontend**: React router with Mantine UI
- **Backend**: Python with FastAPI
- **Database**: PostgreSQL (local) + Supabase (central)
- **Infrastructure**: Hybrid local-first architecture

## Architecture: Hybrid Local + Central Supabase

### Central Infrastructure (Self-Hosted)

```
Hetzner Cloud Server (€40-80/month):
├── Self-Hosted Supabase
│   ├── PostgreSQL (central data)
│   ├── Auth (GoTrue) - user management
│   ├── Realtime - WebSocket updates
│   ├── Storage - menu images, documents
│   ├── Edge Functions - payment processing
│   └── Scheduled Jobs - reports, analytics
└── Connected via WireGuard VPN to restaurants
```

### Restaurant Local Server

```
Mini PC (€400-800 one-time):
├── Local PostgreSQL (orders, real-time data)
├── FastAPI Application
├── Redis (caching/queues)
├── Nginx (reverse proxy)
└── Sync Service → Central Supabase
```

### Network Architecture

- Kiosks/KDS connect to local server (Ethernet)
- Local server syncs with central Supabase
- WireGuard VPN for secure communication
- Works fully offline, syncs when online

## Supabase Feature Utilization

### 1. **Authentication & Authorization**

- Multi-role system: owner, manager, staff, kitchen
- Row Level Security (RLS) for data isolation
- JWT tokens for API access

### 2. **Realtime Updates**

- Menu changes broadcast to restaurants
- Order status updates
- Staff presence tracking
- Kitchen alerts

### 3. **Edge Functions**

- Payment processing with Axepta
- PDF receipt/invoice generation
- Complex order calculations
- Third-party integrations

### 4. **Storage**

- Menu images with CDN
- Auto-optimization/resizing
- Invoice/report storage
- Backup archives

### 5. **Database Features**

- Automatic analytics aggregation
- Trigger-based calculations
- Scheduled reports (cron)
- Vector search for smart menu queries

## Data Flow

### Order Flow (Local-First)

1. Customer places order on kiosk → Local PostgreSQL
1. Kitchen receives instantly via local network
1. Order syncs to Supabase when online
1. Analytics aggregated centrally

### Menu Management (Cloud-First)

1. Owner updates menu on central dashboard
1. Change pushed to restaurant via Realtime
1. Local PostgreSQL updated
1. Kiosks refresh automatically

### Sync Strategy

- **Orders**: Local → Cloud (async, resilient)
- **Menu**: Cloud → Local (real-time when online)
- **Analytics**: Batched hourly uploads
- **Conflict resolution**: Automatic with business rules

## Security & Compliance

- GDPR compliant (EU hosting)
- PCI DSS for payments (via Edge Functions)
- Belgian fiscal requirements
- VPN encryption for all communication
- RLS policies for multi-tenant isolation

## Key Architecture Benefits

- **99.9% uptime**: Works completely offline
- **Low latency**: Local operations <50ms
- **Scalable**: Add restaurants without performance impact
- **Cost-effective**: ~€40-80/month for all restaurants
- **Maintainable**: Central management, local resilience

## Development Approach

1. **Phase 1**: Local FastAPI + PostgreSQL
1. **Phase 2**: Add Supabase auth/realtime
1. **Phase 3**: Implement Edge Functions
1. **Phase 4**: Full sync architecture

## Critical Design Decisions

- **Local-first**: All operations work offline
- **PostgreSQL everywhere**: Consistent data model
- **Supabase for management**: Auth, realtime, storage
- **Python/FastAPI**: Rapid development, easy integrations
- **Self-hosted**: Full control, fixed costs, GDPR compliance​​​​​​​​​​​​​​​​

Given the following repo: https://github.com/AnthonyL1996/ai-resto
