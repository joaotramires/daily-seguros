package com.daily.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

public class MainActivity extends BridgeActivity {
    private static final int RC_SIGN_IN = 9001;
    private GoogleSignInClient mGoogleSignInClient;
    private View authOverlay;
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 1. Edge-to-edge UI Setup
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        View decorView = window.getDecorView();
        WindowCompat.getInsetsController(window, decorView).setAppearanceLightStatusBars(true);
        WindowCompat.getInsetsController(window, decorView).setAppearanceLightNavigationBars(true);

        // 2. Reference the bridge WebView
        webView = this.bridge.getWebView();
        
        // 3. Inject the Native Auth Overlay on top of Capacitor
        LayoutInflater inflater = getLayoutInflater();
        authOverlay = inflater.inflate(R.layout.auth_overlay, null);
        addContentView(authOverlay, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 
                ViewGroup.LayoutParams.MATCH_PARENT));
        authOverlay.setVisibility(View.GONE);

        // 4. Add Javascript Bridge
        webView.getSettings().setJavaScriptEnabled(true);
        webView.addJavascriptInterface(new AuthBridge(), "android");

        // 5. Configure Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(getString(R.string.google_web_client_id)) 
                .requestProfile()
                .build();
        mGoogleSignInClient = GoogleSignIn.getClient(this, gso);

        // 6. Native Button Listeners
        authOverlay.findViewById(R.id.btn_google).setOnClickListener(v -> signInWithGoogle());
        authOverlay.findViewById(R.id.btn_email).setOnClickListener(v -> sendMagicLink());
        authOverlay.findViewById(R.id.btn_close_auth).setOnClickListener(v -> authOverlay.setVisibility(View.GONE));
        
        // 7. Logic Injection (Mockup removal + Button Hijacking)
        webView.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(this.bridge) {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectLogic(view);
            }
        });
    }

    private void injectLogic(WebView view) {
        // CSS to hide mockup and ensure full-screen
        String css = ".phone-frame { width: 100vw !important; height: 100vh !important; max-width: none !important; border: none !important; margin: 0 !important; border-radius: 0 !important; background: #F5F0E8 !important; } " +
                     ".phone-frame > div:has(.bg-black.rounded-full) { display: none !important; } " +
                     ".phone-frame > div:first-child { display: none !important; }";

        String js = "(function() {" +
                    "  var style = document.createElement('style');" +
                    "  style.innerHTML = '" + css + "';" +
                    "  document.head.appendChild(style);" +

                    // Bridge: links a Supabase Auth user (email) to the app's customerId in localStorage.
                    // Called after Google sign-in completes on the native side.
                    "  window.__dailyPostAuth = async function(email, name) {" +
                    "    try {" +
                    "      var res = await fetch('/api/login-customer', {" +
                    "        method: 'POST'," +
                    "        headers: {'Content-Type': 'application/json'}," +
                    "        body: JSON.stringify({email: email})" +
                    "      });" +
                    "      var d = await res.json();" +
                    "      if (d.found) {" +
                    "        localStorage.setItem('customerId', d.customerId);" +
                    "        localStorage.setItem('customerName', d.name);" +
                    "      } else {" +
                    "        var r2 = await fetch('/api/register-customer', {" +
                    "          method: 'POST'," +
                    "          headers: {'Content-Type': 'application/json'}," +
                    "          body: JSON.stringify({name: name, email: email, city: 'Madrid'})" +
                    "        });" +
                    "        var d2 = await r2.json();" +
                    "        if (d2.customerId) {" +
                    "          localStorage.setItem('customerId', d2.customerId);" +
                    "          localStorage.setItem('customerName', name);" +
                    "        }" +
                    "      }" +
                    "      window.location.reload();" +
                    "    } catch(e) { console.error('dailyPostAuth error', e); }" +
                    "  };" +

                    "  function hijack() {" +
                    "    var btns = Array.from(document.querySelectorAll('button'));" +
                    "    var loginBtn = btns.find(b => b.textContent.toLowerCase().includes('entrar'));" +
                    "    if (loginBtn && !loginBtn.hijacked) {" +
                    "      loginBtn.addEventListener('click', function(e) {" +
                    "        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();" +
                    "        window.android.showAuth();" +
                    "      }, true);" +
                    "      loginBtn.hijacked = true;" +
                    "    }" +
                    "  }" +
                    "  setInterval(hijack, 500);" +

                    "  if (!window.supabase) {" +
                    "    var script = document.createElement('script');" +
                    "    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';" +
                    "    script.onload = function() {" +
                    "       window.supabase = supabase.createClient('https://ldhdmxamjocrbdmtnztv.supabase.co', 'sb_publishable_5tP4zwUZSDJuFtRsN-VJkA_9ohcicJy');" +
                    "    };" +
                    "    document.head.appendChild(script);" +
                    "  }" +
                    "})();";

        view.evaluateJavascript(js, null);
    }

    private void signInWithGoogle() {
        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    private void sendMagicLink() {
        EditText emailEdit = authOverlay.findViewById(R.id.edit_email);
        String email = emailEdit.getText().toString().trim();
        if (email.isEmpty()) {
            Toast.makeText(this, "Introduce un email válido", Toast.LENGTH_SHORT).show();
            return;
        }
        
        String js = "if(window.supabase) { window.supabase.auth.signInWithOtp({ email: '" + email + "' }).then(() => alert('Enlace mágico enviado a " + email + "')); }";
        webView.evaluateJavascript(js, null);
        
        authOverlay.setVisibility(View.GONE);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            handleSignInResult(task);
        }
    }

    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {
        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);
            String idToken = account.getIdToken();
            String email = account.getEmail() != null ? account.getEmail().replace("'", "\\'") : "";
            String name  = account.getDisplayName() != null ? account.getDisplayName().replace("'", "\\'") : email;

            // 1. Authenticate with Supabase Auth using the Google ID token
            // 2. Then bridge to the app's customer system via __dailyPostAuth
            String js = "if(window.supabase) {" +
                        "  window.supabase.auth.signInWithIdToken({ provider: 'google', token: '" + idToken + "' })" +
                        "    .then(function() {" +
                        "      if (window.__dailyPostAuth) window.__dailyPostAuth('" + email + "', '" + name + "');" +
                        "      else window.location.reload();" +
                        "    });" +
                        "}";
            webView.evaluateJavascript(js, null);

            authOverlay.setVisibility(View.GONE);
            Toast.makeText(this, "Bienvenido " + account.getDisplayName(), Toast.LENGTH_SHORT).show();
        } catch (ApiException e) {
            Toast.makeText(this, "Error: " + e.getStatusCode(), Toast.LENGTH_SHORT).show();
        }
    }

    public class AuthBridge {
        @JavascriptInterface
        public void showAuth() {
            runOnUiThread(() -> authOverlay.setVisibility(View.VISIBLE));
        }
    }
}
