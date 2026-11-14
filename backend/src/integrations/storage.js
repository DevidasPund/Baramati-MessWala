import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

class StorageService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    this.isConfigured = Boolean(this.supabaseUrl && this.serviceRoleKey);

    if (this.isConfigured) {
      this.client = createClient(this.supabaseUrl, this.serviceRoleKey, {
        auth: { persistSession: false },
      });
      console.log('[Storage Service] Supabase Storage client initialized.');
    } else {
      console.log('[Storage Service] Supabase Storage keys not provided; using local storage fallback in uploads/.');
    }

    this.buckets = {
      CUSTOMER_PROFILES: 'customer-profiles',
      FOOD_IMAGES: 'food-images',
      PAYMENT_SCREENSHOTS: 'payment-screenshots',
      BUSINESS_ASSETS: 'business-assets',
    };
  }

  // Create required buckets with appropriate privacy policies
  async initBuckets() {
    if (!this.isConfigured || !this.client) return;

    const bucketConfigs = [
      { id: this.buckets.CUSTOMER_PROFILES, public: false, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      { id: this.buckets.FOOD_IMAGES, public: true, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] },
      { id: this.buckets.PAYMENT_SCREENSHOTS, public: false, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
      { id: this.buckets.BUSINESS_ASSETS, public: true, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'] },
    ];

    for (const b of bucketConfigs) {
      try {
        const { data: existing } = await this.client.storage.getBucket(b.id);
        if (!existing) {
          const { error } = await this.client.storage.createBucket(b.id, {
            public: b.public,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: b.allowedMimeTypes,
          });
          if (error) {
            console.warn(`[Storage Service] Note creating bucket ${b.id}:`, error.message);
          } else {
            console.log(`[Storage Service] Bucket created: ${b.id} (Public: ${b.public})`);
          }
        }
      } catch (err) {
        console.warn(`[Storage Service] Bucket check error for ${b.id}:`, err.message);
      }
    }
  }

  // Upload file buffer to Supabase Storage with local fallback
  async uploadFile({ bucket, filePath, fileBuffer, mimeType }) {
    if (this.isConfigured && this.client) {
      try {
        const { data, error } = await this.client.storage
          .from(bucket)
          .upload(filePath, fileBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (error) throw error;

        // If public bucket, return public URL directly
        if (bucket === this.buckets.FOOD_IMAGES || bucket === this.buckets.BUSINESS_ASSETS) {
          const { data: pubData } = this.client.storage.from(bucket).getPublicUrl(filePath);
          return {
            storageType: 'SUPABASE',
            url: pubData.publicUrl,
            bucket,
            path: filePath,
          };
        }

        // For private buckets, return storage reference path (URL generated on-demand)
        return {
          storageType: 'SUPABASE',
          bucket,
          path: filePath,
          url: `/api/storage/secure-url?bucket=${bucket}&path=${encodeURIComponent(filePath)}`,
        };
      } catch (uploadError) {
        console.error('[Storage Service] Supabase upload failed, falling back to disk:', uploadError.message);
      }
    }

    // Local disk fallback
    const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const localFileName = `${Date.now()}_${path.basename(filePath)}`;
    const destination = path.join(uploadDir, localFileName);
    fs.writeFileSync(destination, fileBuffer);

    return {
      storageType: 'LOCAL',
      url: `/uploads/${localFileName}`,
      path: destination,
    };
  }

  // Generate temporary signed URL for private assets (e.g. payment receipt verification)
  async getSignedUrl(bucket, filePath, expiresIn = 3600) {
    if (!this.isConfigured || !this.client) {
      // Local fallback: return direct static file URL
      return `/uploads/${path.basename(filePath)}`;
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('[Storage Service] Failed to create signed URL:', err.message);
      return null;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
