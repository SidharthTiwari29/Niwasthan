import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNiwasthanAuth } from "./src/api/auth";
import { apiFetch, ApiError } from "./src/api/client";

type DashboardProperty = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  propertyType: string | null;
  targetBudgetMinor: number | null;
  roomCount: number;
  designCount: number;
};

type Tab = "Home" | "Design" | "Budget" | "Build" | "More";
const tabs: Tab[] = ["Home", "Design", "Budget", "Build", "More"];

type DesignDirection = {
  id: string;
  name: string;
  status: "ACTIVE" | "ALTERNATIVE" | "REJECTED";
  createdAt: string;
  activatedAt: string | null;
};

function MainApp({ userName }: { userName: string | null }) {
  const [tab, setTab] = useState<Tab>("Home");
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<DashboardProperty[] | null>(
    null,
  );
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [designDirections, setDesignDirections] = useState<
    DesignDirection[] | null
  >(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const filteredDirections = useMemo(
    () =>
      (designDirections ?? []).filter((direction) =>
        direction.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [designDirections, search],
  );
  function showCapture() {
    Alert.alert("Capture your home", "Choose what you want to add.", [
      {
        text: "Take a photo",
        onPress: () =>
          Alert.alert(
            "Camera ready",
            "Connect the camera permission flow to capture a room photo.",
          ),
      },
      {
        text: "Upload a plan",
        onPress: () =>
          Alert.alert(
            "Upload ready",
            "Connect the resumable upload flow to add a floor plan.",
          ),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }
  async function activateDirectionOnMobile(direction: DesignDirection) {
    setActivatingId(direction.id);
    try {
      await apiFetch(`/api/mobile/design/${direction.id}/activate`, {
        method: "POST",
      });
      setDesignDirections(
        (current) =>
          current?.map((item) => ({
            ...item,
            status:
              item.id === direction.id
                ? "ACTIVE"
                : item.status === "ACTIVE"
                  ? "ALTERNATIVE"
                  : item.status,
          })) ?? null,
      );
    } catch (error) {
      Alert.alert(
        "Couldn't activate this direction",
        error instanceof ApiError
          ? error.message
          : "Please try again in a moment.",
      );
    } finally {
      setActivatingId(null);
    }
  }
  const refreshSync = useCallback(async () => {
    setSyncing(true);
    setDashboardError(null);
    try {
      const [dashboardResult, designResult] = await Promise.all([
        apiFetch<{ properties: DashboardProperty[] }>("/api/mobile/dashboard"),
        apiFetch<{ directions: DesignDirection[] }>("/api/mobile/design"),
      ]);
      setProperties(dashboardResult.properties);
      setDesignDirections(designResult.directions);
    } catch (error) {
      setDashboardError(
        error instanceof ApiError
          ? error.message
          : "Couldn't reach your account. Pull to refresh to try again.",
      );
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshSync();
    })();
  }, [refreshSync]);
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        <View style={styles.topbar}>
          <View>
            <Text style={styles.brand}>niwasthan</Text>
            <Text style={styles.eyebrow}>HOME INTELLIGENCE</Text>
          </View>
          <Pressable
            onPress={() =>
              Alert.alert("Notifications", "You are all caught up.")
            }
            style={styles.bell}
            accessibilityLabel="Notifications"
          >
            <Text style={styles.bellText}>◌</Text>
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.syncRow}>
            <View style={styles.syncLeft}>
              <View
                style={[
                  styles.syncDot,
                  dashboardError ? { backgroundColor: "#B66F51" } : null,
                ]}
              />
              <Text style={styles.syncText}>
                {syncing
                  ? "Syncing your workspace…"
                  : dashboardError
                    ? dashboardError
                    : "Synced"}
              </Text>
            </View>
            <Pressable onPress={refreshSync}>
              <Text style={styles.syncAction}>Refresh</Text>
            </Pressable>
          </View>
          {tab === "Home" && (
            <HomeView
              onCapture={showCapture}
              onOpen={setTab}
              properties={properties}
              userName={userName}
            />
          )}
          {tab === "Design" && (
            <DesignView
              propertyName={properties?.[0]?.name ?? null}
              filteredDirections={filteredDirections}
              loading={designDirections === null}
              search={search}
              setSearch={setSearch}
              onActivate={activateDirectionOnMobile}
              activatingId={activatingId}
            />
          )}
          {tab === "Budget" && <BudgetView />}
          {tab === "Build" && <BuildView onCapture={showCapture} />}
          {tab === "More" && <MoreView />}
        </ScrollView>
        <View style={styles.tabbar}>
          {tabs.map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
            >
              <Text
                style={[styles.tabIcon, tab === item && styles.tabIconActive]}
              >
                {item === "Home"
                  ? "⌂"
                  : item === "Design"
                    ? "✧"
                    : item === "Budget"
                      ? "₹"
                      : item === "Build"
                        ? "◫"
                        : "⋯"}
              </Text>
              <Text
                style={[styles.tabText, tab === item && styles.tabTextActive]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Real, minimal auth gate - shown before any real project data has
// ever been requested. A signed-out visitor sees a genuine sign-in
// prompt, not the existing placeholder UI below pretending to be
// connected to an account that hasn't authenticated yet.
export default function App() {
  const { state, signIn } = useNiwasthanAuth();

  if (state.status === "loading") {
    return (
      <SafeAreaView style={gateStyles.safe}>
        <StatusBar style="dark" />
        <ActivityIndicator color="#B66F51" />
      </SafeAreaView>
    );
  }

  if (state.status === "notConfigured") {
    return (
      <SafeAreaView style={gateStyles.safe}>
        <StatusBar style="dark" />
        <View style={gateStyles.content}>
          <Text style={gateStyles.brand}>niwasthan</Text>
          <Text style={gateStyles.title}>
            Sign-in isn&apos;t configured yet.
          </Text>
          <Text style={gateStyles.subtitle}>
            This build is missing its real Google sign-in credentials. Nothing
            here is broken - the app just hasn&apos;t been given real values for
            expo.extra.googleWebClientId (and the iOS/Android equivalents) in
            app.json.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state.status === "signedOut") {
    return (
      <SafeAreaView style={gateStyles.safe}>
        <StatusBar style="dark" />
        <View style={gateStyles.content}>
          <Text style={gateStyles.brand}>niwasthan</Text>
          <Text style={gateStyles.title}>Your home, made legible.</Text>
          <Text style={gateStyles.subtitle}>
            Sign in with the same Google account you use on the Niwasthan
            website to see your real properties, designs, and budget.
          </Text>
          <Pressable onPress={signIn} style={gateStyles.button}>
            <Text style={gateStyles.buttonText}>Continue with Google</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <MainApp userName={state.user.name} />;
}

const gateStyles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F1EB",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 28, alignItems: "center" },
  brand: {
    fontFamily: "serif",
    fontSize: 22,
    color: "#24221F",
    letterSpacing: -1,
    marginBottom: 24,
  },
  title: {
    fontFamily: "serif",
    fontSize: 30,
    color: "#24221F",
    textAlign: "center",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: "#81796F",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#2C2A27",
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  buttonText: { color: "#F7F1E8", fontSize: 14, fontWeight: "700" },
});

function formatBudget(minor: number | null) {
  if (!minor) return "Not set";
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

// Same real progress and next-step rules the web dashboard uses, so the
// same account never tells two different stories on two devices.
function propertyProgress(property: DashboardProperty) {
  if (property.designCount > 0) return 75;
  if (property.roomCount > 0) return 50;
  return 25;
}

function nextStepFor(property: DashboardProperty) {
  if (property.roomCount === 0)
    return {
      title: "Upload your floor plan",
      copy: "Rooms, dimensions and unknowns can be reviewed once a plan is added. Nothing is assumed before then.",
    };
  if (property.designCount === 0)
    return {
      title: "Start a design direction",
      copy: "Your rooms are understood. Compare design directions grounded in your real home.",
    };
  return {
    title: "Continue designing",
    copy: "Review your directions and budget impact before committing to anything.",
  };
}

function HomeView({
  onCapture,
  onOpen,
  properties,
  userName,
}: {
  onCapture: () => void;
  onOpen: (tab: Tab) => void;
  properties: DashboardProperty[] | null;
  userName: string | null;
}) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = userName?.split(" ")[0];
  const featured = properties?.[0];
  const progress = featured ? propertyProgress(featured) : 0;
  const step = featured ? nextStepFor(featured) : null;

  return (
    <>
      <Text style={styles.date}>
        {now
          .toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
          .toUpperCase()}
      </Text>
      <Text style={styles.title}>
        {firstName ? `${greeting}, ${firstName}.` : `${greeting}.`}
      </Text>
      <Text style={styles.subtitle}>
        Your home is becoming clearer. Confirm the few unknowns and your next
        decision gets easier.
      </Text>
      {properties === null ? (
        <View style={styles.hero}>
          <ActivityIndicator color="#B66F51" />
        </View>
      ) : featured ? (
        <View style={styles.hero}>
          <View style={styles.heroLine}>
            <View>
              <Text style={styles.pill}>ACTIVE HOME</Text>
              <Text style={styles.heroTitle}>{featured.name}</Text>
              <Text style={styles.heroMeta}>
                {featured.city ??
                  featured.address ??
                  "Location to be confirmed"}
              </Text>
            </View>
            <Text style={styles.heroMark}>✦</Text>
          </View>
          <View style={styles.statRow}>
            <Stat value={`${progress}%`} label="PROGRESS" />
            <Stat value={String(featured.roomCount)} label="ROOMS UNDERSTOOD" />
            <Stat
              value={formatBudget(featured.targetBudgetMinor)}
              label="TARGET BUDGET"
            />
          </View>
          <Text style={styles.heroNote}>
            Target budget is what you set, not a confirmed final cost.
          </Text>
          <Pressable onPress={() => onOpen("Design")} style={styles.heroLink}>
            <Text style={styles.heroLinkText}>Open home intelligence ↗</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Your first home starts here.</Text>
          <Text style={styles.heroNote}>
            Add a property on the Niwasthan website and it will appear here.
          </Text>
        </View>
      )}
      {step ? (
        <>
          <SectionHeading
            eyebrow="NEXT BEST STEP"
            title="One small confirmation unlocks better options."
          />
          <View style={styles.nextCard}>
            <View style={styles.iconBubble}>
              <Text style={styles.iconText}>⌾</Text>
            </View>
            <View style={styles.nextCopy}>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardCopy}>{step.copy}</Text>
              <Pressable onPress={onCapture}>
                <Text style={styles.link}>Add a photo or plan ›</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
      <Pressable
        onPress={onCapture}
        style={({ pressed }) => [styles.captureCard, pressed && styles.pressed]}
      >
        <View style={styles.captureIcon}>
          <Text>＋</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            Bring the real home into the room
          </Text>
          <Text style={styles.cardCopy}>
            Upload a plan, photo, video, or measurement.
          </Text>
        </View>
        <Text style={styles.arrow}>↗</Text>
      </Pressable>
    </>
  );
}

function statusLabel(status: DesignDirection["status"]) {
  if (status === "ACTIVE") return "YOUR ACTIVE DIRECTION";
  if (status === "REJECTED") return "REJECTED";
  return "ALTERNATIVE";
}

function DesignView({
  propertyName,
  filteredDirections,
  loading,
  search,
  setSearch,
  onActivate,
  activatingId,
}: {
  propertyName: string | null;
  filteredDirections: DesignDirection[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onActivate: (direction: DesignDirection) => void;
  activatingId: string | null;
}) {
  return (
    <>
      <Text style={styles.date}>DESIGN INTELLIGENCE</Text>
      <Text style={styles.title}>
        {propertyName
          ? `Directions for ${propertyName}.`
          : "Directions grounded in your home."}
      </Text>
      <Text style={styles.subtitle}>
        Real directions from your account - never a stock mockup. Activating one
        here makes it your home&apos;s current direction; the one it replaces is
        kept as an alternative, never deleted.
      </Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search directions"
        placeholderTextColor="#9B9185"
        style={styles.input}
      />
      {loading ? (
        <View style={styles.hero}>
          <ActivityIndicator color="#B66F51" />
        </View>
      ) : filteredDirections.length === 0 ? (
        <View style={styles.directionCard}>
          <Text style={styles.cardCopy}>
            {propertyName
              ? "No design directions yet. Start one from the Niwasthan website to see it here."
              : "Add a property on the Niwasthan website to begin exploring design directions."}
          </Text>
        </View>
      ) : (
        filteredDirections.map((direction) => (
          <View key={direction.id} style={styles.directionCard}>
            <View style={styles.directionBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.directionName}>{direction.name}</Text>
                <Text style={styles.cardCopy}>
                  {statusLabel(direction.status)}
                </Text>
              </View>
            </View>
            {direction.status !== "ACTIVE" &&
            direction.status !== "REJECTED" ? (
              <Pressable
                disabled={activatingId === direction.id}
                onPress={() => onActivate(direction)}
              >
                <Text style={styles.link}>
                  {activatingId === direction.id
                    ? "Activating…"
                    : "Make this my active direction ›"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))
      )}
    </>
  );
}
function BudgetView() {
  return (
    <>
      <Text style={styles.date}>BUDGET & BOQ</Text>
      <Text style={styles.title}>Know what the decision changes.</Text>
      <Text style={styles.subtitle}>
        Estimates are clearly separated from confirmed values. Potential savings
        are not reported as realised savings.
      </Text>
      <View style={styles.budgetHero}>
        <Text style={styles.budgetLabel}>WORKING BUDGET</Text>
        <Text style={styles.budgetValue}>—</Text>
        <View style={styles.budgetSplit}>
          <View>
            <Text style={styles.budgetSmall}>Confirmed</Text>
            <Text style={styles.budgetStat}>—</Text>
          </View>
          <View>
            <Text style={styles.budgetSmall}>Estimated</Text>
            <Text style={styles.budgetStat}>—</Text>
          </View>
          <View>
            <Text style={styles.budgetSmall}>Confidence</Text>
            <Text style={styles.budgetStat}>—</Text>
          </View>
        </View>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>
          A better deal is not always the cheapest choice.
        </Text>
        <Text style={styles.cardCopy}>
          When alternatives become available, we’ll show price delta, quality,
          maintenance, warranty, and downstream impact together.
        </Text>
        <Pressable
          onPress={() =>
            Alert.alert(
              "Savings mode",
              "Savings opportunities will appear once the catalogue and BOQ are connected.",
            )
          }
        >
          <Text style={styles.link}>Open savings mode ›</Text>
        </Pressable>
      </View>
    </>
  );
}
function BuildView({ onCapture }: { onCapture: () => void }) {
  return (
    <>
      <Text style={styles.date}>BUILD & HANDOVER</Text>
      <Text style={styles.title}>Build what you approved.</Text>
      <Text style={styles.subtitle}>
        Every milestone keeps the decision history, evidence, and next owner
        visible.
      </Text>
      {[
        ["Design lock", "Awaiting live sync", "#D8D0C4"],
        ["BOQ and quote review", "Awaiting live sync", "#D8D0C4"],
        ["Site reality check", "Awaiting live sync", "#D8D0C4"],
        ["Installation and snagging", "Awaiting live sync", "#D8D0C4"],
      ].map(([label, state, color], index) => (
        <View key={String(label)} style={styles.timelineRow}>
          <View
            style={[styles.timelineDot, { backgroundColor: color as string }]}
          >
            <Text style={styles.timelineNumber}>{index + 1}</Text>
          </View>
          <View style={styles.timelineCopy}>
            <Text style={styles.cardTitle}>{label}</Text>
            <Text style={styles.cardCopy}>{state}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      ))}
      <View style={styles.infoCard}>
        <Text style={styles.cardTitle}>Snags and handover</Text>
        <Text style={styles.cardCopy}>
          Structured snags, evidence attachments, resolution, and handover
          acceptance will appear here after authenticated execution data syncs.
        </Text>
        <Text style={styles.link}>Awaiting live execution sync</Text>
      </View>
    </>
  );
}
function MoreView() {
  return (
    <>
      <Text style={styles.date}>YOUR NIWASTHAN</Text>
      <Text style={styles.title}>The memory of your home.</Text>
      <Text style={styles.subtitle}>
        Keep people, decisions, documents, and care instructions together over
        time.
      </Text>
      {[
        "Home Memory / DNA",
        "Notifications",
        "Language: English",
        "Account & privacy",
      ].map((item) => (
        <Pressable
          key={item}
          onPress={() =>
            Alert.alert(
              item,
              "This surface is ready to connect to the shared Niwasthan account and domain services.",
            )
          }
          style={styles.moreRow}
        >
          <Text style={styles.cardTitle}>{item}</Text>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}
      <View style={styles.humsafar}>
        <Text style={styles.pill}>HUMSAFAR</Text>
        <Text style={styles.humsafarTitle}>
          A second opinion, without taking the decision away from you.
        </Text>
        <Pressable
          onPress={() =>
            Alert.alert(
              "Humsafar",
              "Ask about your space, budget, or the next best step.",
            )
          }
        >
          <Text style={styles.heroLinkText}>Start a conversation ↗</Text>
        </Pressable>
      </View>
    </>
  );
}
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.date}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F4F1EB" },
  app: { flex: 1, backgroundColor: "#F4F1EB" },
  topbar: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    fontFamily: "serif",
    fontSize: 25,
    color: "#24221F",
    letterSpacing: -1.2,
  },
  eyebrow: {
    color: "#8F8475",
    fontSize: 8,
    letterSpacing: 2.3,
    fontWeight: "700",
    marginTop: 2,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DED8CE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAF8F4",
  },
  bellText: { color: "#71695F", fontSize: 22 },
  notificationDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B66F51",
    top: 10,
    right: 10,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  syncRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginBottom: 20,
  },
  syncLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#7D9A7B" },
  syncText: { color: "#8D847A", fontSize: 11 },
  syncAction: { color: "#A65C43", fontSize: 11, fontWeight: "700" },
  date: {
    color: "#B66F51",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.2,
    marginBottom: 8,
  },
  title: {
    color: "#24221F",
    fontFamily: "serif",
    fontSize: 37,
    lineHeight: 43,
    letterSpacing: -1.5,
  },
  subtitle: {
    color: "#81796F",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 22,
  },
  hero: {
    backgroundColor: "#2C2A27",
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
  },
  heroLine: { flexDirection: "row", justifyContent: "space-between" },
  pill: {
    color: "#DFC292",
    backgroundColor: "#4B463E",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  heroTitle: {
    color: "#F7F1E8",
    fontFamily: "serif",
    fontSize: 28,
    marginTop: 14,
    letterSpacing: -1,
  },
  heroMeta: { color: "#AAA296", fontSize: 11, marginTop: 4 },
  heroMark: { color: "#F2C98C", fontSize: 20 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
    paddingRight: 12,
  },
  stat: { flex: 1 },
  statValue: { color: "#F7F1E8", fontSize: 22, fontWeight: "600" },
  statLabel: {
    color: "#A9A092",
    fontSize: 8,
    letterSpacing: 1.1,
    marginTop: 6,
  },
  heroNote: {
    color: "#AAA296",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 17,
    maxWidth: 320,
  },
  heroLink: { marginTop: 28 },
  heroLinkText: { color: "#F2C98C", fontSize: 12, fontWeight: "700" },
  sectionHeading: { marginBottom: 13, marginTop: 3 },
  sectionTitle: {
    color: "#24221F",
    fontFamily: "serif",
    fontSize: 23,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  nextCard: {
    backgroundColor: "#F5F0E8",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7DFD3",
    flexDirection: "row",
    gap: 12,
    marginBottom: 29,
  },
  iconBubble: {
    backgroundColor: "#D8E2D1",
    height: 30,
    width: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#4D704B", fontSize: 16 },
  nextCopy: { flex: 1 },
  cardTitle: { color: "#35312C", fontSize: 14, fontWeight: "700" },
  cardCopy: { color: "#827A70", fontSize: 11, lineHeight: 17, marginTop: 5 },
  link: { color: "#A65C43", fontSize: 12, fontWeight: "700", marginTop: 12 },
  progressCard: {
    borderWidth: 1,
    borderColor: "#E2DCD2",
    borderRadius: 17,
    padding: 16,
    marginBottom: 10,
  },
  progressHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressValue: { color: "#35312C", fontFamily: "serif", fontSize: 21 },
  track: {
    height: 6,
    backgroundColor: "#E5DFD6",
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  progress: { height: 6, borderRadius: 4 },
  captureCard: {
    backgroundColor: "#E9E1D5",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  captureIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: "#F4EEE5",
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: { color: "#A65C43", fontSize: 21 },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#DED8CE",
    borderRadius: 14,
    backgroundColor: "#FAF8F4",
    paddingHorizontal: 14,
    color: "#24221F",
    marginBottom: 14,
  },
  directionCard: {
    backgroundColor: "#FBF9F5",
    borderRadius: 18,
    paddingBottom: 15,
    marginBottom: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2DCD2",
  },
  directionVisual: { height: 118, position: "relative", overflow: "hidden" },
  directionShape: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    right: -15,
    top: -22,
    opacity: 0.8,
  },
  directionTag: {
    position: "absolute",
    bottom: 11,
    left: 13,
    backgroundColor: "rgba(255,255,255,.75)",
    color: "#554A3E",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  saveButton: {
    position: "absolute",
    top: 11,
    right: 11,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.76)",
    alignItems: "center",
    justifyContent: "center",
  },
  directionBody: {
    paddingHorizontal: 15,
    paddingTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  directionName: { color: "#35312C", fontFamily: "serif", fontSize: 21 },
  score: {
    color: "#35312C",
    fontFamily: "serif",
    fontSize: 19,
    textAlign: "right",
  },
  scoreLabel: { color: "#A0978B", fontSize: 8, letterSpacing: 1, marginTop: 3 },
  budgetHero: {
    backgroundColor: "#2C2A27",
    borderRadius: 22,
    padding: 22,
    marginBottom: 14,
  },
  budgetLabel: { color: "#A9A092", fontSize: 9, letterSpacing: 1.5 },
  budgetValue: {
    color: "#F7F1E8",
    fontFamily: "serif",
    fontSize: 35,
    marginTop: 6,
  },
  budgetSplit: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 27,
  },
  budgetSmall: { color: "#A9A092", fontSize: 10 },
  budgetStat: {
    color: "#F7F1E8",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: "#F5F0E8",
    borderRadius: 18,
    padding: 17,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E7DFD3",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2DCD2",
    gap: 12,
  },
  timelineDot: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineNumber: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  timelineCopy: { flex: 1 },
  moreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 19,
    borderBottomWidth: 1,
    borderBottomColor: "#E2DCD2",
  },
  humsafar: {
    backgroundColor: "#2C2A27",
    borderRadius: 20,
    marginTop: 25,
    padding: 19,
  },
  humsafarTitle: {
    color: "#F7F1E8",
    fontFamily: "serif",
    fontSize: 21,
    lineHeight: 28,
    marginTop: 16,
  },
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
  tabIconActive: { color: "#B66F51" },
  tabText: { color: "#9B9185", fontSize: 9, marginTop: 3 },
  tabTextActive: { color: "#A65C43", fontWeight: "700" },
});
