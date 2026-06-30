import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "PeacemakerAI";
const PRODUCT_IDENTIFIER = "peacemakerai_premium_monthly";
const PLAY_STORE_PRODUCT_IDENTIFIER = "peacemakerai_premium_monthly:monthly";
const PRODUCT_DISPLAY_NAME = "Premium Monthly";
const PRODUCT_USER_FACING_TITLE = "PeacemakerAI Premium";
const PRODUCT_DURATION = "P1M";
const APP_STORE_APP_NAME = "PeacemakerAI iOS";
const APP_STORE_BUNDLE_ID = "com.peacemakerai.app";
const PLAY_STORE_APP_NAME = "PeacemakerAI Android";
const PLAY_STORE_PACKAGE_NAME = "com.peacemakerai.app";
const ENTITLEMENT_IDENTIFIER = "premium";
const ENTITLEMENT_DISPLAY_NAME = "Premium Access";
const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";
const PACKAGE_IDENTIFIER = "$rc_monthly";
const PACKAGE_DISPLAY_NAME = "Monthly Subscription";

const PRODUCT_PRICES = [
  { amount_micros: 6990000, currency: "USD" },
  { amount_micros: 6490000, currency: "EUR" },
  { amount_micros: 5490000, currency: "GBP" },
  { amount_micros: 10990000, currency: "AUD" },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // --- Project ---
  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects: " + JSON.stringify(listProjectsError));

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) throw new Error("Failed to create project: " + JSON.stringify(error));
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  // --- Apps ---
  const { data: appsData, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError) throw new Error("Failed to list apps");

  const apps = appsData.items ?? [];
  let testApp = apps.find((a) => a.type === "test_store");
  let appStoreApp = apps.find((a) => a.type === "app_store");
  let playStoreApp = apps.find((a) => a.type === "play_store");

  if (!testApp) throw new Error("No test_store app found in project");
  console.log("Test app:", testApp.id);

  if (!appStoreApp) {
    const { data, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app: " + JSON.stringify(error));
    appStoreApp = data; console.log("Created App Store app:", appStoreApp.id);
  } else { console.log("App Store app:", appStoreApp.id); }

  if (!playStoreApp) {
    const { data, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app: " + JSON.stringify(error));
    playStoreApp = data; console.log("Created Play Store app:", playStoreApp.id);
  } else { console.log("Play Store app:", playStoreApp.id); }

  // --- Products ---
  const { data: existingProds, error: listProdsErr } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProdsErr) throw new Error("Failed to list products");

  const ensureProduct = async (targetApp: App, label: string, storeId: string, isTest: boolean): Promise<Product> => {
    const existing = existingProds.items?.find((p) => p.store_identifier === storeId && p.app_id === targetApp.id);
    if (existing) { console.log(`${label} product exists:`, existing.id); return existing; }
    const body: CreateProductData["body"] = {
      store_identifier: storeId,
      app_id: targetApp.id,
      type: "subscription",
      display_name: PRODUCT_DISPLAY_NAME,
    };
    if (isTest) { body.subscription = { duration: PRODUCT_DURATION }; body.title = PRODUCT_USER_FACING_TITLE; }
    const { data, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error(`Failed to create ${label} product: ` + JSON.stringify(error));
    console.log(`Created ${label} product:`, data.id);
    return data;
  };

  const testProduct = await ensureProduct(testApp!, "Test Store", PRODUCT_IDENTIFIER, true);
  const appStoreProduct = await ensureProduct(appStoreApp!, "App Store", PRODUCT_IDENTIFIER, false);
  const playStoreProduct = await ensureProduct(playStoreApp!, "Play Store", PLAY_STORE_PRODUCT_IDENTIFIER, false);

  // --- Test store prices ---
  const { data: priceData, error: priceErr } = await client.post<TestStorePricesResponse>({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: project.id, product_id: testProduct.id },
    body: { prices: PRODUCT_PRICES },
  });
  if (priceErr) {
    if ((priceErr as any)?.type === "resource_already_exists") {
      console.log("Test store prices already exist");
    } else {
      console.warn("Price warning:", JSON.stringify(priceErr));
    }
  } else {
    console.log("Test store prices set: $6.99/mo");
  }

  // --- Entitlement ---
  let entitlement: Entitlement;
  const { data: entsData, error: entsErr } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (entsErr) throw new Error("Failed to list entitlements");

  const existingEnt = entsData.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEnt) { console.log("Entitlement exists:", existingEnt.id); entitlement = existingEnt; }
  else {
    const { data, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement: " + JSON.stringify(error));
    console.log("Created entitlement:", data.id);
    entitlement = data;
  }

  const { error: attachEntErr } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: { product_ids: [testProduct.id, appStoreProduct.id, playStoreProduct.id] },
  });
  if (attachEntErr && (attachEntErr as any)?.type !== "unprocessable_entity_error") {
    console.warn("Entitlement attach warning:", JSON.stringify(attachEntErr));
  } else { console.log("Products attached to entitlement"); }

  // --- Offering ---
  let offering: Offering;
  const { data: offsData, error: offsErr } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (offsErr) throw new Error("Failed to list offerings");

  const existingOff = offsData.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOff) { console.log("Offering exists:", existingOff.id); offering = existingOff; }
  else {
    const { data, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering: " + JSON.stringify(error));
    console.log("Created offering:", data.id);
    offering = data;
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  // --- Package ---
  let pkg: Package;
  const { data: pkgsData, error: pkgsErr } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (pkgsErr) throw new Error("Failed to list packages");

  const existingPkg = pkgsData.items?.find((p) => p.lookup_key === PACKAGE_IDENTIFIER);
  if (existingPkg) { console.log("Package exists:", existingPkg.id); pkg = existingPkg; }
  else {
    const { data, error } = await createPackages({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { lookup_key: PACKAGE_IDENTIFIER, display_name: PACKAGE_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create package: " + JSON.stringify(error));
    console.log("Created package:", data.id);
    pkg = data;
  }

  const { error: attachPkgErr } = await attachProductsToPackage({
    client,
    path: { project_id: project.id, package_id: pkg.id },
    body: {
      products: [
        { product_id: testProduct.id, eligibility_criteria: "all" },
        { product_id: appStoreProduct.id, eligibility_criteria: "all" },
        { product_id: playStoreProduct.id, eligibility_criteria: "all" },
      ],
    },
  });
  if (attachPkgErr && (attachPkgErr as any)?.type !== "unprocessable_entity_error") {
    console.warn("Package attach warning:", JSON.stringify(attachPkgErr));
  } else { console.log("Products attached to package"); }

  // --- API Keys ---
  const { data: testKeys, error: testKeysErr } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: testApp!.id },
  });
  if (testKeysErr) throw new Error("Failed to list test API keys: " + JSON.stringify(testKeysErr));

  const { data: iosKeys, error: iosKeysErr } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: appStoreApp!.id },
  });
  if (iosKeysErr) throw new Error("Failed to list iOS API keys: " + JSON.stringify(iosKeysErr));

  const { data: androidKeys, error: androidKeysErr } = await listAppPublicApiKeys({
    client,
    path: { project_id: project.id, app_id: playStoreApp!.id },
  });
  if (androidKeysErr) throw new Error("Failed to list Android API keys: " + JSON.stringify(androidKeysErr));

  console.log("\n==================================================");
  console.log("RevenueCat setup complete! Set these env vars:");
  console.log("REVENUECAT_PROJECT_ID=" + project.id);
  console.log("REVENUECAT_TEST_STORE_APP_ID=" + testApp!.id);
  console.log("REVENUECAT_APPLE_APP_STORE_APP_ID=" + appStoreApp!.id);
  console.log("REVENUECAT_GOOGLE_PLAY_STORE_APP_ID=" + playStoreApp!.id);
  console.log("EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=" + (testKeys?.items?.[0]?.key ?? "MISSING"));
  console.log("EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=" + (iosKeys?.items?.[0]?.key ?? "MISSING"));
  console.log("EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=" + (androidKeys?.items?.[0]?.key ?? "MISSING"));
  console.log("==================================================\n");
}

seedRevenueCat().catch(console.error);
