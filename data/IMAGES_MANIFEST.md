# Image Manifest - Custom Claim Dataset

Every buyer-submitted claim image in `data/images/claims/` is used exactly once. There is no duplicate claim-image reuse scenario in this dataset. Reference images in `data/images/reference/` are listing/reference assets, not buyer uploads.

## Claim images

| Filename | Claim | Product | Expected band | Scenario |
|---|---|---|---|---|
| `mug_print_smudged.jpg` | C001 | P004 | Low | clean buyer; visible print-quality issue is plausible and low value |
| `frame_shattered.jpg` | C002 | P006 | Elevated | new account with repeat claims; damage appears plausible so behaviour only should not force High |
| `visor_scratched_wrong_color.jpg` | C003 | P002 | Low | established buyer with plausible condition mismatch |
| `skincare_packaging_damaged.jpg` | C004 | P003 | Low | clean account; packaging issue may need policy review but not integrity escalation |
| `skincare_boxes_cracked.jpg` | C005 | P003 | Elevated | high refund rate and partial-refund request; image is unique so no hard image-reuse flag |
| `calcifer_broken.jpg` | C006 | P010 | Low | established collector; fragile ceramic break is plausible |
| `plastic_container_side_crack.jpg` | C007 | P005 | Low | same shipment cluster should route to logistics/fulfilment |
| `plastic_container_lid_crack_closeup.jpg` | C008 | P005 | Low | same shipment cluster should lower buyer-integrity risk |
| `plastic_container_lid_crack_blurry.jpg` | C009 | P005 | Low | same shipment cluster plus evidence sufficiency issue |
| `glass_frame_shattered_handheld.jpg` | C010 | P006 | Elevated | new account with high claim velocity; plausible damage but missing packaging context |
| `glass_frame_shattered_packaging.jpg` | C011 | P006 | Low | established buyer; fragile item transit damage is plausible |
| `usb_hub_port_cracked.jpg` | C012 | P007 | Elevated | new account with repeated electronics claims and no hard image signal |
| `usb_hub_connector_broken.jpg` | C013 | P007 | Low | clean buyer; connector break is plausible |
| `monitor_packaging_cracked.jpg` | C014 | P008 | Elevated | new account and high-value item; plausible LCD damage so request evidence rather than High |
| `monitor_office_cracked.jpg` | C015 | P008 | Elevated | risky account and high-value electronics claim |
| `monitor_desktop_cracked.jpg` | C016 | P008 | Elevated | supporting evidence for risky monitor dispute; unique image, no reuse |
| `ssl2_broken.jpg` | C017 | P009 | High | high-value item; physical plausibility should be questioned because aluminium usually dents or scuffs rather than cracking radially |
| `shirt_black_sleeve_rip.jpg` | C018 | P001 | Low | established buyer; textile tear is plausible |
| `backpack_torn.jpg` | C019 | P011 | Low | established buyer; seam tear plausible |
| `shirt_torn.jpg` | C020 | P001 | Low | clean buyer; plausible apparel damage |
| `visor_lens_scratch.jpg` | C021 | P002 | Elevated | repeat claims and accessory dispute; plausible damage |
| `skincare_jar_cracked_closeup.jpg` | C022 | P003 | Low | established buyer; cracked plastic jar plausible |

## Reference images

| Filename | Product | What it represents |
|---|---|---|
| `shirt_intact.jpg` | P001 | Long-Sleeve Cotton Shirt |
| `ssl2_intact.jpg` | P009 | Solid State Logic SSL 2 USB Audio Interface |
| `calcifer_intact.jpg` | P010 | Calcifer Ceramic Figurine |
| `backpack_intact.jpg` | P011 | Nylon Commuter Backpack |
