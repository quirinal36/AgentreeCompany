# Higgsfield MCP Live 조회 결과

조사일: 2026-07-06 23:30 KST
작성자: Purple / ContentsTeam
상태: Purple 세션에서 MCP 도구 직접 호출하여 실제 응답 payload 확보 완료

---

## 1. Credential 상태

| 항목 | 값 |
|---|---|
| api_key_configured | true |
| secret_configured | true |
| api_key_preview | `1df8b3f3...` |
| base_url | https://platform.higgsfield.ai |

**결론**: Purple 프로필의 Higgsfield API 키와 secret 모두 정상 설정되어 있으며, MCP 호출이 정상 작동한다.

---

## 2. Characters

- 조회 결과: **0개**
- 아직 생성된 character reference가 없음. 필요 시 `mcp_higgsfield_create_character`로 1~5장의 얼굴 이미지를 업로드하여 생성 가능 (비용: 40 credits / $2.50)

---

## 3. Style Presets (Soul 모델용)

- 총 **106개** 스타일 확보
- 조회 tool: `mcp_higgsfield_list_styles()`
- 사용처: `mcp_higgsfield_generate_image`의 optional `style_id` 파라미터

### 3.1 전체 스타일 목록

| # | style_id (축약) | name | description |
|---|---|---|---|
| 1 | `b3c8075a` | Creatures | Animalistic details fused with human edge, strange, eerie and beautiful |
| 2 | `1fc861ed` | Medieval | Chainmail chic, velvet drapes, and candlelit intrigue. Courtly vibes with cinematic weight |
| 3 | `40ff999c` | Spotlight | Direct light creating high-contrast drama, paparazzi flash, and instant icon energy |
| 4 | `a5f63c3b` | Giant People | 과장된 스케일의 인물 |
| 5 | `3de71b9e` | Red balloon | 빨간 풍선 모티브 |
| 6 | `91abc4fe` | green editorial | 그린 에디토리얼 톤 |
| 7 | `d2e8ba04` | Subway | 지하철 배경 |
| 8 | `6fb3e1f5` | Library | Soft indoor lighting meets cozy academia. Perfect for quiet power, timeless knits |
| 9 | `1cb4b936` | Realistic | No filters, just flawless clarity. Light, pores, fabric—everything exactly as it is, but better |
| 10 | `ca4e6ad3` | DigitalCam | Harsh flash, timestamp corner, and raw textures. Feels like 2007 captured forever |
| 11 | `255f4045` | Grillz Selfie | Flash-heavy close-up of shiny teeth, with grills, bold attitude, underground luxury |
| 12 | `cc099663` | Bleached Brows | Barely-there brows, futuristic face. A blank canvas for bold energy and alien glam |
| 13 | `7696fd45` | Sitting on the Street | Laid-back pose meets city grit. Candid, cool, and consciously unbothered |
| 14 | `34c50302` | PixeletedFace | Retro-glitch vibe with a pixelated face—playful, edgy, early-internet dream |
| 15 | `d3e2b71d` | Crossing the street | Boss walk energy. Overhead angles, harsh midday shadows, stolen from a fashion mag |
| 16 | `4c24b43b` | Angel Wings | Soft look with delicate wings giving dreamy and weightless |
| 17 | `88126a43` | Duplicate | Echoed figures, mirrored forms, or repeated poses-surreal symmetry that bends perception |
| 18 | `ff1ad8a2` | Quiet luxury | 절제된 럭셔리 룩 |
| 19 | `373420f7` | Fireproof | 불/연기 내성적 비주얼 |
| 20 | `524be50a` | Elevator Mirror | 엘리베이터 거울 셀카 |
| 21 | `294bb3ee` | 360 cam | Wrap-around perspective with immersive distortion. Captures everything-warped, wide, wonderfully weird |
| 22 | `62355e77` | Glitch | Pixel drag, color distortion, and digital noise. Beautiful errors in motion |
| 23 | `86fc814e` | FashionShow | Backstage flashes, bold looks, and runway energy—where chaos meets couture |
| 24 | `bc00b419` | Sunbathing | Clear turquoise water, woven bags, towel texture, and heat-soaked skin |
| 25 | `7fa63380` | Paper Face | Face collaged from torn paper, textures, and cutouts-raw edges meet artistic expression |
| 26 | `f5c094c7` | 90s Grain | Warm tones, film texture, and a soft blur—retro mood in every pixel |
| 27 | `372cc37b` | Geominimal | Clean lines, geometric overlays. Sharp, modern, minimalist settings |
| 28 | `0fe8ad66` | Foggy Morning | Muted colors, blurred horizons, and quiet light. Dreamlike stillness in early hours |
| 29 | `d8a35238` | Overexposed | Washed-out whites, crushed detail, and intense brightness. Raw, emotional, unfiltered |
| 30 | `26241c54` | Sunset beach | Golden-hour dreams. Glowy skin, backlit outlines, luxury vacation stillness |
| 31 | `70fbb531` | Giant Accessory | One item exaggerated to surreal scale—bags, bows, or earrings blown up for visual drama |
| 32 | `9de8ed26` | RingSelfie | Manicured hands, glossy lips, and a flash that catches the sparkle |
| 33 | `a13917c7` | Street view | 거리 배경 |
| 34 | `710f9073` | 90's Editorial | Retro fashion magazine style image with film grain, soft blur, moody colors, pure nostalgia |
| 35 | `c7ea4e7a` | Rhyme & blues | R&B 감성 |
| 36 | `181b3796` | 2000s Cam | Low-rise everything, rhinestones, and visible thongs. Nostalgia wrapped in early paparazzi glam |
| 37 | `07a85fb3` | CCTV | Grainy surveillance vibe. Raw, unfiltered and highly realistic |
| 38 | `71fecd8c` | 0.5 Outfit | Shot from the waist down with wide-angle distortion. Casual, candid, effortlessly cool |
| 39 | `dab472a6` | Amalfi Summer | Lemon light, sunkissed skin, linen dresses fluttering on cobblestone—luxury by the sea |
| 40 | `f96913e8` | Bimbocore | Hyperfeminine overload: glossed lips, tiny skirts, confidence cranked to 100 |
| 41 | `8dd89de9` | 0.5 Selfie | Front cam, half-body, mirror or not. Unfiltered fits and real-life lighting—authentic |
| 42 | `ba3d7634` | Sand | Sculptural silhouettes in windswept dunes. Neutral tones, survivalist edge—high fashion in dust |
| 43 | `83caff04` | Vintage PhotoBooth | Flash-lit nostalgia in strip form. Grain, glare, and a kiss of chaos |
| 44 | `5765d07d` | afterparty cam | 애프터파티 감성 |
| 45 | `b7c621b5` | Babydoll MakeUp | Fluttery lashes, pouty lips, and porcelain skin—sweet meets surreal |
| 46 | `1900111a` | Through The Glass | Shot behind fogged-up windows or café panes. A quiet moment seen, not staged |
| 47 | `36061eb7` | Gallery | Neutral walls, high taste. Your subject framed like a work of art—minimal, polished, modern |
| 48 | `7df83cc9` | Eating Food | 음식 먹는 모습 |
| 49 | `5b6f467e` | Swords Hill | High fantasy on a mountain slope. Capes, steel, wind-blown drama—part legend, part editorial |
| 50 | `e454956b` | Office beach | Corporate meets coastal. Suits and sand, spreadsheets with sunglasses—chaotic and sun-bleached |
| 51 | `5ad23bca` | Help It's Too Big | 과장된 사이즈 |
| 52 | `0089e17c` | Japandi | Minimalism with warmth. Clean lines, natural light, serene sense of balance |
| 53 | `1b798b54` | iPhone | Natural light, casual framing, soft HDR glow. Looks real, but a little better |
| 54 | `96758335` | Gorpcore | Function becomes fashion. Technical fabrics, bulky sneakers, colorblocked gear |
| 55 | `5a72fec7` | Indie sleaze | Flash-lit chaos, smudged eyeliner, and blurry rebellion. Tumblr-era nightlife |
| 56 | `7f21e7bd` | Fairycore | Glittery woodland fantasy. Soft pastels, magical sparkles, enchanted innocence |
| 57 | `0367d609` | Tumblr | Grainy gifs, soft blur, and blue-toned melancholy—effortlessly curated and emotionally charged |
| 58 | `0c636e12` | Avant-garde | Sculptural beauty, unexpected forms. A look that speaks in bold shapes and silent statements |
| 59 | `ea6f4dc0` | HairClips | Chunky, colorful, or pearl-lined—accessories that turn heads and frame the face |
| 60 | `2d47f079` | birthday mess | 생일 파티 분위기 |
| 61 | `493bda5b` | Clouded Dream | 몽환적 분위기 |
| 62 | `cbefda85` | Y2K Posters | Chrome text, airbrushed skin, and floating objects. Early internet meets teen bedroom wall |
| 63 | `ce9a88c2` | tokyo drift | 도쿄 드리프트 감성 |
| 64 | `b7908955` | Object Makeup | Collage-style layers. An object below, makeup above, colors duplicated for surreal editorial |
| 65 | `0b4dac9a` | Graffiti | Spray textures, bold lines, and rebellious color. Raw energy in every frame |
| 66 | `e439bd89` | Sunburnt | 햇볕에 탄 피부 |
| 67 | `a643a36a` | hallway noir | 복도 느와르 |
| 68 | `facaafeb` | 2000s Fashion | Flashy fits, shiny textures, and Y2K icons—low-rise, high-attitude, totally throwback |
| 69 | `62ba1751` | Night Beach | Moonlit waves, dark silhouettes, and salt in the air. Intimate and a little unreal |
| 70 | `811de7ab` | Movie | 영화적 분위기 |
| 71 | `12eda704` | Long legs | Elongated limbs and stretched proportions. Stylized drama with a runway edge |
| 72 | `5659c554` | 7\ | Distorted realism of Aphex Twin with eerie edits, glitch vibes, cult-classic weirdness |
| 73 | `464ea177` | General | Clean, balanced, and natural—your go-to look with true-to-life colors and soft lighting |
| 74 | `4b66c2db` | Nail Check | Close-up hands showing off nail art, rings, and textures. Precision beauty with attitude |
| 75 | `bd78cfc6` | Coquette core | Soft focus and lace daydreams. Bows, blush, and a wink—sweetness laced with irony |
| 76 | `2fcf02e2` | Mixed Media | Layers of photo, paint, text, and texture. A visual collage with chaotic elegance |
| 77 | `d24c016c` | Selfcare | Candles, skincare, robes. Glowing peace in muted tones and soft light |
| 78 | `ad9de607` | Grunge | Distressed denim, oversized flannel, and don't-care hair. Moody, messy, iconic |
| 79 | `2a1898d0` | Double take | 더블 테이크 |
| 80 | `673cf0d4` | 505room | 505호실 감성 |
| 81 | `3f90dc5b` | Flight mode | Airports, terminals—modern architecture, clean lines, "main character leaves town" aura |
| 82 | `bab6e4bd` | Escalator | Gliding style in motion. Mall paparazzi look—structured outfits, steel gradients |
| 83 | `84c23cef` | burgundy suit | 버건디 수트 |
| 84 | `cc4e7248` | Fisheye | Exaggerated depth and playful proportions. Face or object up close, background stretched |
| 85 | `30458874` | Shoe Check | Footwear focus, often captured from top-down or ground-level angle |
| 86 | `53bdadfa` | Rainy Day | Moody skies, reflections in wet pavement, soft sweaters. Slow, cinematic quiet |
| 87 | `de0118ba` | Mt. Fuji | Postcard surrealism. Crystal-blue skies, iconic mountain symmetry, convenience store drama |
| 88 | `71ac929c` | Sea breeze | 바다 바람 |
| 89 | `82edba1e` | Invertethereal | Negative tones and ghostly hues. Dreamlike, eerie, and light turned inside out |
| 90 | `6b9e6b4d` | Y2K | Gloss, glitter, and baby tees. A shiny reboot of early 2000s maximalism |
| 91 | `99de6fc5` | Tokyo Streetstyle | Layered looks, sharp silhouettes, and fearless color. Street-level runway of innovation |
| 92 | `5e01339d` | chrome exit | 크롬 느낌 |
| 93 | `1fba888b` | Night rider | 나이트 라이더 |
| 94 | `b9e2d7dc` | Artwork | Framed moments with painterly depth. A still life of emotion, texture, and light |
| 95 | `a2a42ada` | Glazed doll skin makeup | Glass-like skin with high-shine finish. Dewy, doll-like, flawlessly unreal |
| 96 | `3c975998` | mount view | 산 전망 |
| 97 | `53959c8a` | 2049 | SF 미래 |
| 98 | `f8dac072` | blackout fit | 올블랙 룩 |
| 99 | `90df2935` | Bike mafia | 바이크 마피아 |
| 100 | `fb9cee2b` | static glow | 스태틱 글로우 |
| 101 | `5dbb6a20` | Nicotine glow | 니코틴 글로우 |
| 102 | `f3968a4f` | brick shade | 벽돌 느낌 |
| 103 | `923e4fb0` | dmv | DMV 감성 |
| 104 | `d4775423` | Fish-eye twin | 피시아이 트윈 |
| 105 | `79bfaa63` | It's french | 프렌치 감성 |
| 106 | `aed71142` | cocktail | 칵테일 |

