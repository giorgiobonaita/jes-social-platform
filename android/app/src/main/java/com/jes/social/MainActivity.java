package com.jes.social;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(AdMobNativePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
