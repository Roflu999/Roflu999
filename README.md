# ChemTutor AI 🧪

A ChatGPT-style chemistry tutoring web application covering all chemistry domains up to college level.

![ChemTutor Screenshot](screenshot.png)

## Features

- **Conversational Interface** - ChatGPT-style UI for natural chemistry discussions
- **Molar Mass Calculator** - Calculate molecular weights with element breakdown
- **pH Calculations** - Strong/weak acid and base problems
- **Reaction Mechanisms** - SN1/SN2, E1/E2, Diels-Alder explanations
- **Compound Lookup** - Access to chemical properties and data

## Supported Topics

- General Chemistry (stoichiometry, gas laws, thermodynamics)
- Organic Chemistry (reactions, mechanisms, synthesis)
- Inorganic Chemistry (periodic trends, coordination compounds)
- Physical Chemistry (kinetics, equilibrium, electrochemistry)
- Analytical Chemistry (titrations, pH, buffers)

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open http://localhost:5000
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to Render

1. Fork this repository
2. Go to [Render](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repo
5. Build Command: `npm install`
6. Start Command: `node server.js`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web interface |
| `/api/chat` | POST | Send a chemistry question |

### Example API Call

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Calculate molar mass of H2SO4"}'
```

## File Structure

```
chem-tutor-web/
├── index.html          # Web interface
├── server.js           # Express backend
├── package.json        # Dependencies
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Deployment**: Vercel, Render, or Netlify

## License

MIT License - feel free to use and modify!

---

Made with ⚗️ for chemistry enthusiasts everywhere.