### 3.2 추천 스타일 (블로그/콘텐츠 용도별)

| 용도 | style_id | 이름 | 이유 |
|---|---|---|---|
| 범용/기본 | `464ea177-8d40-4940-8d9d-b438bab269c7` | General | 깨끗하고 균형 잡힌 자연스러운 룩 |
| 사실적 인물 | `1cb4b936-77bf-4f9a-9039-f3d349a4cdbe` | Realistic | 무필터, 선명한 디테일 |
| 감성적/몽환 | `493bda5b-bb4b-46fe-9343-7d5e414534ef` | Clouded Dream | 몽환적 분위기 |
| 전문적/미니멀 | `0089e17c-d0f0-4d0c-b522-6d25c88a29fc` | Japandi | 미니멀리즘 + 따뜻함 |
| 패션/에디토리얼 | `710f9073-f580-48dc-b5c3-9bbc7cbb7f37` | 90's Editorial | 레트로 패션 매거진 스타일 |
| 시네마틱 | `811de7ab-7aaf-4a6b-b352-cdea6c34c8f1` | Movie | 영화적 분위기 |
| 빈티지/노스탤지어 | `f5c094c7-4671-4d86-90d2-369c8fdbd7a5` | 90s Grain | 필름 그레인, 소프트 블러 |
| 글리치/실험적 | `62355e77-7096-45ae-9bea-e7c5b88c3b70` | Glitch | 픽셀 드래그, 디지털 노이즈 |
| 자연/야외 | `26241c54-ed78-4ea7-b1bf-d881737c9feb` | Sunset beach | 골든아워, 백라이트 |
| 도시/스트리트 | `99de6fc5-1177-49b9-b2e9-19e17d95bcaf` | Tokyo Streetstyle | 레이어드 룩, 대담한 컬러 |

