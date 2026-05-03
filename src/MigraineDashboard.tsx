import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import type { MigraineRow } from "./types";

const COLORS = {
  migr: "#e05c5c",
  os: "#e09a3a",
  duree: "#5c9fe0",
  bg: "#0f1117",
  card: "#181c25",
  cardBorder: "#252b38",
  text: "#e8eaf0",
  muted: "#7a8099",
  accent: "#5c9fe0",
};

const triggerKeys = [
  "lumiere",
  "son",
  "pression",
  "temperature",
  "odeur",
  "stress",
  "alcool",
  "saitPas",
] as const;

const triggerLabels: Record<(typeof triggerKeys)[number], string> = {
  lumiere: "Lumière",
  son: "Son",
  pression: "Pression",
  temperature: "Température",
  odeur: "Odeur",
  stress: "Stress",
  alcool: "Alcool",
  saitPas: "Ne sait pas",
};

const symptomKeys = [
  "vision",
  "odorat",
  "nausee",
  "vomissements",
  "douleurOs",
  "ouie",
  "faiblesseMusc",
  "brainFog",
] as const;

const symptomLabels: Record<(typeof symptomKeys)[number], string> = {
  vision: "Vision",
  odorat: "Odorat",
  nausee: "Nausées",
  vomissements: "Vomissements",
  douleurOs: "Douleur osseuse",
  ouie: "Ouïe",
  faiblesseMusc: "Faiblesse musc.",
  brainFog: "Brain Fog",
};

function splitMedicaments(s: string): string[] {
  return s
    .split(/\s*\+\s*|,|(?:\s+et\s+)/i)
    .map((m) => m.trim().replace(/\?/g, ""))
    .filter(Boolean);
}

