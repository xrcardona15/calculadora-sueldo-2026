const ids = ['situation', 'children', 'payments', 'disability', 'mobility'];
const displayInput = document.getElementById('gross-salary-display');
const hiddenInput = document.getElementById('gross-salary');

displayInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    hiddenInput.value = value;
    e.target.value = value ? parseInt(value).toLocaleString('es-ES') : "";
    calculate();
});

ids.forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('change', calculate);
    el.addEventListener('input', calculate);
});

function calculate() {
    const grossAnual = parseFloat(hiddenInput.value) || 0;
    const numPayments = parseInt(document.getElementById('payments').value);
    const children = parseInt(document.getElementById('children').value) || 0;
    const situation = document.getElementById('situation').value;
    const disability = parseFloat(document.getElementById('disability').value);
    const mobility = document.getElementById('mobility').checked;

    if (grossAnual <= 14000) { 
        updateUI(grossAnual, 0, 0, numPayments);
        return;
    }

    // 1. Seguridad Social (Base de cotización topada a 63.000€ aprox en 2026)
    const ssTotal = Math.min(grossAnual, 63000) * 0.0647;

    // 2. Tramos IRPF
    const tramos = [
        { limit: 12450, rate: 0.19 }, { limit: 20200, rate: 0.24 },
        { limit: 35200, rate: 0.30 }, { limit: 60000, rate: 0.37 },
        { limit: 300000, rate: 0.45 }, { limit: Infinity, rate: 0.47 }
    ];

    function getCuota(base) {
        let cuota = 0, prev = 0;
        for (let t of tramos) {
            if (base > prev) {
                let chunk = Math.min(base, t.limit) - prev;
                cuota += chunk * t.rate;
                prev = t.limit;
            } else break;
        }
        return cuota;
    }

    // 3. IRPF (Cuota Íntegra - Cuota Mínimo)
    let baseLiquidable = Math.max(0, grossAnual - ssTotal - (2000 + (mobility ? 2000 : 0)));
    let cuota1 = getCuota(baseLiquidable);

    let minFam = 5550 + disability;
    if (situation === "2") minFam += 3400;
    if (situation === "1") minFam += 2150;
    
    const hDesc = [0, 2400, 2700, 4000, 4500];
    for(let i=1; i<=children; i++) minFam += hDesc[Math.min(i, 4)];

    let cuota2 = getCuota(minFam);
    let totalIrpf = Math.max(0, cuota1 - cuota2);

    updateUI(grossAnual, ssTotal, totalIrpf, numPayments);
}

function updateUI(gross, ss, irpf, pagas) {
    const netAnual = gross - ss - irpf;
    const fmt = (v) => v.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    let mensual, extra;
    if (pagas === 14) {
        mensual = (gross / 14) - (ss / 12) - (irpf / 14);
        extra = (gross / 14) - (irpf / 14);
        document.getElementById('extra-info').style.display = "block";
        document.getElementById('extra-info').innerText = `Paga Extra (x2): ${fmt(extra)} €`;
    } else {
        mensual = netAnual / 12;
        document.getElementById('extra-info').style.display = "none";
    }

    document.getElementById('net-monthly').innerText = `${fmt(mensual)} €`;
    document.getElementById('res-net-annual').innerText = `${fmt(netAnual)} €`;
    document.getElementById('res-ss').innerText = `-${fmt(ss)} €`;
    document.getElementById('res-irpf').innerText = `-${fmt(irpf)} €`;
    document.getElementById('retention-pct').innerText = ((irpf / gross) * 100).toFixed(2);
}

calculate();
