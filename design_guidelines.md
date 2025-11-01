# Design Guidelines: Local Landmarks Map Application

## Design Approach

**Selected Approach:** Design System (Material Design) with inspiration from Google Maps and Apple Maps
**Justification:** This is a utility-focused, information-dense application where usability and performance are paramount. The map interface is the primary content, requiring established patterns that users understand intuitively.

**Key Design Principles:**
- Clarity over decoration: Map content takes center stage
- Instant comprehension: Users should understand functionality immediately
- Spatial hierarchy: Interface elements shouldn't compete with map content
- Performance-first: Lightweight, fast interactions essential for map panning

## Core Design Elements

### Typography
**Font Family:** Inter (primary), system fonts fallback
- **Headlines (H1):** 24px, semibold (600) - App title, landmark names in detail view
- **Subheadings (H2):** 18px, medium (500) - Category labels, section headers
- **Body Text:** 14px, regular (400) - Landmark descriptions, metadata
- **Caption Text:** 12px, regular (400) - Attribution, coordinates, timestamps
- **Button Text:** 14px, medium (500) - All interactive elements

### Layout System
**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4
- Section spacing: space-y-4
- Icon spacing: gap-2
- Large gaps: gap-6 or gap-8
- Consistent use creates predictable rhythm

**Container Strategy:**
- Full viewport map: w-full h-screen
- Overlay panels: max-w-md with appropriate padding
- Mobile-first responsive breakpoints

### Component Library

#### Map Interface
- **Full-screen map canvas** with Leaflet.js
- **Zoom controls:** Fixed position (top-right or bottom-right), floating buttons with shadow
- **Center/locate button:** GPS icon, returns to user location
- **Search bar overlay:** Fixed top-center, elevated with shadow, rounded corners

#### Landmark Markers
- **Custom pin icons:** Use Heroicons for marker graphics (map-pin, location-marker)
- **Clustered markers:** When zoomed out, group nearby landmarks with count badges
- **Active state:** Larger, elevated shadow when selected
- **Popup cards:** Triggered on marker click

#### Information Panels

**Landmark Detail Card (appears on marker click):**
- Floating panel overlay (bottom of screen on mobile, side panel on desktop)
- Components: Landmark name (H1), category tag, brief description (2-3 lines), thumbnail if available, "Read on Wikipedia" link button, distance from center
- Elevation: shadow-lg for prominence
- Close button (X icon) in top-right corner

**Sidebar Panel (desktop only, left-aligned):**
- Collapsible panel (can be toggled)
- Width: w-80 (320px)
- Lists all visible landmarks in viewport
- Each list item: Icon + Name + Distance, clickable to center map
- Scroll container for overflow

**Search Interface:**
- Top-positioned search bar with glass/blur background effect
- Search icon (magnifying glass) prefix
- Clear button (X) when typing
- Autocomplete dropdown showing landmark suggestions
- Rounded-full styling for modern appearance

#### Controls & Buttons
- **Primary buttons:** Filled style, rounded-lg, px-4 py-2
- **Icon buttons:** Circular (rounded-full), p-3, shadow for floating effect
- **Filter chips:** Rounded-full, small size, toggleable states
- All buttons have subtle shadows for elevation

#### Loading States
- **Map loading:** Skeleton tiles with shimmer effect
- **Data fetching:** Small spinner overlay in top-right corner
- **Empty states:** Center message "Move map to discover landmarks"

#### Category Filters (optional top bar)
- Horizontal scrollable chip list
- Categories: Historical Sites, Natural Landmarks, Museums, Monuments, Parks, Buildings
- Each chip shows icon + label
- Toggle selection to filter visible markers

### Navigation & Header
**Minimal header bar (fixed top):**
- App logo/title (left): "Local Landmarks" with map-pin icon
- Search bar (center-right)
- Menu button (right): Opens settings/about drawer
- Height: h-16
- Background: Semi-transparent with backdrop blur
- Border-bottom: Subtle divider

### Responsive Behavior
**Mobile (base):**
- Full-screen map
- Floating search bar at top
- Bottom sheet for landmark details (slides up)
- Controls positioned for thumb reach

**Desktop (lg:):**
- Left sidebar for landmark list
- Side panel for details (right)
- Search bar in header
- Controls in bottom-right cluster

### Accessibility
- All interactive elements minimum 44px touch target
- ARIA labels on all icon-only buttons
- Keyboard navigation for map controls
- Screen reader announcements for new landmarks loaded
- Focus indicators on all interactive elements

### Animations
**Use sparingly:**
- Marker bounce on new load (subtle, 300ms)
- Smooth map pan/zoom (Leaflet default)
- Panel slide-in/out transitions (200ms ease)
- NO scroll-triggered animations
- NO elaborate micro-interactions

### Performance Considerations
- Lazy load landmark data only for visible viewport
- Debounce API calls on map movement (500ms)
- Limit marker rendering (max 50 visible at once, use clustering)
- Optimize marker icons (SVG sprites)
- Use map tile caching

### Icons
**Icon Library:** Heroicons (via CDN)
**Primary icons needed:**
- map-pin (landmark markers)
- magnifying-glass (search)
- location-marker (user location)
- x-mark (close buttons)
- plus/minus (zoom controls)
- adjustments-horizontal (filters)
- information-circle (about/help)

## Images
This application does not require hero images or marketing imagery. The map itself is the primary visual content. Landmark thumbnails from Wikipedia API may appear in detail cards when available, displayed at 80x80px rounded corners.