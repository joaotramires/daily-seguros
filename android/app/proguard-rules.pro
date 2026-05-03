# Capacitor standard rules
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep our specific AuthBridge
-keepclassmembers class com.daily.app.MainActivity$AuthBridge {
   public *;
}

# Google Play Services rules (usually included in dependencies, but safe to have)
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.ApiException { *; }
-keep class com.google.android.gms.tasks.Task { *; }

# Supabase / OkHttp / etc if needed
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**

# Capacitor
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# AndroidX
-dontwarn androidx.**

# Keep enums (used by Capacitor and Material)
-keepclassmembers enum * { *; }

# Keep source file and line numbers for readable crash reports in Play Console
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
