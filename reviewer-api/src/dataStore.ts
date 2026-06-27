import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { BuyerAccount, Claim, GalleryImage, Order, Product, ReviewCase, Seller } from "./types.js";

interface RawData {
  accounts: BuyerAccount[];
  sellers: Seller[];
  orders: Order[];
  products: Product[];
  claims: Claim[];
}

const sellerRejections = [
  "Seller rejected the refund and said the item was checked before shipping.",
  "Seller says the listing photos show the item intact and asks Carousell to review the buyer evidence.",
  "Seller refused refund, saying damage likely happened after successful delivery.",
  "Seller says packaging was adequate and the claim does not prove damage on arrival."
];

export class DataStore {
  private readonly dataRoot: string;
  private cases: ReviewCase[] | null = null;

  constructor(dataRoot = process.env.DATA_ROOT || "..") {
    this.dataRoot = resolve(process.cwd(), dataRoot);
  }

  getClaimImagePath(filename: string) {
    return join(this.dataRoot, "data", "images", "claims", filename);
  }

  getReferenceImagePath(filename: string) {
    return join(this.dataRoot, "data", "images", "reference", filename);
  }

  getCases() {
    if (!this.cases) this.cases = this.buildCases();
    return this.cases;
  }

  getCase(id: string) {
    return this.getCases().find((reviewCase) => reviewCase.id === id);
  }

  private readJson<T>(file: string): T {
    return JSON.parse(readFileSync(join(this.dataRoot, "data", file), "utf8")) as T;
  }

  private loadRawData(): RawData {
    return {
      accounts: this.readJson<BuyerAccount[]>("accounts.json"),
      sellers: this.readJson<Seller[]>("sellers.json"),
      orders: this.readJson<Order[]>("orders.json"),
      products: this.readJson<Product[]>("products.json"),
      claims: this.readJson<Claim[]>("claims.json")
    };
  }

  private buildCases(): ReviewCase[] {
    const raw = this.loadRawData();
    const accounts = new Map(raw.accounts.map((account) => [account.id, account]));
    const sellers = new Map(raw.sellers.map((seller) => [seller.id, seller]));
    const orders = new Map(raw.orders.map((order) => [order.id, order]));
    const products = new Map(raw.products.map((product) => [product.id, product]));

    return raw.claims.flatMap((sourceClaim, index) => {
      const { _dev: _privateEval, ...claim } = sourceClaim;
      const buyer = accounts.get(claim.account_id);
      const order = orders.get(claim.order_id);
      const product = products.get(claim.product_id);
      const seller = order ? sellers.get(order.seller_id) : undefined;
      if (!buyer || !order || !product || !seller) return [];

      const galleryImages = this.buildGalleryImages(claim, raw.claims, product);
      const sellerResponse = sellerRejections[index % sellerRejections.length];
      return [{
        id: claim.id,
        status: "ready",
        buyer,
        seller,
        order,
        product,
        claim,
        primaryImage: claim.images[0],
        galleryImages,
        sellerResponse,
        escalationSummary: `${buyer.display_name} escalated the rejected refund request to Carousell for reviewer assessment.`,
        timeline: [
          {
            label: "Order placed",
            date: order.ordered_at,
            detail: `${buyer.display_name} bought ${product.name} from ${seller.display_name}.`
          },
          {
            label: "Delivered",
            date: order.delivered_at,
            detail: `Order delivered through ${order.fulfilment_method}.`
          },
          {
            label: "Refund requested",
            date: order.delivered_at,
            detail: claim.refund_request_description
          },
          {
            label: "Seller rejected",
            date: order.delivered_at,
            detail: sellerResponse
          },
          {
            label: "Escalated to Carousell",
            date: order.dispute_window_deadline,
            detail: "Reviewer needs legitimacy analysis before deciding next action."
          }
        ]
      }];
    });
  }

  private buildGalleryImages(claim: Claim, allClaims: Claim[], product: Product): GalleryImage[] {
    const seen = new Set<string>();
    const images: GalleryImage[] = [];

    for (const image of claim.images) {
      if (seen.has(`claim:${image.filename}`)) continue;
      seen.add(`claim:${image.filename}`);
      images.push({
        id: image.image_id,
        filename: image.filename,
        label: "Current claim evidence",
        source: "claim",
        kind: "claim",
        metadata_status: image.metadata_status,
        capture_context: image.capture_context
      });
    }

    for (const relatedClaim of allClaims) {
      if (relatedClaim.id === claim.id || relatedClaim.order_id !== claim.order_id) continue;
      for (const image of relatedClaim.images) {
        if (seen.has(`claim:${image.filename}`)) continue;
        seen.add(`claim:${image.filename}`);
        images.push({
          id: image.image_id,
          filename: image.filename,
          label: `Same order evidence (${relatedClaim.id})`,
          source: "same_order_claim",
          kind: "claim",
          metadata_status: image.metadata_status,
          capture_context: image.capture_context
        });
      }
    }

    if (product.reference_image && !seen.has(`reference:${product.reference_image}`)) {
      images.push({
        id: `${product.id}-reference`,
        filename: product.reference_image,
        label: "Product reference image",
        source: "reference",
        kind: "reference"
      });
    }

    return images;
  }
}
