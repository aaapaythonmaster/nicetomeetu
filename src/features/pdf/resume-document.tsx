import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { join } from "node:path";

import type { ResumeEditorData } from "@/src/features/resume/queries";
import { SECTION_LABELS } from "@/src/features/resume/fixtures";

Font.register({ family: "Noto Sans SC", src: join(process.cwd(), "public/fonts/NotoSansCJKsc-Regular.otf") });

export interface ResumePdfViewModel {
  identity: ResumeEditorData["identity"];
  sections: ResumeEditorData["sections"];
}

export function buildResumePdfViewModel(data: ResumeEditorData): ResumePdfViewModel {
  const identity = data.phoneVisible ? data.identity : {
    name: data.identity.name, email: data.identity.email, school: data.identity.school, targetRole: data.identity.targetRole,
  };
  return {
    identity,
    sections: data.sections.filter((section) => section.visible).toSorted((a, b) => a.position - b.position).map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => entry.visible).toSorted((a, b) => a.position - b.position),
    })),
  };
}

const styles = StyleSheet.create({
  page: { fontFamily: "Noto Sans SC", padding: 36, color: "#17131c", fontSize: 9.5, lineHeight: 1.55 },
  header: { borderBottomWidth: 1, borderBottomColor: "#06b6d4", paddingBottom: 14, marginBottom: 18 },
  name: { fontSize: 24, lineHeight: 1.2 }, role: { fontSize: 11, color: "#087f91", marginTop: 5 },
  contact: { marginTop: 8, color: "#58515f", fontSize: 8.5 },
  section: { marginBottom: 16 }, sectionTitle: { fontSize: 13, color: "#087f91", marginBottom: 8 },
  entry: { marginBottom: 11 }, entryHead: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  entryTitle: { fontSize: 11 }, meta: { color: "#746d79", fontSize: 8 },
  bullet: { flexDirection: "row", marginTop: 4 }, mark: { width: 12, color: "#06b6d4" }, bulletText: { flex: 1 },
  metrics: { color: "#087f91", marginTop: 3 }, empty: { color: "#746d79" },
});

export function ResumeDocument({ data }: { data: ResumeEditorData }) {
  const model = buildResumePdfViewModel(data);
  const contact = [model.identity.school, model.identity.email, model.identity.phone].filter(Boolean).join("  ·  ");
  return <Document title={`${model.identity.name} - ${model.identity.targetRole}`} author={model.identity.name}>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}><Text style={styles.name}>{model.identity.name}</Text><Text style={styles.role}>{model.identity.targetRole}</Text><Text style={styles.contact}>{contact}</Text></View>
      {model.sections.map((section) => <View key={section.id} style={styles.section}>
        <Text style={styles.sectionTitle}>{SECTION_LABELS[section.kind as keyof typeof SECTION_LABELS] ?? section.kind}</Text>
        {section.entries.length ? section.entries.map((entry) => <View key={entry.id} style={styles.entry} wrap={false}>
          <View style={styles.entryHead}><Text style={styles.entryTitle}>{entry.title}</Text><Text style={styles.meta}>{[entry.organization, entry.role, entry.startDate && entry.endDate ? `${entry.startDate} — ${entry.endDate}` : entry.startDate ?? entry.endDate].filter(Boolean).join("  ·  ")}</Text></View>
          {entry.bullets.map((bullet, index) => <View key={`${index}-${bullet}`} style={styles.bullet}><Text style={styles.mark}>•</Text><Text style={styles.bulletText}>{bullet}</Text></View>)}
          {entry.metrics.length ? <Text style={styles.metrics}>{entry.metrics.join("  ·  ")}</Text> : null}
        </View>) : <Text style={styles.empty}>{section.summary}</Text>}
      </View>)}
    </Page>
  </Document>;
}
