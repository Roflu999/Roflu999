const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Atomic masses
const ATOMIC_MASSES = {
    'H': 1.008, 'He': 4.003, 'Li': 6.94, 'Be': 9.012, 'B': 10.81,
    'C': 12.01, 'N': 14.01, 'O': 16.00, 'F': 19.00, 'Ne': 20.18,
    'Na': 22.99, 'Mg': 24.31, 'Al': 26.98, 'Si': 28.09, 'P': 30.97,
    'S': 32.07, 'Cl': 35.45, 'K': 39.10, 'Ar': 39.95, 'Ca': 40.08,
    'Fe': 55.85, 'Cu': 63.55, 'Zn': 65.39, 'Br': 79.90, 'Ag': 107.9,
    'I': 126.9, 'Au': 197.0, 'Hg': 200.6, 'Pb': 207.2
};

function parseFormula(formula) {
    const counts = {};
    let i = 0;
    
    while (i < formula.length) {
        if (formula[i] === '(') {
            let depth = 1;
            let j = i + 1;
            while (j < formula.length && depth > 0) {
                if (formula[j] === '(') depth++;
                else if (formula[j] === ')') depth--;
                j++;
            }
            
            const subgroup = parseFormula(formula.slice(i + 1, j - 1));
            
            let k = j;
            while (k < formula.length && /\d/.test(formula[k])) k++;
            const multiplier = k > j ? parseInt(formula.slice(j, k)) : 1;
            
            for (const [elem, count] of Object.entries(subgroup)) {
                counts[elem] = (counts[elem] || 0) + count * multiplier;
            }
            i = k;
        } else if (/[A-Z]/.test(formula[i])) {
            let elem = formula[i];
            i++;
            if (i < formula.length && /[a-z]/.test(formula[i])) {
                elem += formula[i];
                i++;
            }
            
            let count = 0;
            while (i < formula.length && /\d/.test(formula[i])) {
                count = count * 10 + parseInt(formula[i]);
                i++;
            }
            if (count === 0) count = 1;
            
            counts[elem] = (counts[elem] || 0) + count;
        } else {
            i++;
        }
    }
    
    return counts;
}

function calculateMolarMass(formula) {
    try {
        const counts = parseFormula(formula);
        let total = 0;
        const breakdown = [];
        
        for (const [elem, count] of Object.entries(counts).sort()) {
            if (!ATOMIC_MASSES[elem]) return { error: `Unknown element: ${elem}` };
            const mass = ATOMIC_MASSES[elem] * count;
            total += mass;
            breakdown.push(`  ${elem}: ${count} x ${ATOMIC_MASSES[elem]} = ${mass.toFixed(3)} g/mol`);
        }
        
        return { total, breakdown, formula };
    } catch (e) {
        return { error: e.message };
    }
}

