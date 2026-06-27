# Custom Canonical Dataset

This dataset replaces the original image-reuse demo set. It models Carousell refund disputes after buyer-seller disagreement escalates to a Carousell reviewer.

## Rules

- Every claim image in `data/images/claims/` is used once.
- There is no image-reuse fraud scenario.
- Claim image metadata status is represented as `metadata_status: stripped`.
- Behavioural truth lives in the account, order, seller, and product records. These are the fixed facts the scorer should reason from.
- Carousell profile indicators are represented with `user_profile_badge`, `identity_verified`, `user_profile_meaning`, and `user_profile_reviewer_guidance`.
- Private expected outcome labels live only in `_dev` and must not be exposed to model calls or reviewer UI.
- Behavioural context, policy context, evidence sufficiency, physical plausibility, and optional synthetic-media/provenance checks are the intended signals.

## Active claims

| Claim | Account | Product | Image | Expected band | Private outcome |
|---|---|---|---|---|---|
| C001 | A001 | P004 | `mug_print_smudged.jpg` | Low | legitimate |
| C002 | A002 | P006 | `frame_shattered.jpg` | Elevated | fraudulent |
| C003 | A003 | P002 | `visor_scratched_wrong_color.jpg` | Low | legitimate |
| C004 | A004 | P003 | `skincare_packaging_damaged.jpg` | Low | legitimate |
| C005 | A005 | P003 | `skincare_boxes_cracked.jpg` | Elevated | fraudulent |
| C006 | A006 | P010 | `calcifer_broken.jpg` | Low | legitimate |
| C007 | A007 | P005 | `plastic_container_side_crack.jpg` | Low | legitimate |
| C008 | A007 | P005 | `plastic_container_lid_crack_closeup.jpg` | Low | legitimate |
| C009 | A007 | P005 | `plastic_container_lid_crack_blurry.jpg` | Low | legitimate |
| C010 | A008 | P006 | `glass_frame_shattered_handheld.jpg` | Elevated | fraudulent |
| C011 | A009 | P006 | `glass_frame_shattered_packaging.jpg` | Low | legitimate |
| C012 | A010 | P007 | `usb_hub_port_cracked.jpg` | Elevated | fraudulent |
| C013 | A011 | P007 | `usb_hub_connector_broken.jpg` | Low | legitimate |
| C014 | A012 | P008 | `monitor_packaging_cracked.jpg` | Elevated | fraudulent |
| C015 | A013 | P008 | `monitor_office_cracked.jpg` | Elevated | fraudulent |
| C016 | A013 | P008 | `monitor_desktop_cracked.jpg` | Elevated | fraudulent |
| C017 | A014 | P009 | `ssl2_broken.jpg` | High | fraudulent |
| C018 | A015 | P001 | `shirt_black_sleeve_rip.jpg` | Low | legitimate |
| C019 | A016 | P011 | `backpack_torn.jpg` | Low | legitimate |
| C020 | A017 | P001 | `shirt_torn.jpg` | Low | legitimate |
| C021 | A019 | P002 | `visor_lens_scratch.jpg` | Elevated | fraudulent |
| C022 | A020 | P003 | `skincare_jar_cracked_closeup.jpg` | Low | legitimate |
