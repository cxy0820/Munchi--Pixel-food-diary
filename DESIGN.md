# Design

## System Overview
Munchi is a product UI with a warm pixel scrapbook personality. The app uses restrained product structure with soft lifestyle details: Dusty Rose primary actions, cream paper surfaces, matcha and lavender secondary accents, and warm 16-bit food item stickers.

## Color
- Background: warm cream, used lightly and with enough contrast.
- Surface: clean white and pale paper panels.
- Primary accent: Dusty Rose, replacing all previous orange usage.
- Supporting accents: peach, matcha green, butter yellow, soft coral, and muted lavender.
- Ink: deep plum-brown for readable text.

## Typography
Use a single system sans stack for all UI. Headings are confident but compact; labels, data, buttons, and form controls stay familiar and legible.

## Components
- App shell: desktop content frame and mobile bottom navigation.
- Cards: no nested decorative cards; cards frame records, settings rows, upload panels, and collage controls.
- Pixel stickers: AI-generated food item icons shown with white border, soft shadow, optional rotation, and tactile drag affordances.
- Forms: clear labels, stable input sizes, visible focus, and short helper text.
- Toasts and empty states: concise English feedback that explains what happened or what to do next.

## Motion
Use quick stateful motion only: sticker pop on successful generation, save drop confirmation, chip/rating selection feedback, and collage drag bounce. All animation respects reduced motion.
