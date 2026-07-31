## 1. Update primitive colors

- [x] 1.1 Replace all `hsl()` entries in `primitiveColors` (`resources/app/theme/index.ts`) with Figma hex values (blue, brand, gray, green, orange, pink, red, violet, yellow tokens)
- [x] 1.2 Confirm pre-existing hex-only primitives (`neutralSurface`, `badgeDraft`, `buttonTertiary`, `optionHover`, `textMuted`, `textDark`, `settingsHover`, `placeholderSurface`, `borderAlt`, `galleryBorder`, `borderMuted`, `galleryHover`, `shippingBoxLight`, `shippingBoxMid`, `shippingBoxDark`) are unchanged
- [x] 1.3 Confirm Figma duplicate tokens are set correctly: `brand3`/`brand4` → `#C7DFFF`, `gray2`/`gray3` → `#F9F9FB`

## 2. Verify

- [x] 2.1 Inspect `:root` CSS variables in browser DevTools and confirm hex values match Figma export
- [x] 2.2 Visual QA: primary buttons (`brand1`/`brand2`), secondary fills (`brand3`–`brand5`), borders (`gray8`/`gray6`), text hierarchy (`gray15`/`gray13`/`gray12`), critical/success states (`red3`/`green6`)

## Reference: Figma hex values

```
blue1: #DCFBFF    blue2: #0078CE    blue3: #0055FF
brand1: #167BFF    brand2: #1670E7   brand3: #C7DFFF   brand4: #C7DFFF   brand5: #E3EFFF
gray1: #FFFFFF     gray2: #F9F9FB   gray3: #F9F9FB   gray4: #F6F5F9   gray5: #F3F3F7
gray6: #EEEDF3     gray7: #EBEAF0   gray8: #E4E3E9   gray9: #D2D1DB   gray10: #CBC9D5
gray11: #B3B1BF    gray12: #878593   gray13: #5F5D69   gray14: #4A4852  gray15: #323135  gray16: #1C1B1D
green1: #E3FFED    green3: #479769  green4: #338C58  green5: #28A745  green6: #1C7330
orange1: #FFF0D7   orange2: #5E4200
pink1: #FF4DDE     pink2: #FF10D3
red1: #FFE5E4      red2: #E98080    red3: #D40000
violet1: #EBE8FE   violet2: #9747FF  violet3: #F0EEFD
yellow1: #FEFFC5   yellow2: #4F4700
```
