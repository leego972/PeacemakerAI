import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  listProjects,
  listApps,
  listProducts,
  createProduct,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "PeacemakerAI";
const HEARING_PRODUCT_ID = "peacemaker_book_hearing";
const HEARING_PLAY_STORE_ID = "peacemaker_book_hearing";
const HEARING_DISPLAY_NAME = "Book a Hearing";
const HEARING_TITLE = "Book a Hearing — PeacemakerAI";
const HEARING_OFFERING_ID = "hearings";
const HEARING_OFFERING_NAME = "Book a Hearing";
const HEARING_PACKAGE_ID = "book_hearing";
const HEARING_PACKAGE_NAME = "Single Hearing";

const HEARING_PRICES = [
  { amount_micros: 1990000, currency: "USD" },
  { amount_micros: 1790000, currency: "EUR" },
  { amount_micros: 1590000, currency: "GBP" },
  { amount_micros: 2990000, currency: "AUD" },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function addHearingProduct() {
  const client = await getUncachableRevenueCatClient();

  // --- Find project ---
  const { data: projectsData, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects: " + JSON.stringify(listProjectsError));
  const project = projectsData.items?.find((p) => p.name === PROJECT_NAME);
  if (!project) throw new Error(`Project "${PROJECT_NAME}" not found. Run seedRevenueCat first.`);
  console.log("Project:", project.id);

  // --- Find apps ---
  const { data: appsData, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError) throw new Error("Failed to list apps: " + JSON.stringify(listAppsError));
  const apps = appsData.items ?? [];
  const testApp = apps.find((a) => a.type === "test_store");
  const appStoreApp = apps.find((a) => a.type === "app_store");
  const playStoreApp = apps.find((a) => a.type === "play_store");
  if (!testApp || !appStoreApp || !playStoreApp) throw new Error("Missing apps. Run seedRevenueCat first.");
  console.log("Apps found:", testApp.id, appStoreApp.id, playStoreApp.id);

  // --- Existing products ---
  const { data: existingProds } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });

  const ensureProduct = async (targetApp: App, label: string, storeId: string, isTest: boolean): Promise<Product> => {
    const existing = existingProds?.items?.find(
      (p) => p.store_identifier === storeId && p.app_id === targetApp.id
    );
    if (existing) { console.log(`${label} hearing product exists:`, existing.id); return existing; }

    const body: CreateProductData["body"] = {
      store_identifier: storeId,
      app_id: targetApp.id,
      type: "one_time",
      display_name: HEARING_DISPLAY_NAME,
    };
    if (isTest) { body.title = HEARING_TITLE; }
    const { data, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error(`Failed to create ${label} hearing product: ` + JSON.stringify(error));
    console.log(`Created ${label} hearing product:`, data.id);
    return data;
  };

  const testProduct = await ensureProduct(testApp, "Test Store", HEARING_PRODUCT_ID, true);
  const appStoreProduct = await ensureProduct(appStoreApp, "App Store", HEARING_PRODUCT_ID, false);
  const playStoreProduct = await ensureProduct(playStoreApp, "Play Store", HEARING_PLAY_STORE_ID, false);

  // --- Test store prices ---
  const { error: priceErr } = await client.post({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: project.id, product_id: testProduct.id },
    body: { prices: HEARING_PRICES },
  });
  if (priceErr) {
    if ((priceErr as any)?.type === "resource_already_exists") {
      console.log("Hearing prices already set");
    } else {
      console.warn("Price warning:", JSON.stringify(priceErr));
    }
  } else {
    console.log("Hearing prices set: $1.99");
  }

  // --- Hearings Offering ---
  const { data: offsData } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  let hearingOffering = offsData?.items?.find((o: any) => o.lookup_key === HEARING_OFFERING_ID);
  if (hearingOffering) {
    console.log("Hearings offering exists:", hearingOffering.id);
  } else {
    const { data, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: HEARING_OFFERING_ID, display_name: HEARING_OFFERING_NAME },
    });
    if (error) throw new Error("Failed to create hearings offering: " + JSON.stringify(error));
    hearingOffering = data;
    console.log("Created hearings offering:", hearingOffering.id);
  }

  // --- Package ---
  const { data: pkgsData } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: hearingOffering.id },
    query: { limit: 20 },
  });
  let pkg = pkgsData?.items?.find((p: any) => p.lookup_key === HEARING_PACKAGE_ID);
  if (pkg) {
    console.log("Hearing package exists:", pkg.id);
  } else {
    const { data, error } = await createPackages({
      client,
      path: { project_id: project.id, offering_id: hearingOffering.id },
      body: { lookup_key: HEARING_PACKAGE_ID, display_name: HEARING_PACKAGE_NAME },
    });
    if (error) throw new Error("Failed to create hearing package: " + JSON.stringify(error));
    pkg = data;
    console.log("Created hearing package:", pkg.id);
  }

  // --- Attach products to package ---
  const { error: attachErr } = await attachProductsToPackage({
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
  if (attachErr && (attachErr as any)?.type !== "unprocessable_entity_error") {
    console.warn("Package attach warning:", JSON.stringify(attachErr));
  } else {
    console.log("Products attached to hearing package");
  }

  console.log("\n==================================================");
  console.log("Book a Hearing product setup complete!");
  console.log("Product ID (iOS/Android): " + HEARING_PRODUCT_ID);
  console.log("Price: $1.99 per hearing");
  console.log("RevenueCat offering: " + HEARING_OFFERING_ID);
  console.log("==================================================\n");
}

addHearingProduct().catch(console.error);
