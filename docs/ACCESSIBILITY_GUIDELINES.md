# Accessibility Guidelines

This document outlines accessibility improvements made and best practices for the SpareCarry app.

## ✅ Implemented Improvements

### 1. Skip Links

- **Component**: `components/ui/skip-link.tsx`
- **Purpose**: Allows keyboard users to skip to main content
- **Usage**: Added to root layout, links to `#main-content`

### 2. ARIA Labels

- **Input Components**: Auto-generated IDs for form inputs
- **Buttons**: Support for `aria-label` and `aria-describedby`
- **Loading States**: `aria-busy` attribute on loading buttons

### 3. Keyboard Navigation

- All interactive elements are keyboard accessible
- Focus indicators are visible (ring-2, ring-offset-2)
- Tab order is logical

### 4. Screen Reader Support

- Semantic HTML elements (`<main>`, `<nav>`, `<button>`, etc.)
- ARIA live regions for dynamic content
- Alt text for images (when implemented)

### 5. Offline Detection

- **Component**: `components/ui/offline-banner.tsx`
- **Hook**: `useOnlineStatus()` from `lib/utils/offline-detection.ts`
- Shows clear message when offline

## 📝 Best Practices

### When Adding New Components

1. **Always include ARIA labels** for icon-only buttons:

   ```tsx
   <button aria-label="Close dialog">
     <X />
   </button>
   ```

2. **Use semantic HTML**:
   - `<button>` for buttons (not `<div>`)
   - `<nav>` for navigation
   - `<main>` for main content
   - `<form>` for forms

3. **Ensure keyboard navigation**:
   - All interactive elements should be focusable
   - Tab order should be logical
   - Focus indicators should be visible

4. **Add loading states**:

   ```tsx
   <button aria-busy={loading} aria-label={loading ? "Loading..." : "Submit"}>
     {loading && <Spinner />}
     Submit
   </button>
   ```

5. **Provide error messages**:
   ```tsx
   <input aria-invalid={hasError} aria-describedby="error-id" />
   <span id="error-id" role="alert">{errorMessage}</span>
   ```

## 🎯 WCAG Compliance Goals

- **Level AA** (target for production)
  - Color contrast ratio: 4.5:1 for text, 3:1 for UI components
  - Keyboard accessible
  - Screen reader compatible
  - Focus indicators visible

## 🧪 Testing

1. **Keyboard Testing**:
   - Tab through entire page
   - Ensure all interactive elements are reachable
   - Verify focus indicators are visible

2. **Screen Reader Testing**:
   - Test with NVDA (Windows) or VoiceOver (Mac/iOS)
   - Verify all content is readable
   - Check ARIA labels are descriptive

3. **Color Contrast**:
   - Use tools like WebAIM Contrast Checker
   - Ensure all text meets WCAG AA standards

4. **Automated Testing**:
   - Use axe DevTools browser extension
   - Run Lighthouse accessibility audit

## 📚 Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