---

## 4. Motion Presets (DoP 비디오 모델용)

- 총 **121개** 모션 확보
- 조회 tool: `mcp_higgsfield_list_motions()`
- 사용처: `mcp_higgsfield_generate_video`의 필수 `motion_id` 파라미터
- `start_end_frame`: true=시작/끝 프레임 명시 필요, false=프레임 불필요

### 4.1 전체 모션 목록

| # | motion_id (축약) | name | description | SEF |
|---|---|---|---|---|
| 1 | `ea035f68` | 360 Orbit | Camera smoothly circles all around subject | ✓ |
| 2 | `2bae49e6` | 3D Rotation | Subject spins 360° for product/fashion showcase | ✓ |
| 3 | `7f8971a6` | Abstract | Unusual shapes, shifting colors, surreal | — |
| 4 | `dc8d7d9c` | Action Run | Fast-paced chase motion, shaky cam, dynamic angles | ✓ |
| 5 | `65b0a5a3` | Agent Reveal | Head glitch-morph into agent figure | ✓ |
| 6 | `d21ff628` | Angel Wings | Wings spreading behind shoulders | — |
| 7 | `c5881721` | Arc Left | Camera curves left around subject | ✓ |
| 8 | `a85cb3f2` | Arc Right | Camera curves right around subject | ✓ |
| 9 | `ab0fa3d8` | Baseball Kick | Powerful baseball-style kick | ✓ |
| 10 | `1b4c1b9a` | Basketball Dunks | Jump and slam basketball | ✓ |
| 11 | `161d2898` | Black Tears | Dark liquid streaming from eyes | ✓ |
| 12 | `4a79cff8` | Bloom Mouth | Petals/flower instead of tongue | — |
| 13 | `4ac80533` | Boxing | Quick jabs, hooks, head movement | ✓ |
| 14 | `a652ae99` | Buckle Up | Low angle through glass floor | ✓ |
| 15 | `cb8cfb5a` | Building Explosion | Building erupts in massive blast | ✓ |
| 16 | `22d7c60a` | Bullet Time | Freeze action, camera moves around | ✓ |
| 17 | `b98810ad` | Car Chasing | High-speed chase scenes | ✓ |
| 18 | `0235b1a9` | Car Explosion | Car bursts into flames | ✓ |
| 19 | `b3fd6f79` | Car Grip | Camera attached to car | ✓ |
| 20 | `0e339850` | Catwalk | Confident runway walk, fashion energy | ✓ |
| 21 | `fd6272d6` | Clone Explosion | Subject splits into multiple copies bursting outward | ✓ |
| 22 | `b26dcbe5` | Crane Down | Lowers camera from above | ✓ |
| 23 | `0d736605` | Crane Over The Head | Camera rises above subject | ✓ |
| 24 | `68af9add` | Crane Up | Lifts camera upward | ✓ |
| 25 | `3ec247ed` | Crash Zoom In | Quick zoom into subject | ✓ |
| 26 | `3f7a86be` | Crash Zoom Out | Rapid zoom out | ✓ |
| 27 | `e3112849` | Datamosh | Glitchy pixel bleed/smear effect | ✓ |
| 28 | `81d6b1c4` | Diamond | Body transforms into sparkling diamond | ✓ |
| 29 | `29168a2c` | Dirty Lens | Smudges, dust, water drops on lens | ✓ |
| 30 | `97ffe32a` | Disintegration | Subject breaks into particles/dust | ✓ |
| 31 | `81ca2cd2` | Dolly In | Camera moves toward subject | ✓ |
| 32 | `71f0f8bc` | Dolly Left | Camera tracks left | ✓ |
| 33 | `12ac8798` | Dolly Out | Camera pulls away from subject | ✓ |
| 34 | `15ddc007` | Dolly Right | Camera tracks right | ✓ |
| 35 | `f0ca4e62` | Dolly Zoom In | Forward + zoom out (Vertigo effect) | ✓ |
| 36 | `2df82f5f` | Dolly Zoom Out | Backward + zoom in | ✓ |
| 37 | `bd133fba` | Double Dolly | Camera + subject move together, floating effect | ✓ |
| 38 | `381fcf9a` | Downhill POV | Fast first-person downhill ride | ✓ |
| 39 | `1d21b411` | Duplicate | Multiple identical copies appear | ✓ |
| 40 | `915d6b95` | Dutch Angle | Tilted horizon for tension | ✓ |
| 41 | `46fa79e3` | Earth Zoom Out | Pull back to reveal Earth | ✓ |
| 42 | `0c5d9955` | Eyes In | Close-up to subject's eyes | ✓ |
| 43 | `d6772bfc` | Face Punch | Explosive punch to the face | ✓ |
| 44 | `eeb51fed` | Fire Breathe | Exhales burst of flames | — |
| 45 | `ec365c4d` | Fisheye | Wide distorted lens look | ✓ |
| 46 | `ca339f47` | Floating Fish | Fish swims around subject | — |
| 47 | `6597fc71` | Flood | Water spreads, rises, dominates | — |
| 48 | `f0426395` | Floral Eyes | Flowers blossom from face | — |
| 49 | `1d5ee550` | Flying | Smooth gliding flight | ✓ |
| 50 | `797e27b5` | Focus Change | Shift focus between subjects | ✓ |
| 51 | `7673d9e0` | FPV Drone | First-person drone flight | ✓ |
| 52 | `9390496c` | Freezing | Subject turns to ice | ✓ |
| 53 | `60049b87` | Garden Bloom | Body enveloped in flowers | — |
| 54 | `31177282` | General | Balanced, all-purpose camera | ✓ |
| 55 | `a2046ff7` | Glam | High-speed camera, epic slow-motion | ✓ |
| 56 | `cb3d5fee` | Glowing Fish | Bioluminescent fish around subject | — |
| 57 | `f2db4c02` | Glowshift | Magical light transformation | ✓ |
| 58 | `5be9d262` | Handheld | Natural shaky camera, raw feel | ✓ |
| 59 | `92141609` | Head Explosion | Head bursts in particles/fire | ✓ |
| 60 | `d57404a2` | Head Off | Head detaches and floats | — |
| 61 | `d38d2084` | Head Tracking | Camera locked to head movement | ✓ |
| 62 | `aebcaa0d` | Hyperlapse | Moving timelapse through space | ✓ |
| 63 | `cff69c3b` | Incline | World tilted at steep angle | ✓ |
| 64 | `7c01086d` | Innerlight | Radiant glow from within | — |
| 65 | `6fdc8fa8` | Invisible | Subject vanishes completely | ✓ |
| 66 | `c5b339cd` | Jelly Drift | Glowing jellyfish float behind | — |
| 67 | `2ce412eb` | Jib Down | Camera moves gently downward | ✓ |
| 68 | `cc5d4b42` | Jib Up | Camera lifts smoothly upward | ✓ |
| 69 | `83a8902b` | Kiss | Intimate kiss with soft focus | ✓ |
| 70 | `ce9dc38e` | Lazy Susan | Camera rotates around still subject | ✓ |
| 71 | `080dd954` | Lens Crack | Cracked lens with fractures | ✓ |
| 72 | `e98b3fee` | Lens Flare | Bright streaks from light | ✓ |
| 73 | `0a5a48d7` | Levitation | Subject floats off ground | ✓ |
| 74 | `790ca797` | Low Shutter | Motion blur by lowering shutter | ✓ |
| 75 | `473fd7e0` | Medusa Gorgona | Body hardens to stone | ✓ |
| 76 | `eb3b0cd9` | Melting | Subject melts under heat | ✓ |
| 77 | `70f3014c` | Moonwalk Left | Classic gliding move left | ✓ |
| 78 | `cf8c7490` | Moonwalk Right | Gliding backward right | ✓ |
| 79 | `8968b3f5` | Morphskin | Body morphs into new identity | ✓ |
| 80 | `21bbd0c4` | Mouth In | Zoom into character's mouth | ✓ |
| 81 | `b29cff3b` | Object POV | Scene from object's point of view | ✓ |
| 82 | `40245735` | Overhead | Camera above tracking movement | ✓ |
| 83 | `aa8d80db` | Paint Splash | Subject bursts into liquid paint | — |
| 84 | `556ab276` | Paparazzi | Flashes burst around subject | ✓ |
| 85 | `7aa6fbad` | Powder Explosion | Colorful powder burst around subject | ✓ |
| 86 | `30a02896` | Push To Glass | Subject pushed against glass | ✓ |
| 87 | `c3dbf04b` | Rap Flex | Iconic rap video camera moves | ✓ |
| 88 | `153afe86` | Robo Arm | High-speed robotic camera | ✓ |
| 89 | `c718443d` | Roll Transition | Scene spins like rolling wheel | ✓ |
| 90 | `ba778a3b` | Sand Storm | Powerful sand blast through scene | ✓ |
| 91 | `3f003f41` | Set on Fire | Subject bursts into flames | ✓ |
| 92 | `26864aa2` | Skateboard Glide | Smooth flowing board motion | ✓ |
| 93 | `023bf31f` | Skateboard Ollie | Classic jump without hands | ✓ |
| 94 | `2bf184fb` | Skate Cruise | Relaxed riding through streets | ✓ |
| 95 | `9015dd00` | Ski Carving | Clean fast turns on slope | ✓ |
| 96 | `8c8f12b1` | Skin Surge | Objects emerge from skin | ✓ |
| 97 | `e65a92e6` | Ski Powder | Skier cutting through deep snow | ✓ |
| 98 | `984834d9` | Snorricam | Disorienting body-mounted camera | ✓ |
| 99 | `f933ee1b` | Snowboard Carving | Deep controlled turns | ✓ |
| 100 | `f6fdf448` | Snowboard Powder | Floating through fresh powder | ✓ |
| 101 | `87d67a56` | Soul Jump | Soul visibly leaves body | ✓ |
| 102 | `fa3ddb7c` | Static | Camera completely still | ✓ |
| 103 | `b604bd5f` | Super 8MM | Grainy texture, warm faded tones | — |
| 104 | `3a24a20d` | Super Dolly In | Smooth camera toward subject | ✓ |
| 105 | `679c128d` | Super Dolly Out | Smooth camera away from subject | ✓ |
| 106 | `20a5fdc3` | Tentacles | Tentacles emerge from eyes | ✓ |
| 107 | `ebf152b3` | Through Object In | Camera through object toward subject | ✓ |
| 108 | `ea0d11ac` | Through Object Out | Camera out through object | ✓ |
| 109 | `27169770` | Thunder God | Eyes glow with electric energy | ✓ |
| 110 | `ff67b0eb` | Tilt Down | Camera angle rotates downward | ✓ |
| 111 | `2c9af101` | Tilt up | Camera moves upward | ✓ |
| 112 | `9463e9ef` | Timelapse Human | Speed up human motion | ✓ |
| 113 | `130b5a9d` | Timelapse Landscape | Rapid natural element movement | ✓ |
| 114 | `3e735d99` | Turning Metal | Body transforms to metallic | ✓ |
| 115 | `2b7c1db3` | VHS | Faded colors, static noise, scan lines | — |
| 116 | `25c72c28` | Whip Pan | Fast blurring camera pan | ✓ |
| 117 | `8a660d27` | Wiggle | Shaky wiggle + smooth zoom | ✓ |
| 118 | `e8027924` | Wind to Face | Intense wind blasts subject | ✓ |
| 119 | `bd639dee` | YoYo Zoom | Rapid in-and-out zoom | ✓ |
| 120 | `fbcbec5b` | Zoom In | Gradually moves closer to subject | ✓ |
| 121 | `263600e4` | Zoom Out | Gradually pulls back from subject | ✓ |

