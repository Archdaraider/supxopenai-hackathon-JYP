# Custom Claim Dataset Schema

This is the proposed behavioural-truth shape for the next dataset iteration. The goal is to model a Carousell dispute after buyer-seller disagreement, where a Carousell reviewer evaluates claim legitimacy.

The account, seller, order, and product records are treated as behavioural truth: fixed facts about account age, claim velocity, refund history, seller context, order context, and product context. Claim outcome labels are private evaluation targets, not truth shown to a reviewer.

## Core Entities

### Account / Buyer Profile

Required:
- `account_id`
- `display_name`
- `account_created_at`
- `user_profile_badge`
- `identity_verified`
- `recent_refund_claims`
- `total_orders`
- `total_refunds`

Recommended:
- `user_profile_meaning`
- `user_profile_reviewer_guidance`
- `successful_orders`
- `cancelled_orders`
- `claim_rate_90d`
- `refund_rate_lifetime`
- `prior_dispute_outcomes`
- `categories_claimed_before`
- `average_order_value_sgd`
- `seller_reports_count`
- `linked_accounts_hint`

### Seller Profile

Required:
- `seller_id`
- `display_name`
- `seller_type`
- `seller_created_at`
- `user_profile_badge`
- `identity_verified`

Recommended:
- `user_profile_meaning`
- `user_profile_reviewer_guidance`
- `seller_rating`
- `orders_last_90d`
- `disputes_last_90d`
- `damage_disputes_last_90d`
- `late_shipping_rate`
- `packaging_complaints_count`
- `category_specialization`

### Order

Required:
- `order_id`
- `buyer_account_id`
- `seller_id`
- `product_id`
- `ordered_at`
- `delivered_at`
- `fulfilment_method`

Recommended:
- `programme`
- `cart_id`
- `cart_item_count`
- `payment_method`
- `refund_type_requested`
- `refund_amount_requested_sgd`
- `return_required`
- `dispute_window_deadline`
- `tracking_status`
- `shipping_carrier`
- `same_order_claim_count`

### Product

Required:
- `product_id`
- `name`
- `category`
- `material`
- `price_sgd`
- `typical_failure_modes`

Recommended:
- `condition_listed`
- `listing_description`
- `listing_images`
- `fragility_level`
- `packaging_expectation`
- `known_counterfeit_or_abuse_risk`

### Refund Claim / Dispute

Required:
- `claim_id`
- `order_id`
- `buyer_account_id`
- `seller_id`
- `reason_category`
- `refund_request_description`
- `images`

Recommended:
- `seller_response`
- `buyer_seller_chat_excerpt`
- `escalated_at`
- `requested_resolution`
- `item_return_offered`
- `damage_timing_claimed`
- `packaging_damage_claimed`
- `item_damage_claimed`
- `metadata_status`
- `image_provenance_check`
- `expected_band`
- `expected_outcome_label`
- `scenario_role`

## Image Object

Each claim image should be represented explicitly rather than only as a filename.

```json
{
  "image_id": "IMG-C001-1",
  "filename": "plate_cracked_closeup.jpg",
  "role": "claim_evidence",
  "metadata_status": "stripped",
  "source": "buyer_upload",
  "capture_context": "close_up_item_damage",
  "quality": "clear",
  "notes": "No EXIF metadata retained in demo copy"
}
```

## Behavioural Truth Signals To Support

- Carousell user profile badge: `New User`, `Not Verified`, `Verified User`, `Verified Business`, `Certified Partner`, `Preferred Merchant`, or `Carousell Official`
- New account + high-value claim
- High refund rate
- Multiple recent claims
- Repeated claims in same category
- Multiple claims on same shipment, treated as logistics cluster
- Buyer requests partial refund with no return
- Seller has many similar packaging complaints
- Claim raised near or after dispute-window deadline
- Buyer description conflicts with seller response

## Recommended Labels

Use labels only in `_dev` or a separate private eval file:

- `expected_outcome_label`: `legitimate`, `fraudulent`, `ineligible`, `uncertain`
- `expected_band`: `Low`, `Elevated`, `High`
- `primary_signal`: `behavioural`, `image_reuse`, `synthetic_media`, `physical_plausibility`, `policy`, `evidence_gap`, `logistics_cluster`, `seller_fulfilment`
- `why`: short human-readable explanation

Never expose these labels to the model call or reviewer UI.
