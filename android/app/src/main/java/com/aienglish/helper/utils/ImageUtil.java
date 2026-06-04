package com.aienglish.helper.utils;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Utility to load and compress an image from URI,
 * then return a base64-encoded string suitable for vision API.
 */
public class ImageUtil {

    /**
     * Load, resize (max 2048px on longest side), and encode as JPEG base64.
     * Returns null on failure.
     */
    public static String uriToBase64(Context context, Uri imageUri) {
        try {
            // 1. Decode bounds first
            InputStream is = context.getContentResolver().openInputStream(imageUri);
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeStream(is, null, opts);
            if (is != null) is.close();

            // 2. Compute sample size (max dimension 1280)
            int maxDim = Math.max(opts.outWidth, opts.outHeight);
            int sampleSize = 1;
            while (maxDim / sampleSize > 1280) {
                sampleSize *= 2;
            }

            // 3. Decode scaled bitmap
            BitmapFactory.Options decodeOpts = new BitmapFactory.Options();
            decodeOpts.inSampleSize = sampleSize;
            InputStream is2 = context.getContentResolver().openInputStream(imageUri);
            Bitmap bitmap = BitmapFactory.decodeStream(is2, null, decodeOpts);
            if (is2 != null) is2.close();
            if (bitmap == null) return null;

            // 4. Compress to JPEG
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos);
            byte[] bytes = baos.toByteArray();

            bitmap.recycle();
            return Base64.encodeToString(bytes, Base64.NO_WRAP);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