### 4.2 추천 모션 (콘텐츠 용도별)

| 용도 | motion_id | 이름 | 설명 |
|---|---|---|---|
| 기본/범용 | `31177282-bde3-4870-b283-1135ca0a201a` | General | 균형 잡힌 자연스러운 카메라 |
| 패션/제품 쇼케이스 | `2bae49e6-ffe7-42a8-a73f-d44632c4acaa` | 3D Rotation | 피사체 360° 회전 |
| 시네마틱 드라마 | `ea035f68-b350-40f1-b7f4-7dff999fdd67` | 360 Orbit | 카메라가 주변을 완전히 한 바퀴 |
| 카메라 심도 | `81ca2cd2-05db-4222-9ba0-a32e5185adfb` | Dolly In | 카메라가 주제로 천천히 접근 |
| 공간감 확대 | `12ac8798-5370-4801-91a6-f1acb425fc4a` | Dolly Out | 카메라가 뒤로 물러나며 장면 드러냄 |
| 감성적 노스탤지어 | `b604bd5f-22eb-4920-ad7e-47306805d7c6` | Super 8MM | 60~70년대 홈무비 질감 |
| 빈티지 레트로 | `2b7c1db3-862a-4373-8435-ae4464ae5892` | VHS | 80~90년대 비디오테이프 감성 |
| 글램/슬로우모션 | `a2046ff7-26fc-4d97-aab7-54bbb55fca97` | Glam | 고속 카메라 에픽 슬로우모션 |
| 액션/에너지 | `25c72c28-7857-4aa0-af92-ba5380f0e67d` | Whip Pan | 빠른 블러 패닝 전환 |
| 몽환적/초현실 | `0a5a48d7-6716-41a4-9a9f-7ad9229c879b` | Levitation | 피사체가 공중에 떠오름 |
| 고요함/정적 | `fa3ddb7c-53ee-4383-aa17-97ae65f180e5` | Static | 카메라 고정, 흔들림 없음 |

