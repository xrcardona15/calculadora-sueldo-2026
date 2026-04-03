const ids = ['category', 'situation', 'children', 'payments', 'disability', 'mobility'];
const displayInput = document.getElementById('gross-salary-display');
const hiddenInput = document.getElementById('gross-salary');

displayInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, "");
    hiddenInput.value = value;
    e.target.value = value ? parseInt(value).toLocaleString('es-ES') : "";
    calculate();
});

ids.forEach(id => document.getElementById(id).addEventListener('input', calculate));

function calculate() {
    const grossAnual = parseFloat(hiddenInput.value) || 0;
    const baseExtraPercent = parseFloat(document.getElementById('category').value);
    const numPayments = parseInt(document.getElementById('payments').value);
    const children = parseInt(document.getElementById('children').value) || 0;
    const situation = document.getElementById('situation').value;
    const disability = parseFloat(document.getElementById('disability').value);
    const mobility = document.getElementById('mobility').checked;

    if (grossAnual <= 0) {
        document.getElementById('net-monthly').innerText = "0,00 €";
        document.getElementById('res-net-annual').innerText = "0,00 €";
        return;
    }

    const ssDeduction = Math.min(grossAnual, 61214.40) * 0.0647;
    let extraDed = 2000 + (mobility ? 2000 : 0);
    let taxableBase = Math.max(0, grossAnual - ssDeduction - extraDed);
    
    const tramos = [
        { limit: 12450, rate: 0.19 }, { limit: 20200, rate: 0.24 },
        { limit: 35200, rate: 0.30 }, { limit: 60000, rate: 0.37 },
        { limit: 300000, rate: 0.45 }, { limit: Infinity, rate: 0.47 }
    ];

    let totalIrpf = 0;
    let rem = taxableBase;
    let prev = 0;
    tramos.forEach(t => {
        if (rem > 0) {
            let chunk = Math.min(rem, t.limit - prev);
            totalIrpf += chunk * t.rate;
            rem -= chunk;
            prev = t.limit;
        }
    });

    let minFam = 5550 + (situation === "2" ? 3400 : (situation === "1" ? 2150 : 0)) + disability;
    const h = [0, 2400, 2700, 4000, 4500];
    for(let i=1; i<=children; i++) minFam += h[Math.min(i, 4)];

    totalIrpf = Math.max(0, totalIrpf - (minFam * 0.19));

    const netAnual = grossAnual - ssDeduction - totalIrpf;
    const taxRateTotal = totalIrpf / grossAnual;
    const ssRateTotal = ssDeduction / grossAnual;

    let mensual, extra;
    const fmt = (v) => v.toLocaleString('es-ES', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    if (numPayments === 14) {
        const brutoExtra = (grossAnual * baseExtraPercent) / 12;
        extra = brutoExtra * (1 - taxRateTotal - ssRateTotal);
        mensual = (netAnual - (extra * 2)) / 12;
        
        document.getElementById('extra-info').style.display = "inline-block";
        document.getElementById('extra-info').innerText = `Paga Extra (x2): ${fmt(extra)} €`;
        document.getElementById('text-monthly-label').innerText = "Mensualidad Ordinaria (Neto)";
    } else {
        mensual = netAnual / 12;
        document.getElementById('extra-info').style.display = "none";
        document.getElementById('text-monthly-label').innerText = "Sueldo Neto Mensual";
    }

    document.getElementById('net-monthly').innerText = `${fmt(mensual)} €`;
    document.getElementById('res-net-annual').innerText = `${fmt(netAnual)} €`;
    document.getElementById('res-ss').innerText = `-${fmt(ssDeduction)} €`;
    document.getElementById('res-irpf').innerText = `-${fmt(totalIrpf)} €`;
    document.getElementById('retention-pct').innerText = ((totalIrpf / grossAnual) * 100).toFixed(2);
}

calculate();