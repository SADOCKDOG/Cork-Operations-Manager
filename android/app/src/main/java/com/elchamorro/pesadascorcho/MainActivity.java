package com.elchamorro.pesadascorcho;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
