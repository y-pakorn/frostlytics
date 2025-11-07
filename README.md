# Frostlytics - Walrus Protocol Analytics Dashboard

![Frostlytics Logo](public/logo-text.webp)

**Frostlytics** is an all-in-one analytics dashboard for the [Walrus protocol](https://walrus.site/), providing comprehensive insights into staking APY, operator performance, network fees, storage usage, and more. Built with Next.js 15 and modern web technologies, Frostlytics offers a superior user experience compared to the official dashboard with additional features and enhanced analytics.

## 🌟 Features

### Core Analytics

- **Real-time Staking Data** - Live APY calculations, staking trends, and rewards tracking
- **Network Metrics** - Storage usage, fees paid, and network activity
- **Historical Charts** - Track performance over time with interactive visualizations
- **Operator Analytics** - Detailed operator performance, delegations, and rankings

### Staking Management

- **Wallet Integration** - Connect with Sui wallets for seamless staking
- **Stake/Unstake** - Direct staking operations with clear timelines
- **Reward Calculator** - Estimate potential rewards based on staking amount
- **Profile Dashboard** - Personal staking overview and transaction history

### Enhanced Features

- **Tier System** - Bronze, Silver, Gold, Diamond operator rankings
- **Unstaking Timeline** - Clear visibility into when tokens will be released
- **Dark Theme** - Modern dark UI with beautiful gradients
- **Real-time Updates** - Data sourced directly from the blockchain

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom components
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
- **Blockchain**: [Sui Network](https://sui.io/) integration via [@mysten/dapp-kit](https://sdk.mystenlabs.com/dapp-kit)
- **Charts**: [Recharts](https://recharts.org/) for data visualization
- **State Management**: [TanStack Query](https://tanstack.com/query) for server state
- **Analytics**: Vercel Analytics & Google Analytics
- **Deployment**: [Vercel](https://vercel.com/) with automated cron jobs

## 📋 Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database
- Blockberry API key (for blockchain data)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/walrus-dashboard.git
   cd walrus-dashboard
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GA_ID=your-google-analytics-id (optional)

   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/walrus_dashboard

   # API Keys
   BLOCKBERRY_API_KEY=your-blockberry-api-key
   ```

4. **Set up the database**

   ```bash
   pnpm db:sync
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## 🗄️ Database Setup

The project uses Drizzle ORM with PostgreSQL. The database schema includes:

- **Aggregated Daily Data** - Historical network metrics
- **Operator Information** - Operator details and performance
- **Staking Records** - User staking activities and rewards

Run migrations:

```bash
pnpm db:sync
```

## 🔧 Development

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm db:sync` - Generate and run database migrations

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── operator/          # Operator detail pages
│   ├── profile/           # User profile pages
│   └── reward-calculator/ # Reward calculator tool
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature-specific components
├── config/               # Configuration files
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and database
├── services/             # External service integrations
├── styles/               # Global styles
└── types/                # TypeScript type definitions
```

### Key Configuration Files

- `src/config/walrus.ts` - Walrus protocol contract addresses and settings
- `src/config/site.ts` - Site metadata and configuration
- `src/env.mjs` - Environment variable validation
- `drizzle.config.ts` - Database configuration

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

The project includes a `vercel.json` configuration with a daily cron job for data backfilling.

### Manual Deployment

1. **Build the project**

   ```bash
   pnpm build
   ```

2. **Start the production server**
   ```bash
   pnpm start
   ```

## 🔄 Data Synchronization

The application includes automated data synchronization:

- **Cron Job**: Daily at 1:05 AM UTC (`/backfill` endpoint)
- **Real-time Updates**: Live data fetching from Sui blockchain
- **Caching**: Optimized caching for better performance

## 🎨 UI/UX Features

- **Modern Design** - Clean, professional interface with dark theme
- **Responsive Layout** - Mobile-first design with sidebar navigation
- **Interactive Charts** - Hover effects and detailed tooltips
- **Loading States** - Skeleton loaders and smooth transitions
- **Error Handling** - Graceful error states and user feedback

## 🔗 API Integration

### Sui Blockchain

- Direct integration with Sui RPC nodes
- Real-time balance and staking data
- Transaction monitoring and history

### Blockberry API

- Enhanced blockchain analytics
- Historical data aggregation
- Network statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For questions, issues, or feature requests:

- **Twitter**: [@frostlytics](https://twitter.com/frostlytics)
- **GitHub Issues**: [Create an issue](https://github.com/y-pakorn/frostlytics/issues)

## 🔗 Links

- **Live Demo**: [frostlytics.com](https://frostlytics.com)
- **Walrus Protocol**: [walrus.site](https://walrus.site/)
- **Sui Network**: [sui.io](https://sui.io/)

---

Built with ❤️ for the Walrus and Sui ecosystem
