# Capacitor standard rules
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep our specific AuthBridge
-keepclassmembers class com.daily.app.MainActivity$AuthBridge {
   public *;
}

# Google Play Services rules
-keep class com.google.android.gms.auth.api.signin.** { *; }
-keep class com.google.android.gms.common.api.ApiException { *; }
-keep class com.google.android.gms.tasks.Task { *; }

# Capacitor
-keep class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# AndroidX & Material
-dontwarn androidx.**
-dontwarn com.google.android.material.**
-keep class androidx.appcompat.widget.** { *; }
-keep class com.google.android.material.** { *; }

# Keep enums (used by Capacitor and Material)
-keepclassmembers enum * { *; }

# Keep source file and line numbers for readable crash reports in Play Console
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Supabase / OkHttp / etc
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.conscrypt.**