---

## 5. 원본 JSON (참고용)

### 5.1 debug_credentials

```json
{
  "api_key_configured": true,
  "secret_configured": true,
  "api_key_preview": "1df8b3f3...",
  "base_url": "https://platform.higgsfield.ai"
}
```

### 5.2 list_characters (빈 결과)

```json
{"success": true, "total": 0, "characters": [], "message": "Found 0 character reference(s)"}
```

> 참고: styles(106개)와 motions(121개)의 전체 JSON은 본 문서의 표에 포함되었으므로 별도 생략한다.

---

## 6. 검증 완료 사항

| 검증 항목 | 결과 |
|---|---|
| `debug_credentials` 호출 | ✅ api_key + secret 모두 configured, base_url 정상 |
| `list_styles` 호출 | ✅ 106개 스타일 확보, style_id/name/description/preview_url 모두 존재 |
| `list_motions` 호출 | ✅ 121개 모션 확보, motion_id/name/description/preview_url/start_end_frame 모두 존재 |
| `list_characters` 호출 | ✅ 0개 (정상 — 아직 생성된 캐릭터 없음) |
| 비용 소모 | ✅ $0 (모든 호출이 무료 조회 전용) |

---

## 7. Nana 보고서 대비 신규 확보 정보

| 항목 | Nana 보고서 상태 | Purple Live 결과 |
|---|---|---|
| list_styles 실제 payload | "미확보" | ✅ 106개 전체 확보 |
| list_motions 실제 payload | "미확보" | ✅ 121개 전체 확보 |
| list_characters | "미확보" | ✅ 0개 (정상) |
| debug_credentials | "추측" | ✅ 정상 작동 확인 |