function generateResponse(message) {
    const msg = message.toLowerCase();
    
    // Molar mass
    if (msg.includes('molar mass') || msg.includes('molecular weight') || msg.includes('formula mass')) {
        const match = message.match(/([A-Z][a-z0-9()]+)/);
        if (match) {
            const formula = match[1];
            const result = calculateMolarMass(formula);
            if (!result.error) {
                return `Let me calculate the molar mass of **${result.formula}**!

Element breakdown:
${result.breakdown.join('\n')}

**Molar Mass = ${result.total.toFixed(3)} g/mol**

This means one mole of ${result.formula} weighs ${result.total.toFixed(2)} grams. Perfect for stoichiometry calculations!`;
            }
        }
    }
    
    // pH calculation for strong acid
    if (msg.includes('strong acid') || msg.includes('hcl') || msg.includes('hno3')) {
        const concMatch = message.match(/(\d+\.?\d*)\s*M/);
        if (concMatch) {
            const conc = parseFloat(concMatch[1]);
            const ph = -Math.log10(conc);
            return `For a strong acid at ${conc} M concentration:

**pH = ${ph.toFixed(2)}**

Since it's a strong acid, it dissociates completely:
[H+] = ${conc} M

pH = -log(${conc}) = ${ph.toFixed(2)}
pOH = 14 - ${ph.toFixed(2)} = ${(14-ph).toFixed(2)}

This is a strongly acidic solution!`;
        }
    }
    
    // SN1 vs SN2
    if (msg.includes('sn1') || msg.includes('sn2') || msg.includes('nucleophilic substitution')) {
        return `Great question! SN1 and SN2 are two different mechanisms for nucleophilic substitution:

## SN2 (Bimolecular)
- **One step** — backside attack as leaving group leaves
- **Substrate:** Methyl > 1° > 2° (3° doesn't react!)
- **Rate:** Rate = k[substrate][nucleophile]
- **Stereochemistry:** Inversion (Walden inversion)
- **Solvent:** Polar aprotic

## SN1 (Unimolecular)  
- **Two steps** — carbocation intermediate forms first
- **Substrate:** 3° > 2° (methyl essentially never!)
- **Rate:** Rate = k[substrate] only
- **Stereochemistry:** Racemic mixture
- **Solvent:** Polar protic

**Key difference:** SN2 = backside attack, no rearrangements; SN1 = carbocation, can rearrange!

Want me to draw the mechanisms or explain when each occurs?`;
    }
    
    // Diels-Alder
    if (msg.includes('diels-alder') || msg.includes('diels alder') || msg.includes('cycloaddition')) {
        return `The **Diels-Alder reaction** is a powerful [4+2] cycloaddition!

**Components:**
- **Diene** (4 π electrons) — must be s-cis
- **Dienophile** (2 π electrons) — usually has electron-withdrawing groups

**The Magic:**
Forms a six-membered ring in ONE step with excellent control over stereochemistry!

**Key Rules:**
1. **Endo rule:** EWGs prefer to be under the bridge (kinetic product)
2. **Suprafacial:** cis groups stay cis in product
3. **Regioselectivity:** "Ortho" product favored with substituents

**Real use:** Making complex rings in natural product synthesis. It's nicknamed "click chemistry" because it just works!

Want to see a specific example?`;
    }
    
    // Sodium and water
    if (msg.includes('sodium') && msg.includes('water')) {
        return `Sodium + water = explosive chemistry!

**Reaction:** 2Na + 2H2O → 2NaOH + H2

**What happens:**
1. Na strips H from H2O
2. Produces H2 gas + lots of heat
3. Heat ignites the hydrogen
4. **BOOM!**

**Why?** Sodium (Group 1) has super low ionization energy — it really wants to lose that valence electron!

**Result:** Basic solution (pH ~14) + explosion

⚠️ **Don't try this at home!**

Want to know why potassium is even crazier?`;
    }
    
    // Gallium
    if (msg.includes('gallium')) {
        return `Gallium is amazing!

**Melts at 29.76°C** — below body temperature!

Hold it in your hand and it liquefies. The gallium spoon trick is classic — stir hot tea and the spoon disappears! (Don't drink it though)

**Uses:**
- **GaN** (gallium nitride) — blue LEDs, high-speed electronics, satellite solar panels
- Safer alternative to mercury in thermometers
- Gallium scans for medical imaging

**Fun fact:** It doesn't exist free in nature — extracted as byproduct of aluminum/zinc production!

Want more weird melting points?`;
    }
    
    // Default response
    return `I'd love to help with your chemistry question!

I can assist with:

**Calculations:** Molar mass, pH, stoichiometry
**Reactions:** SN1/SN2, E1/E2, Diels-Alder, mechanisms
**Concepts:** Periodic trends, bonding, thermodynamics
**Compounds:** Properties, structures, reactions

Try asking something specific like:
- "Calculate molar mass of H2SO4"
- "Explain SN1 vs SN2"
- "What is the pH of 0.1M HCl?"
- "Why does sodium explode in water?"

What would you like to explore?`;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    if (!message || !message.trim()) {
        return res.json({ response: 'Please ask a chemistry question!' });
    }
    
    const response = generateResponse(message);
    res.json({ response });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('ChemTutor Web Server');
    console.log('='.repeat(60));
    console.log(`Local:   http://localhost:${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT}`);
    console.log('='.repeat(60));
    console.log('Press Ctrl+C to stop');
});
