import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Tab = "Home" | "Design" | "Budget" | "Build" | "More";
type Property = {
  id: string;
  name: string;
  city?: string | null;
  targetBudgetMinor?: number | null;
};
type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};
type Session = {
  user?: { id?: string; name?: string | null; email?: string | null } | null;
};
type QueueItem = {
  id: string;
  method: string;
  path: string;
  createdAt: string;
};

const tabs: Tab[] = ["Home", "Design", "Budget", "Build", "More"];
const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
const QUEUE_KEY = "@niwasthan/offline-actions";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`API_${response.status}`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
async function readQueue(): Promise<QueueItem[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
}
async function enqueue(item: Omit<QueueItem, "id" | "createdAt">) {
  const queue = await readQueue();
  queue.push({
    ...item,
    id: `${Date.now()}-${queue.length}`,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [session, setSession] = useState<Session | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [status, setStatus] = useState<
    "loading" | "synced" | "unknown" | "error"
  >("loading");
  const [queueSize, setQueueSize] = useState(0);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    null,
  );
  const selectedProperty = useMemo(
    () =>
      properties.find((property) => property.id === selectedPropertyId) ??
      properties[0],
    [properties, selectedPropertyId],
  );
  const unread = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const sync = useCallback(async () => {
    setStatus("loading");
    try {
      const [authResult, propertyResult, notificationResult] =
        await Promise.all([
          api<Session>("/api/auth/session"),
          api<{ properties: Property[] }>("/api/properties"),
          api<{ notifications: Notification[] }>("/api/notifications"),
        ]);
      setSession(authResult);
      setProperties(propertyResult.properties ?? []);
      setNotifications(notificationResult.notifications ?? []);
      setSelectedPropertyId(
        (current) => current ?? propertyResult.properties?.[0]?.id ?? null,
      );
      setStatus(authResult.user?.id ? "synced" : "unknown");
    } catch {
      setStatus("error");
    }
    setQueueSize((await readQueue()).length);
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      void sync();
    }, 0);
    return () => clearTimeout(timer);
  }, [sync]);

  async function markRead(notificationId: string) {
    setNotifications((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    );
    try {
      await api(`/api/notifications/${notificationId}/read`, {
        method: "POST",
      });
    } catch {
      await enqueue({
        method: "POST",
        path: `/api/notifications/${notificationId}/read`,
      });
      setQueueSize((await readQueue()).length);
    }
  }
  function open(path: string) {
    void Linking.openURL(`${API_BASE}${path}`);
  }
  function showCapture() {
    Alert.alert(
      "Evidence capture",
      "Use the shared media flow to upload a plan or evidence. Native camera permissions are intentionally not claimed by this build until the camera module is installed.",
      [
        { text: "Open workspace", onPress: () => open("/properties") },
        { text: "Later", style: "cancel" },
      ],
    );
  }
  const budget =
    selectedProperty?.targetBudgetMinor == null
      ? null
      : Math.round(selectedProperty.targetBudgetMinor / 100);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topline}>
          <Text style={styles.brand}>niwasthan</Text>
          <Text style={styles.sync}>
            {status === "synced"
              ? "SYNCED"
              : status === "loading"
                ? "SYNCING"
                : status === "unknown"
                  ? "SIGN IN NEEDED"
                  : "OFFLINE / UNKNOWN"}
          </Text>
        </View>
        {!session?.user?.id ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Your home data is private</Text>
            <Text style={styles.copy}>
              Sign in to load confirmed rooms, budget records, notifications,
              and decisions. This app never fills gaps with invented certainty.
            </Text>
            <Pressable
              style={styles.darkButton}
              onPress={() => open("/sign-in?callbackUrl=/properties")}
            >
              <Text style={styles.darkButtonText}>Sign in to sync</Text>
            </Pressable>
          </View>
        ) : null}
        {status === "error" ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Could not sync</Text>
            <Text style={styles.copy}>
              Your last screen remains available. Retry when connectivity
              returns; queued actions stay explicit.
            </Text>
            <Pressable style={styles.outlineButton} onPress={() => void sync()}>
              <Text style={styles.outlineButtonText}>Retry sync</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>HOME INTELLIGENCE</Text>
          <Text style={styles.heroTitle}>
            {selectedProperty?.name ?? "Your home, made legible."}
          </Text>
          <Text style={styles.heroCopy}>
            {selectedProperty?.city ? `${selectedProperty.city} · ` : ""}One
            shared record from Home Truth to build.
          </Text>
          <View style={styles.stats}>
            <View>
              <Text style={styles.statValue}>{properties.length || "—"}</Text>
              <Text style={styles.statLabel}>HOMES</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{unread || "—"}</Text>
              <Text style={styles.statLabel}>UNREAD</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{queueSize || "—"}</Text>
              <Text style={styles.statLabel}>QUEUED</Text>
            </View>
          </View>
        </View>
        {tab === "Home" && (
          <>
            <Text style={styles.sectionTitle}>Next best step</Text>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {selectedProperty
                  ? "Strengthen the record"
                  : "Add your first home"}
              </Text>
              <Text style={styles.copy}>
                {selectedProperty
                  ? "Confirm dimensions, upload evidence, or review a real decision before moving further."
                  : "Create a home in the web workspace to begin the shared journey."}
              </Text>
              <Pressable
                onPress={() =>
                  selectedProperty ? showCapture() : open("/properties")
                }
              >
                <Text style={styles.link}>
                  {selectedProperty ? "Capture evidence →" : "Open workspace →"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.sectionTitle}>Recent notifications</Text>
            {notifications.length ? (
              notifications.slice(0, 5).map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.row, !item.read && styles.unread]}
                  onPress={() => void markRead(item.id)}
                >
                  <View style={styles.rowCopy}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.copy}>{item.message}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.copy}>
                  No notifications available yet. That is a real empty state,
                  not a fabricated activity feed.
                </Text>
              </View>
            )}
          </>
        )}
        {tab === "Design" && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Design decisions</Text>
            <Text style={styles.copy}>
              Design directions, spatial evidence, layout objects, and approval
              gates live in the shared workspace. Mobile keeps the decision
              state honest and hands off to the full review surface.
            </Text>
            <Pressable
              style={styles.darkButton}
              onPress={() => open(`/properties/${selectedProperty?.id ?? ""}`)}
            >
              <Text style={styles.darkButtonText}>Open design workspace</Text>
            </Pressable>
          </View>
        )}
        {tab === "Budget" && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Budget reality</Text>
            <Text style={styles.budget}>
              {budget == null
                ? "Unknown"
                : `₹${budget.toLocaleString("en-IN")}`}
            </Text>
            <Text style={styles.copy}>
              {budget == null
                ? "No customer-stated target budget is recorded for this home yet."
                : "This is the stated target only. Itemized BOQ totals, evidence, freshness, and estimate bands belong to the budget workspace."}
            </Text>
            <Pressable
              style={styles.darkButton}
              onPress={() => open(`/properties/${selectedProperty?.id ?? ""}`)}
            >
              <Text style={styles.darkButtonText}>Review budget & BOQ</Text>
            </Pressable>
          </View>
        )}
        {tab === "Build" && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Build & handover</Text>
            <Text style={styles.copy}>
              Orders, execution state, structured snags, evidence, and handover
              acceptance remain linked to real records. Handover cannot be
              accepted while unresolved snags exist.
            </Text>
            <Pressable
              style={styles.darkButton}
              onPress={() =>
                open(`/properties/${selectedProperty?.id ?? ""}/progress`)
              }
            >
              <Text style={styles.darkButtonText}>Open lifecycle</Text>
            </Pressable>
          </View>
        )}
        {tab === "More" && (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Shared client boundary</Text>
            <Text style={styles.copy}>API: {API_BASE}</Text>
            <Text style={styles.copy}>
              Local queued actions: {queueSize}. Unknown provider states are
              surfaced, not hidden.
            </Text>
            <Pressable style={styles.outlineButton} onPress={() => void sync()}>
              <Text style={styles.outlineButtonText}>Sync now</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <View style={styles.tabbar}>
        {tabs.map((item) => (
          <Pressable
            key={item}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.tabIcon, tab === item && styles.active]}>
              {item === "Home"
                ? "⌂"
                : item === "Design"
                  ? "◇"
                  : item === "Budget"
                    ? "₹"
                    : item === "Build"
                      ? "◫"
                      : "⋯"}
            </Text>
            <Text style={[styles.tabText, tab === item && styles.active]}>
              {item}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF8F4" },
  content: { padding: 20, paddingBottom: 40 },
  topline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  brand: {
    color: "#24221F",
    fontFamily: "serif",
    fontSize: 25,
    fontWeight: "600",
  },
  sync: { color: "#8E867D", fontSize: 9, letterSpacing: 1.3 },
  hero: {
    backgroundColor: "#2C2A27",
    borderRadius: 24,
    padding: 22,
    marginBottom: 26,
  },
  eyebrow: { color: "#D5AA6B", fontSize: 9, letterSpacing: 1.7 },
  heroTitle: {
    color: "#F7F1E8",
    fontFamily: "serif",
    fontSize: 36,
    lineHeight: 39,
    marginTop: 15,
  },
  heroCopy: { color: "#BDB4A7", fontSize: 12, lineHeight: 18, marginTop: 12 },
  stats: { flexDirection: "row", gap: 36, marginTop: 28 },
  statValue: { color: "#F7F1E8", fontSize: 20, fontWeight: "600" },
  statLabel: {
    color: "#A9A092",
    fontSize: 8,
    letterSpacing: 1.1,
    marginTop: 5,
  },
  sectionTitle: {
    color: "#24221F",
    fontFamily: "serif",
    fontSize: 23,
    marginBottom: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: "#F5F0E8",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7DFD3",
    marginBottom: 25,
  },
  cardTitle: { color: "#35312C", fontSize: 14, fontWeight: "700" },
  copy: { color: "#827A70", fontSize: 12, lineHeight: 18, marginTop: 6 },
  link: { color: "#A65C43", fontSize: 12, fontWeight: "700", marginTop: 14 },
  notice: {
    backgroundColor: "#E9E1D5",
    borderRadius: 20,
    padding: 19,
    marginBottom: 20,
  },
  noticeTitle: { color: "#35312C", fontFamily: "serif", fontSize: 23 },
  darkButton: {
    backgroundColor: "#2C2A27",
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 16,
  },
  darkButtonText: { color: "#F7F1E8", fontSize: 12, fontWeight: "700" },
  outlineButton: {
    borderColor: "#A65C43",
    borderWidth: 1,
    borderRadius: 22,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 15,
  },
  outlineButtonText: { color: "#A65C43", fontSize: 12, fontWeight: "700" },
  budget: {
    color: "#2C2A27",
    fontFamily: "serif",
    fontSize: 34,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2DCD2",
  },
  unread: {
    backgroundColor: "#F5F0E8",
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  rowCopy: { flex: 1 },
  chevron: { color: "#A65C43", fontSize: 22 },
  tabbar: {
    backgroundColor: "#FAF8F4",
    borderTopWidth: 1,
    borderTopColor: "#DED8CE",
    height: 78,
    paddingBottom: 9,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tab: { alignItems: "center", justifyContent: "center", width: 65 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  tabIcon: { color: "#9B9185", fontSize: 20, lineHeight: 24 },
  tabText: { color: "#9B9185", fontSize: 9, marginTop: 3 },
  active: { color: "#A65C43", fontWeight: "700" },
});
