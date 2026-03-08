module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  
  if (!message) {
    return res.json({ response: 'Please ask a chemistry question!' });
  }

  const response = generateResponse(message);
  res.json({ response });
};

const ATOMIC_MASSES = {
  'H': 1.008, 'C': 12.01, 'N': 14.01, 'O': 16.00, 'Na': 22.99,
  'Mg': 24.31, 'Al': 26.98, 'Si': 28.09, 'P': 30.97, 'S': 32.07,
  'Cl': 35.45, 'K': 39.10, 'Ca': 40.08, 'Fe': 55.85, 'Cu': 63.55,
  'Zn': 65.39, 'Br': 79.90, 'Ag': 107.9, 'Au': 197.0
};

function parseFormula(formula) {
  const counts = {};
  let i = 0;
  
  while (i < formula.length) {
    if (formula[i] === '(') {
      let depth = 1, j = i + 1;
      while (j < formula.length && depth > 0) {
        if (formula[j] === '(') depth++;
        else if (formula[j] === ')') depth--;
        j++;
      }
      const subgroup = parseFormula(formula.slice(i + 1, j - 1));
      let k = j;
      while (k < formula.length && /\d/.test(formula[k])) k++;
      const mult = k > j ? parseInt(formula.slice(j, k)) : 1;
      for (const [e, c] of Object.entries(subgroup)) counts[e] = (counts[e] || 0) + c * mult;
      i = k;
    } else if (/[A-Z]/.test(formula[i])) {
      let elem = formula[i++];
      if (i < formula.length && /[a-z]/.test(formula[i])) elem += formula[i++];
      let count = 0;
      while (i < formula.length && /\d/.test(formula[i])) count = count * 10 + parseInt(formula[i++]);
      counts[elem] = (counts[elem] || 0) + (count || 1);
    } else i++;
  }
  return counts;
}

function calculateMolarMass(formula) {
  const counts = parseFormula(formula);
  let total = 0, lines = [];
  for (const [elem, count] of Object.entries(counts).sort()) {
    if (!ATOMIC_MASSES[elem]) return null;
    const mass = ATOMIC_MASSES[elem] * count;
    total += mass;
    lines.push(`${elem}: ${count} x ${ATOMIC_MASSES[elem]} = ${mass.toFixed(3)} g/mol`);
  }
  return { total, lines, formula };
}

function generateResponse(msg) {
  const m = msg.toLowerCase();
  
  if (m.includes('molar mass') || m.includes('molecular weight')) {
    const match = msg.match(/([A-Z][a-z0-9()]+)/);
    if (match) {
      const r = calculateMolarMass(match[1]);
      if (r) return `**Molar Mass of ${r.formula}: ${r.total.toFixed(3)} g/mol**\n\n${r.lines.join('\n')}`;
    }
  }
  
  if (m.includes('sn1') || m.includes('sn2')) {
    return `**SN2:** One step, backside attack, 1°/2° only, inversion\n**SN1:** Two steps, carbocation, 3°/2°, racemic\n\nSN2 = no rearrangements, SN1 = can rearrange`;
  }
  
  if (m.includes('sodium') && m.includes('water')) {
    return `2Na + 2H₂O → 2NaOH + H₂ 💥\n\nSodium rips hydrogen from water, making H₂ gas + heat. Heat ignites H₂ = BOOM!`;
  }
  
  if (m.includes('gallium')) {
    return `Gallium melts at 29.76°C (body temperature)! Hold it → it liquefies. Used in blue LEDs (GaN).`;
  }
  
  if (m.includes('ph') && (m.includes('acid') || m.includes('hcl'))) {
    const c = msg.match(/(\d+\.?\d*)\s*M/);
    if (c) {
      const ph = -Math.log10(parseFloat(c[1]));
      return `Strong acid at ${c[1]}M:\n**pH = ${ph.toFixed(2)}**`;
    }
  }
  
  return `Ask me about:\n• Molar mass (e.g., "H2SO4")\n• SN1/SN2 reactions\n• Sodium + water\n• Gallium\n• pH calculations`;
}