function minutesToHours(m: number | null): number | null {
  if (m == null || !Number.isFinite(m)) return null;
  return +(m / 60).toFixed(1);
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.cardBorder}`,
        borderRadius: 16,
        padding: "18px 22px",
        minWidth: 140,
        flex: 1,
      }}
    >
      <div
        style={{
          color: COLORS.muted,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: color || COLORS.text,
          fontSize: 32,
          fontWeight: 800,
          fontFamily: "'Georgia', serif",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#1e2330",
          border: `1px solid ${COLORS.cardBorder}`,
          borderRadius: 10,
          padding: "10px 16px",
          fontSize: 13,
        }}
      >
        <div
          style={{
            color: COLORS.muted,
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: <b>{p.value}</b>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export type MigraineDashboardProps = {
  rawData: MigraineRow[];
  subtitle?: string;
};

export default function MigraineDashboard({
  rawData,
  subtitle,
}: MigraineDashboardProps) {
  const [tab, setTab] = useState("overview");

  const {
    totalCrises,
    avgIntensity,
    avgDureeHours,
    maxDureeHours,
    crisesAvecOs,
    triggerFreq,
    symptomFreq,
    timeline,
    medData,
    radarData,
    rangeLabel,
  } = useMemo(() => {
    const total = rawData.length;
    const avgIntensityVal =
      total > 0
        ? (
            rawData.reduce((s, d) => s + d.intensiteMigr, 0) / total
          ).toFixed(1)
        : "0";
    const withDur = rawData.filter((d) => d.dureeMinutes != null);
    const hoursList = withDur
      .map((d) => minutesToHours(d.dureeMinutes))
      .filter((h): h is number => h != null);
    const avgDureeHoursVal =
      hoursList.length > 0
        ? (
            hoursList.reduce((a, b) => a + b, 0) / hoursList.length
          ).toFixed(1)
        : "—";
    const maxDureeHoursVal =
      hoursList.length > 0 ? Math.max(...hoursList).toFixed(1) : "—";
    const crisesOs = rawData.filter((d) => d.intensiteOs > 0).length;

    const tFreq = [...triggerKeys]
      .map((k) => ({
        name: triggerLabels[k],
        count: rawData.filter((d) => d[k]).length,
        pct:
          total > 0
            ? Math.round((rawData.filter((d) => d[k]).length / total) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const sFreq = [...symptomKeys]
      .map((k) => ({
        name: symptomLabels[k],
        count: rawData.filter((d) => d[k]).length,
        pct:
          total > 0
            ? Math.round((rawData.filter((d) => d[k]).length / total) * 100)
            : 0,
        fullMark: total,
      }))
      .sort((a, b) => b.count - a.count);

    const tl = rawData.map((d) => ({
      date: d.date,
      "Intensité migraine": d.intensiteMigr,
      "Intensité osseuse": d.intensiteOs,
      "Durée (h)": minutesToHours(d.dureeMinutes),
      "Nb déclencheurs": triggerKeys.filter((k) => d[k]).length,
      "Nb symptômes": symptomKeys.filter((k) => d[k]).length,
    }));

    const medCount: Record<string, number> = {};
    rawData.forEach((d) => {
      splitMedicaments(d.medicaments).forEach((m) => {
        const key = m.split(" ")[0] || m;
        medCount[key] = (medCount[key] || 0) + 1;
      });
    });
    const mData = Object.entries(medCount).map(([name, value]) => ({
      name,
      value,
    }));

    const rData = sFreq.map((s) => ({
      subject: s.name,
      A: s.count,
      fullMark: total,
    }));

    const first = rawData[0]?.date;
    const last = rawData[rawData.length - 1]?.date;
    const rLabel =
      first && last && first !== last ? `${first} – ${last}` : first || "";

    return {
      totalCrises: total,
      avgIntensity: avgIntensityVal,
      avgDureeHours: avgDureeHoursVal,
      maxDureeHours: maxDureeHoursVal,
      crisesAvecOs: crisesOs,
      triggerFreq: tFreq,
      symptomFreq: sFreq,
      timeline: tl,
      medData: mData,
      radarData: rData,
      rangeLabel: rLabel,
    };
  }, [rawData]);

  const tabs = [
    { id: "overview", label: "Vue d'ensemble" },
    { id: "timeline", label: "Chronologie" },
    { id: "triggers", label: "Déclencheurs" },
    { id: "symptoms", label: "Symptômes" },
    { id: "meds", label: "Médicaments" },
  ];

  const sectionTitle = (t: string) => (
    <div
      style={{
        color: COLORS.muted,
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        marginBottom: 16,
        fontWeight: 600,
      }}
    >
      {t}
    </div>
  );

  const pctOs =
    totalCrises > 0 ? Math.round((crisesAvecOs / totalCrises) * 100) : 0;

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        color: COLORS.text,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        padding: "clamp(24px, 3vw, 40px) clamp(18px, 4vw, 48px)",
        width: "100%",
        maxWidth: 1600,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 900,
              fontFamily: "'Georgia', serif",
              letterSpacing: -0.5,
            }}
          >
            Suivi Migraines
          </h1>
          {(subtitle || rangeLabel) && (
            <span style={{ color: COLORS.muted, fontSize: 13 }}>
              {subtitle || rangeLabel}
            </span>
          )}
        </div>
        <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
          Journal clinique · {totalCrises} épisodes enregistrés
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 28,
          flexWrap: "wrap",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? "#5c9fe0" : COLORS.card,
              color: tab === t.id ? "#fff" : COLORS.muted,
              border: `1px solid ${tab === t.id ? "#5c9fe0" : COLORS.cardBorder}`,
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 13,
              cursor: "pointer",
              fontWeight: tab === t.id ? 700 : 400,
              transition: "all .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <StatCard
              label="Crises totales"
              value={String(totalCrises)}
              color={COLORS.migr}
            />
            <StatCard
              label="Intensité moy."
              value={`${avgIntensity}/10`}
              sub="migraine"
              color="#e05c5c"
            />
            <StatCard
              label="Durée moyenne"
              value={avgDureeHours === "—" ? "—" : `${avgDureeHours} h`}
              sub={
                maxDureeHours === "—"
                  ? undefined
                  : `max : ${maxDureeHours} h (depuis durée saisie en min)`
              }
              color={COLORS.duree}
            />
            <StatCard
              label="Avec douleur Os"
              value={String(crisesAvecOs)}
              sub={`${pctOs}% des crises`}
              color={COLORS.os}
            />
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px 20px 10px",
              marginBottom: 16,
            }}
          >
            {sectionTitle("Intensité des crises dans le temps")}
            <div className="migraine-chart-slot migraine-chart-slot--180">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeline}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#252b38" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Intensité migraine"
                  stroke={COLORS.migr}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.migr, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Intensité osseuse"
                  stroke={COLORS.os}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: COLORS.os, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: "20px 20px 10px",
                flex: 2,
                minWidth: 260,
              }}
            >
              {sectionTitle("Durée des crises (heures)")}
              <div className="migraine-chart-slot migraine-chart-slot--150">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={timeline}
                  margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b38" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: COLORS.muted, fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Durée (h)" radius={[4, 4, 0, 0]}>
                    {timeline.map((entry, i) => {
                      const h = entry["Durée (h)"];
                      const fill =
                        h != null && h > 24
                          ? COLORS.migr
                          : h != null && h > 10
                            ? "#c0844a"
                            : COLORS.duree;
                      return <Cell key={i} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: "20px",
                flex: 1,
                minWidth: 220,
              }}
            >
              {sectionTitle("Top symptômes")}
              {symptomFreq.slice(0, 5).map((s, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 3,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: COLORS.text }}>{s.name}</span>
                    <span style={{ color: COLORS.muted }}>{s.pct}%</span>
                  </div>
                  <div
                    style={{
                      background: "#252b38",
                      borderRadius: 4,
                      height: 6,
                    }}
                  >
                    <div
                      style={{
                        background: COLORS.accent,
                        width: `${s.pct}%`,
                        height: 6,
                        borderRadius: 4,
                        transition: "width .4s",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px 20px 10px",
            }}
          >
            {sectionTitle("Intensité migraine & douleur osseuse")}
            <div className="migraine-chart-slot migraine-chart-slot--220">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeline}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#252b38" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: COLORS.muted, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="Intensité migraine"
                  stroke={COLORS.migr}
                  strokeWidth={2.5}
                  dot={{ fill: COLORS.migr, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Intensité osseuse"
                  stroke={COLORS.os}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: COLORS.os, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px 20px 10px",
            }}
          >
            {sectionTitle("Durée des crises (heures)")}
            <div className="migraine-chart-slot migraine-chart-slot--200">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeline}
                margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#252b38" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Durée (h)" radius={[5, 5, 0, 0]}>
                  {timeline.map((entry, i) => {
                    const h = entry["Durée (h)"];
                    const fill =
                      h != null && h > 24
                        ? COLORS.migr
                        : h != null && h > 10
                          ? "#c0844a"
                          : COLORS.duree;
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                marginTop: 8,
                fontSize: 11,
                color: COLORS.muted,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <span>&lt; 10 h</span>
              <span>10–24 h</span>
              <span>&gt; 24 h</span>
            </div>
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px 20px 10px",
            }}
          >
            {sectionTitle("Nombre de déclencheurs & symptômes par crise")}
            <div className="migraine-chart-slot migraine-chart-slot--180">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={timeline}
                margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#252b38" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: COLORS.muted, fontSize: 12 }}
                />
                <Bar
                  dataKey="Nb déclencheurs"
                  fill="#7a5ce0"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Nb symptômes"
                  fill="#5c9fe0"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "triggers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px",
            }}
          >
            {sectionTitle("Fréquence des déclencheurs identifiés")}
            <div className="migraine-chart-slot migraine-chart-slot--220">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={triggerFreq}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#252b38"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, totalCrises]}
                  tick={{ fill: COLORS.muted, fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: COLORS.text, fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Occurrences" radius={[0, 5, 5, 0]}>
                  {triggerFreq.map((entry, i) => {
                    const fill =
                      entry.count > 5
                        ? COLORS.migr
                        : entry.count > 2
                          ? "#c0844a"
                          : COLORS.duree;
                    return <Cell key={i} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px",
            }}
          >
            {sectionTitle("Déclencheurs actifs par crise")}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 12,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: "left",
                        color: COLORS.muted,
                        padding: "6px 8px",
                        borderBottom: `1px solid ${COLORS.cardBorder}`,
                      }}
                    >
                      Date
                    </th>
                    {triggerKeys.map((k) => (
                      <th
                        key={k}
                        style={{
                          color: COLORS.muted,
                          padding: "6px 4px",
                          borderBottom: `1px solid ${COLORS.cardBorder}`,
                          fontSize: 10,
                          textAlign: "center",
                        }}
                      >
                        {triggerLabels[k].slice(0, 6)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawData.map((d, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${COLORS.cardBorder}`,
                      }}
                    >
                      <td
                        style={{
                          padding: "5px 8px",
                          color: COLORS.accent,
                          fontWeight: 600,
                        }}
                      >
                        {d.date}
                      </td>
                      {triggerKeys.map((k) => (
                        <td
                          key={k}
                          style={{
                            textAlign: "center",
                            padding: "5px 4px",
                          }}
                        >
                          {d[k] ? (
                            <span style={{ color: COLORS.migr, fontWeight: 700 }}>
                              ●
                            </span>
                          ) : (
                            <span style={{ color: "#2a3040" }}>○</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "symptoms" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: "20px",
                flex: 1,
                minWidth: 280,
              }}
            >
              {sectionTitle("Profil de symptômes (radar)")}
              <div className="migraine-chart-slot migraine-chart-slot--260">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="90%">
                  <PolarGrid stroke="#252b38" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: COLORS.muted, fontSize: 10 }}
                  />
                  <Radar
                    name="Occurrences"
                    dataKey="A"
                    stroke={COLORS.accent}
                    fill={COLORS.accent}
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: "20px",
                flex: 1,
                minWidth: 240,
              }}
            >
              {sectionTitle("Fréquence des symptômes")}
              {symptomFreq.map((s, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: COLORS.text }}>{s.name}</span>
                    <span style={{ color: COLORS.muted, fontSize: 12 }}>
                      {s.count}/{totalCrises}{" "}
                      <b style={{ color: COLORS.text }}>({s.pct}%)</b>
                    </span>
                  </div>
                  <div
                    style={{
                      background: "#252b38",
                      borderRadius: 6,
                      height: 7,
                    }}
                  >
                    <div
                      style={{
                        background:
                          s.pct > 80
                            ? COLORS.migr
                            : s.pct > 50
                              ? COLORS.os
                              : COLORS.accent,
                        width: `${s.pct}%`,
                        height: 7,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px 20px 10px",
            }}
          >
            {sectionTitle("Présence de nausées & vomissements par crise")}
            <div className="migraine-chart-slot migraine-chart-slot--140">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rawData.map((d) => ({
                  date: d.date,
                  Nausées: d.nausee ? 1 : 0,
                  Vomissements: d.vomissements ? 1 : 0,
                  "Brain Fog": d.brainFog ? 1 : 0,
                }))}
                margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#252b38" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: COLORS.muted, fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: COLORS.muted, fontSize: 12 }}
                />
                <Bar dataKey="Nausées" stackId="a" fill="#e05c9a" />
                <Bar dataKey="Vomissements" stackId="b" fill={COLORS.migr} />
                <Bar dataKey="Brain Fog" stackId="c" fill="#7a5ce0" />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === "meds" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: "20px",
                flex: 1,
                minWidth: 260,
              }}
            >
              {sectionTitle("Médicaments utilisés")}
              <div className="migraine-chart-slot migraine-chart-slot--220">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={medData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {medData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            "#5c9fe0",
                            "#e05c5c",
                            "#e09a3a",
                            "#7a5ce0",
                            "#5ce0b0",
                            "#e05c9a",
                          ][i % 6]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>

            <div
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 16,
                padding: "20px",
                flex: 1,
                minWidth: 260,
              }}
            >
              {sectionTitle("Intensité selon le traitement")}
              {rawData.map((d, i) => {
                const complexity = splitMedicaments(d.medicaments).length;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 7,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: COLORS.accent, minWidth: 50 }}>
                      {d.date}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        background: "#252b38",
                        borderRadius: 4,
                        height: 14,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          width: `${d.intensiteMigr * 10}%`,
                          background:
                            d.intensiteMigr > 8
                              ? COLORS.migr
                              : d.intensiteMigr > 6
                                ? COLORS.os
                                : COLORS.duree,
                          height: 14,
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        color: COLORS.text,
                        minWidth: 18,
                        textAlign: "right",
                        fontWeight: 700,
                      }}
                    >
                      {d.intensiteMigr}
                    </span>
                    <span
                      style={{
                        color: COLORS.muted,
                        minWidth: 60,
                        fontSize: 10,
                      }}
                    >
                      {complexity} méd.
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 16,
              padding: "20px",
            }}
          >
            {sectionTitle("Détail médicaments par crise")}
            {rawData.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: `1px solid ${COLORS.cardBorder}`,
                  fontSize: 13,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: COLORS.accent,
                    minWidth: 55,
                    fontWeight: 600,
                  }}
                >
                  {d.date}
                </span>
                <span style={{ color: COLORS.muted, flex: 1, minWidth: 120 }}>
                  {d.medicaments}
                </span>
                <span
                  style={{
                    background:
                      d.intensiteMigr > 8
                        ? "#3d1a1a"
                        : d.intensiteMigr > 6
                          ? "#3d2a1a"
                          : "#1a2535",
                    color:
                      d.intensiteMigr > 8
                        ? COLORS.migr
                        : d.intensiteMigr > 6
                          ? COLORS.os
                          : COLORS.duree,
                    borderRadius: 6,
                    padding: "2px 8px",
                    fontSize: 12,
                    fontWeight: 700,
                    minWidth: 48,
                    textAlign: "center",
                  }}
                >
                  {d.intensiteMigr}/10
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          color: COLORS.muted,
          fontSize: 11,
          textAlign: "center",
          letterSpacing: 0.5,
        }}
      >
        Journal généré pour suivi personnel · {totalCrises} crises
        {rangeLabel ? ` · ${rangeLabel}` : ""}
      </div>
    </div>
  );
}
