package com.jes.social;

import android.util.DisplayMetrics;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdLoader;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.nativead.MediaView;
import com.google.android.gms.ads.nativead.NativeAd;
import com.google.android.gms.ads.nativead.NativeAdOptions;
import com.google.android.gms.ads.nativead.NativeAdView;

@CapacitorPlugin(name = "AdMobNative")
public class AdMobNativePlugin extends Plugin {

    private NativeAdView nativeAdView = null;
    private NativeAd currentNativeAd = null;
    private boolean initialized = false;

    @PluginMethod
    public void initialize(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!initialized) {
                MobileAds.initialize(getContext(), status -> {});
                initialized = true;
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void load(PluginCall call) {
        String adUnitId = call.getString("adUnitId");
        if (adUnitId == null) { call.reject("Missing adUnitId"); return; }

        double y = call.getDouble("y", 0.0);
        double height = call.getDouble("height", 0.0);

        getActivity().runOnUiThread(() -> {
            removeCurrentAd();
            AdLoader adLoader = new AdLoader.Builder(getContext(), adUnitId)
                .forNativeAd(nativeAd -> {
                    currentNativeAd = nativeAd;
                    showNativeAd(nativeAd, y, height);
                    call.resolve();
                })
                .withAdListener(new AdListener() {
                    @Override
                    public void onAdFailedToLoad(LoadAdError error) {
                        String msg = "AdMob errore " + error.getCode() + ": " + error.getMessage();
                        Toast.makeText(getContext(), msg, Toast.LENGTH_LONG).show();
                        call.reject(msg);
                    }
                })
                .withNativeAdOptions(new NativeAdOptions.Builder().build())
                .build();
            adLoader.loadAd(new AdRequest.Builder().build());
        });
    }

    @PluginMethod
    public void updatePosition(PluginCall call) {
        double y = call.getDouble("y", 0.0);

        getActivity().runOnUiThread(() -> {
            if (nativeAdView != null) {
                float density = getContext().getResources().getDisplayMetrics().density;
                FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) nativeAdView.getLayoutParams();
                params.topMargin = (int) (y * density);
                nativeAdView.setLayoutParams(params);
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void show(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (nativeAdView != null) nativeAdView.setVisibility(View.VISIBLE);
            call.resolve();
        });
    }

    @PluginMethod
    public void hide(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (nativeAdView != null) nativeAdView.setVisibility(View.GONE);
            call.resolve();
        });
    }

    @PluginMethod
    public void destroy(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            removeCurrentAd();
            call.resolve();
        });
    }

    private void showNativeAd(NativeAd nativeAd, double y, double height) {
        float density = getContext().getResources().getDisplayMetrics().density;

        DisplayMetrics dm = getContext().getResources().getDisplayMetrics();
        int screenWidth = dm.widthPixels;

        NativeAdView adView = (NativeAdView) LayoutInflater.from(getContext())
            .inflate(R.layout.native_ad_view, null);

        // Register views
        ImageView iconView = adView.findViewById(R.id.ad_icon);
        TextView headlineView = adView.findViewById(R.id.ad_headline);
        TextView bodyView = adView.findViewById(R.id.ad_body);
        Button ctaView = adView.findViewById(R.id.ad_call_to_action);
        TextView advertiserView = adView.findViewById(R.id.ad_advertiser);
        MediaView mediaView = adView.findViewById(R.id.ad_media);

        adView.setIconView(iconView);
        adView.setHeadlineView(headlineView);
        adView.setBodyView(bodyView);
        adView.setCallToActionView(ctaView);
        adView.setAdvertiserView(advertiserView);
        adView.setMediaView(mediaView);

        // Populate
        headlineView.setText(nativeAd.getHeadline());

        if (nativeAd.getBody() != null) {
            bodyView.setText(nativeAd.getBody());
        } else {
            bodyView.setVisibility(View.GONE);
        }

        if (nativeAd.getCallToAction() != null) {
            ctaView.setText(nativeAd.getCallToAction());
        } else {
            ctaView.setVisibility(View.GONE);
        }

        if (nativeAd.getIcon() != null) {
            iconView.setImageDrawable(nativeAd.getIcon().getDrawable());
        } else {
            iconView.setVisibility(View.GONE);
        }

        if (nativeAd.getAdvertiser() != null) {
            advertiserView.setText(nativeAd.getAdvertiser());
        } else {
            advertiserView.setVisibility(View.GONE);
        }

        adView.setNativeAd(nativeAd);

        // Position: full width, at y position
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            screenWidth,
            FrameLayout.LayoutParams.WRAP_CONTENT
        );
        params.leftMargin = 0;
        params.topMargin = (int) (y * density);
        adView.setLayoutParams(params);

        FrameLayout rootView = getActivity().getWindow().getDecorView()
            .findViewById(android.R.id.content);
        rootView.addView(adView);
        nativeAdView = adView;
    }

    private void removeCurrentAd() {
        if (nativeAdView != null) {
            ViewGroup parent = (ViewGroup) nativeAdView.getParent();
            if (parent != null) parent.removeView(nativeAdView);
            nativeAdView = null;
        }
        if (currentNativeAd != null) {
            currentNativeAd.destroy();
            currentNativeAd = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        removeCurrentAd();
    }
}
