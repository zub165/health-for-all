# health_for_all_app

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Build & Deployment

### Install dependencies

```bash
flutter pub get
```

### Run tests

```bash
flutter test
```

### Android build

```bash
flutter build apk # Debug APK
flutter build appbundle # Release bundle for Play Store
```

Artifacts are written to `build/app/outputs/`.

### iOS build

```bash
flutter build ios --no-codesign
```

To create a signed build, open `ios/Runner.xcworkspace` in Xcode and archive via Product → Archive.
