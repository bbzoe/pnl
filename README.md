# 📊 PnL watch

A beautiful, privacy-first Profit & Loss tracker for traders. Track your daily trading performance with an intuitive calendar heatmap interface.

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8.svg)

## ✨ Features

- **🔒 100% Private** - All data stays in your browser's localStorage. No servers, no tracking, no data collection.
- **📅 Calendar Heatmap** - Visual representation of your daily P&L with intuitive color coding (green for profits, red for losses).
- **📈 Line Chart View** - Track your cumulative performance over time with beautiful charts.
- **💰 Multiple Currencies** - Support for USD, BTC, and ETH.
- **📊 Smart Statistics** - View your performance across different time periods (all time, year, month, week).
- **🗂️ Multiple Calendars** - Create separate calendars for different trading strategies or accounts.
- **🌓 Dark/Light Mode** - Easy on the eyes, day or night.
- **🔐 Password Protection** - Optional password lock to keep your data private.
- **📱 PWA Support** - Install as a standalone app on any device.
- **📱 Mobile Friendly** - Fully responsive design that works great on all screen sizes.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/bbzoe/pnl.git

# Navigate to the project directory
cd pnl

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## 🎯 How to Use

1. **Enter Daily P&L** - Click on any calendar cell and enter your profit or loss for that day.
2. **View Statistics** - Check the widgets at the top to see your performance summary.
3. **Switch Views** - Toggle between Calendar and Chart view using the buttons.
4. **Create Calendars** - Add multiple calendars to track different strategies.
5. **Customize** - Use Settings to toggle widgets and set up password protection.

## 🛠️ Tech Stack

- **[Svelte 5](https://svelte.dev/)** - Modern, reactive UI framework
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Vite](https://vitejs.dev/)** - Next generation frontend tooling
- **[date-fns](https://date-fns.org/)** - Modern JavaScript date utility library
- **[Vite PWA Plugin](https://vite-pwa-org.netlify.app/)** - PWA support

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/     # Svelte components
│   │   ├── Calendar.svelte
│   │   ├── DayCell.svelte
│   │   ├── LineChart.svelte
│   │   ├── StatsWidgets.svelte
│   │   ├── TopBar.svelte
│   │   └── ...
│   ├── stores.ts       # Svelte stores for state management
│   └── types.ts        # TypeScript type definitions
├── App.svelte          # Main application component
├── app.css             # Global styles
└── main.ts             # Application entry point
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need for a simple, private way to track trading performance
- Built with love for the trading community

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/bbzoe">@bbzoe</a>
</p>

<p align="center">
  <a href="https://github.com/bbzoe/pnl">⭐ Star this repo if you find it useful!</a>
</p>
