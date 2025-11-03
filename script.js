// ====== CONFIG - Replace these with the real values from the Postman doc ======
const API_BASE = "https://fedskillstest.coalitiontechnologies.workers.dev"; // <-- replace with Postman API base URL
const API_PATIENTS_ENDPOINT = "/patients";   // <-- replace if endpoint path differs
// Example header auth — replace according to the Postman doc (API key, Basic auth, etc.)
const REQUEST_HEADERS = {
  "Content-Type": "application/json",
  // "Authorization": "Basic ZmVkU2tpbGxzVGVzdDpwYXNzd29yZA==",
  // "x-api-key": "YOUR_API_KEY"
};
// =================================================================================

// Utility to fetch patient list
async function fetchPatients() {
  const url = API_BASE + API_PATIENTS_ENDPOINT;
  const resp = await fetch(API_BASE, { headers: REQUEST_HEADERS });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("API Error: " + resp.status + " - " + text);
  }
  return resp.json();
}

// Find Jessica Taylor in whatever response structure the API returns
function findJessica(data) {
  // Common response shapes:
  // - { patients: [...] }
  // - [...]
  const list = Array.isArray(data) ? data : (data.patients || data.data || []);
  const found = list.find(p => {
    const name = ((p.first_name || p.firstName || p.name || p.full_name) || "") + " " + ((p.last_name || p.lastName) || "");
    // check known alternative fields
    const full = (p.name || p.full_name || `${p.first_name||p.firstName||""} ${p.last_name||p.lastName||""}`).trim();
    return (full.toLowerCase().includes("jessica taylor") || (p.first_name && p.first_name.toLowerCase()==="jessica" && (p.last_name||"").toLowerCase()==="taylor"));
  });
  return found || null;
}

// Normalize blood pressure readings
// We expect some structure like: patient.vitals.bp = [{ year: 2017, systolic: 120, diastolic: 80 }, ...]
// We'll attempt to detect common shapes and fallback gracefully.
function normalizeBP(patient) {
  if (!patient) return [];
  const candidates = [];

  // commonly: patient.vitals or patient.bp or patient.observations
  const v = patient.vitals || patient.bp || patient.observations || patient.readings || {};
  // If it's an array of objects already:
  if (Array.isArray(v)) {
    return v
      .map(item => {
        // try different field names
        const year = item.year || item.date || item.recorded_at || item.timestamp;
        const systolic = item.systolic || item.sys || item.s;
        const diastolic = item.diastolic || item.dia || item.d;
        // convert date -> year if necessary
        let y = year;
        if (y && typeof y === "string" && /\d{4}-\d{2}-\d{2}/.test(y)) {
          y = new Date(y).getFullYear();
        }
        return (systolic && diastolic) ? { year: y || item.id || null, systolic: Number(systolic), diastolic: Number(diastolic) } : null;
      })
      .filter(Boolean);
  }

  // Try if patient has nested yearly object
  if (v.yearly && typeof v.yearly === "object") {
    return Object.entries(v.yearly).map(([year, vals]) => {
      return {
        year: Number(year),
        systolic: Number(vals.systolic || vals.sys || vals[0] || 0),
        diastolic: Number(vals.diastolic || vals.dia || vals[1] || 0)
      };
    });
  }

  return [];
}

// Render patient details in the right panel
function renderDetails(patient) {
  if (!patient) {
    document.getElementById("patient-name").textContent = "Patient not found";
    return;
  }
  // header meta
  const fullName = patient.name || patient.full_name || `${patient.first_name || patient.firstName || ""} ${patient.last_name || patient.lastName || ""}`.trim();
  document.getElementById("patient-name").textContent = fullName;
  document.getElementById("patient-meta").textContent = `${patient.age || patient.yob || ""} • ${patient.gender || ""} • ${patient.id || patient.patient_id || patient.externalId || ""}`;

  // avatar if available
  const avatar = patient.avatar || patient.photo || patient.profile_picture || null;
  const img = document.getElementById("patient-avatar");
  if (avatar) {
    img.src = avatar;
  } else {
    img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><rect width='100%' height='100%' fill='%23e6eefb'/><text x='50%' y='50%' font-size='14' fill='%23344' text-anchor='middle' alignment-baseline='central'>JT</text></svg>";
  }

  // details list
  const details = [
    ["Email", patient.email || patient.contact || "-"],
    ["Phone", patient.phone || patient.mobile || "-"],
    ["Address", (patient.address && (patient.address.street || patient.address.city)) || patient.location || "-"],
    ["Primary Care", patient.primary_care || patient.clinic || "-"]
  ];
  const ul = document.getElementById("patient-details");
  ul.innerHTML = "";
  for (const [k, v] of details) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${k}:</strong> <span>${v}</span>`;
    ul.appendChild(li);
  }
}

// Create Chart.js chart
let bpChart = null;
function drawBPChart(bpData) {
  const ctx = document.getElementById("bpChart").getContext("2d");
  // sort by year
  bpData.sort((a,b)=> (a.year||0) - (b.year||0));
  const labels = bpData.map(x => x.year || "");
  const systolic = bpData.map(x => x.systolic || 0);
  const diastolic = bpData.map(x => x.diastolic || 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Systolic",
        data: systolic,
        fill: false,
        tension: 0.25,
        borderWidth: 2,
      },
      {
        label: "Diastolic",
        data: diastolic,
        fill: false,
        tension: 0.25,
        borderWidth: 2,
      }
    ]
  };

  const config = {
    type: 'line',
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        y: { beginAtZero: false, suggestedMin: 40, suggestedMax: 160 }
      }
    }
  };

  if (bpChart) bpChart.destroy();
  bpChart = new Chart(ctx, config);
}

// Main driver
async function init() {
  try {
    const raw = await fetchPatients();
    const patient = findJessica(raw);
    if (!patient) {
      renderDetails(null);
      alert("Jessica Taylor not found in API response. Make sure the API returns the patient list and that authentication is correct.");
      return;
    }
    renderDetails(patient);

    const bp = normalizeBP(patient);
    if (bp.length === 0) {
      // If no structured BP, try to extract from any 'measurements' field heuristically
      console.warn("No structured BP found. Trying fallbacks.");
      // fallback: if patient has 'measurements' array
      const fallback = (patient.measurements || []).filter(m => m.type && m.type.toLowerCase().includes("bp"));
      const fallbackData = fallback.map(m => ({ year: (m.year||new Date(m.date||m.timestamp||Date.now()).getFullYear()), systolic: m.systolic||m.sys, diastolic: m.diastolic||m.dia })).filter(Boolean);
      drawBPChart(fallbackData);
    } else {
      drawBPChart(bp);
    }
  } catch (err) {
    console.error(err);
    alert("Error fetching patient data: " + err.message);
  }
}

// wire up buttons
document.getElementById("refresh-btn").addEventListener("click", init);

// initial load
init();
