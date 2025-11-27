package com.spred;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;

/**
 * QuickShareModule - Android Quick Share integration
 * Uses Intent.ACTION_SEND to leverage Android's built-in Quick Share
 */
public class QuickShareModule extends ReactContextBaseJavaModule {
    private static final String TAG = "QuickShareModule";
    private final ReactApplicationContext reactContext;

    public QuickShareModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "QuickShareModule";
    }

    /**
     * Share a file using Android's Quick Share (Intent.ACTION_SEND)
     * This triggers the system share sheet which includes Quick Share
     */
    @ReactMethod
    public void quickShare(String filePath, Promise promise) {
        Log.d(TAG, "quickShare() called with filePath: " + filePath);

        try {
            File file = new File(filePath);
            if (!file.exists()) {
                Log.e(TAG, "File does not exist: " + filePath);
                promise.reject("FILE_NOT_FOUND", "File does not exist: " + filePath);
                return;
            }

            Uri fileUri = FileProvider.getUriForFile(
                reactContext,
                reactContext.getPackageName() + ".fileprovider",
                file
            );

            Log.d(TAG, "Created URI: " + fileUri.toString());

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("video/*");
            shareIntent.putExtra(Intent.EXTRA_STREAM, fileUri);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // Add flags for starting from React Native
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            shareIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            // Create chooser to ensure user gets options
            Intent chooser = Intent.createChooser(shareIntent, "Share via Quick Share");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            chooser.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            Log.d(TAG, "Starting share activity...");
            reactContext.startActivity(chooser);

            Log.d(TAG, "Quick Share initiated successfully");
            promise.resolve("Quick Share initiated successfully for: " + filePath);

        } catch (Exception e) {
            Log.e(TAG, "Quick Share failed", e);
            promise.reject("SHARE_FAILED", "Failed to initiate Quick Share: " + e.getMessage(), e);
        }
    }
}
