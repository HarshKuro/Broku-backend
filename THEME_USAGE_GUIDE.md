# 🎨 Dual Theme System Usage Guide

## Overview
Your expense tracker app now supports both light and dark themes with beautiful colors:
- **Light Mode**: Fresh blue (#4C7EFF) + Orange accent (#FFA657) on light backgrounds
- **Dark Mode**: Same colors on dark backgrounds for better night viewing

## 🚀 Quick Start

### 1. Import Theme Hooks
```tsx
import { useTheme, useThemedStyles } from '../constants/ThemeProvider';
```

### 2. Use in Your Component
```tsx
const MyComponent = () => {
  const { colors, isDark, toggleTheme } = useTheme();
  const themedStyles = useThemedStyles();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      padding: themedStyles.spacing.lg,
    },
    text: {
      color: colors.text.primary,
      ...themedStyles.typography.body1,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: themedStyles.borderRadius.md,
      ...themedStyles.shadows.level2,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World!</Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Text>Toggle Theme</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## 🎨 Available Colors

### Light Mode
```tsx
colors.primary        // #4C7EFF (Fresh blue)
colors.accent         // #FFA657 (Orange highlight)
colors.background     // #F9FAFC (Very light gray-white)
colors.surface        // #FFFFFF (Clean white cards)
colors.text.primary   // #1E1E1E (Near-black text)
colors.text.secondary // #6B7280 (Soft gray text)
colors.border         // #E5E7EB (Soft borders)
```

### Dark Mode
```tsx
colors.primary        // #4C7EFF (Same blue for contrast)
colors.accent         // #FFA657 (Same orange pop)
colors.background     // #121212 (Jet black base)
colors.surface        // #1F1F1F (Dark cards)
colors.text.primary   // #F2F2F2 (Light text)
colors.text.secondary // #A1A1AA (Dim gray text)
colors.border         // #2A2A2E (Dark borders)
```

## 🔧 Theme Properties

### Spacing Scale
```tsx
themedStyles.spacing.xs   // 4px
themedStyles.spacing.sm   // 8px
themedStyles.spacing.md   // 16px
themedStyles.spacing.lg   // 24px
themedStyles.spacing.xl   // 32px
themedStyles.spacing.xxl  // 48px
```

### Border Radius
```tsx
themedStyles.borderRadius.sm   // 8px
themedStyles.borderRadius.md   // 12px
themedStyles.borderRadius.lg   // 16px
themedStyles.borderRadius.xl   // 24px
themedStyles.borderRadius.full // 999px (circular)
```

### Typography
```tsx
themedStyles.typography.h1     // 32px, bold
themedStyles.typography.h2     // 24px, bold
themedStyles.typography.h3     // 20px, 600
themedStyles.typography.h4     // 18px, 600
themedStyles.typography.body1  // 16px, 400
themedStyles.typography.body2  // 14px, 400
themedStyles.typography.caption // 12px, 400
```

### Shadows
```tsx
themedStyles.shadows.level1  // Light shadow
themedStyles.shadows.level2  // Medium shadow
themedStyles.shadows.level3  // Strong shadow
themedStyles.shadows.small   // Alias for level1
themedStyles.shadows.medium  // Alias for level2
themedStyles.shadows.large   // Alias for level4
```

## 🎯 Theme Functions

### Check Current Mode
```tsx
const { isDark } = useTheme();
if (isDark) {
  // Dark mode specific logic
}
```

### Toggle Theme
```tsx
const { toggleTheme } = useTheme();
<Button onPress={toggleTheme} title="Switch Theme" />
```

### Set Specific Theme
```tsx
const { setTheme } = useTheme();
<Button onPress={() => setTheme('dark')} title="Dark Mode" />
<Button onPress={() => setTheme('light')} title="Light Mode" />
```

## 💡 Best Practices

### 1. Use Semantic Colors
```tsx
// ✅ Good - semantic usage
backgroundColor: colors.primary     // For main actions
backgroundColor: colors.accent      // For ₹ amounts, charts
backgroundColor: colors.surface     // For cards
color: colors.text.primary         // For main text
color: colors.text.secondary       // For dates, labels
```

### 2. Create Styles Inside Component
```tsx
// ✅ Good - styles update with theme changes
const MyComponent = () => {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
  });
  
  return <View style={styles.container} />;
};
```

### 3. Use Typography Scale
```tsx
// ✅ Good - consistent typography
const styles = StyleSheet.create({
  title: {
    ...themedStyles.typography.h2,
    color: colors.text.primary,
  },
});
```

## 🔄 Automatic Theme Detection

The app automatically detects the system theme preference and switches accordingly. Users can also manually toggle between themes using the theme toggle button.

## 📱 Status Bar

The status bar automatically adapts:
- **Light mode**: Dark text on light background
- **Dark mode**: Light text on dark background

## 🎨 Color Usage Examples

### Currency (₹) Display
```tsx
<Text style={{ color: colors.accent }}>₹1,23,456</Text>
```

### Primary Actions
```tsx
<TouchableOpacity style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: colors.surface }}>Add Expense</Text>
</TouchableOpacity>
```

### Cards
```tsx
<View style={{
  backgroundColor: colors.surface,
  borderRadius: themedStyles.borderRadius.md,
  ...themedStyles.shadows.level2,
}}>
```

### Borders
```tsx
<View style={{
  borderWidth: 1,
  borderColor: colors.border,
}}>
```

This dual theme system makes your expense tracker app modern, accessible, and user-friendly in both light and dark environments!
