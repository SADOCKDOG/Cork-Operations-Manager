package com.elchamorro.pesadascorcho;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private int lastTopDp = -1;
    private int lastBottomDp = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // H6: Android 15+ fuerza edge-to-edge y Capacitor 5 no propaga los insets al CSS,
        // así que env(safe-area-inset-top) resuelve a 0 y el header queda bajo la barra de
        // estado. Se envían los insets reales del sistema a las variables CSS que ya usa la
        // hoja de estilos. No se fuerza edge-to-edge: en las versiones que no lo imponen,
        // el sistema ya reserva las barras y los insets llegan a 0.
        listenForInsets();
    }

    private void listenForInsets() {
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            androidx.core.graphics.Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            float density = getResources().getDisplayMetrics().density;
            pushInsets(Math.round(bars.top / density), Math.round(bars.bottom / density));
            return insets;
        });
        ViewCompat.requestApplyInsets(getWindow().getDecorView());
    }

    @Override
    public void onResume() {
        super.onResume();
        // La página puede haberse cargado después del primer cálculo de insets.
        getWindow().getDecorView().postDelayed(this::reinjectInsets, 600);
    }

    private void pushInsets(int topDp, int bottomDp) {
        if (topDp < 0 || bottomDp < 0) return;
        if (topDp == lastTopDp && bottomDp == lastBottomDp) return;
        lastTopDp = topDp;
        lastBottomDp = bottomDp;
        inject(topDp, bottomDp);
    }

    private void reinjectInsets() {
        if (lastTopDp >= 0) inject(lastTopDp, lastBottomDp);
    }

    private void inject(int topDp, int bottomDp) {
        if (bridge == null) return;
        WebView webView = bridge.getWebView();
        if (webView == null) return;
        String js = "document.documentElement.style.setProperty('--safe-top', '" + topDp + "px');"
                + "document.documentElement.style.setProperty('--safe-bottom', '" + bottomDp + "px');";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    /**
     * Handles new intents when the activity is already running (launch mode singleTask).
     * This is essential for deep linking to work correctly when the app is in the background.
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Update the activity's intent so that Capacitor can retrieve the latest deep link data
        setIntent(intent);
    }
}
