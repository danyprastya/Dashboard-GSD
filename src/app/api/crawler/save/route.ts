/**
 * API Route: POST /api/crawler/save
 * 
 * Endpoint untuk menerima data hasil crawler dan menyimpannya ke Supabase
 * 
 * Flow:
 * 1. Validasi API Key untuk autentikasi
 * 2. Create log entry di table log_crawler
 * 3. Process setiap record (insert atau update)
 * 4. Update log dengan statistik akhir
 * 5. Return response dengan summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Helper function untuk create Supabase client
// Dibuat sebagai function agar selalu fresh connection
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Service role key untuk full access
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-my-custom-header': 'crawler-api'
        }
      }
    }
  );
}

// Type definitions untuk data yang diterima
interface CrawlerDataItem {
  Area?: string;
  area?: string;
  Month?: string;
  month?: string;
  ID?: string;
  id_gedung?: string;
  Name?: string;
  name?: string;  // ✅ FIXED: Support 'name' (lowercase) - actual DB column
  nama?: string;
  nama_lokasi?: string;
  Type?: string;
  type?: string;
  Period_1_20?: string;
  period_1_20?: string;
  Period_21_30?: string;
  period_21_30?: string;
}

interface RequestBody {
  data: CrawlerDataItem[];
  area?: string;
  month?: string;
  year?: number;
  updateMode?: 'full' | 'period_1_20_only' | 'period_21_30_only'; // ✅ ADDED
}

// ========== STATUS PRIORITY FOR SMART UPSERT ==========
const STATUS_PRIORITY: Record<string, number> = {
  'NONE': 0,
  'OPEN': 1,
  'ERROR': 1,
  'NOT FOUND': 1,
  'SUBMITTED': 2,
  'NOT APPROVED': 2,
  'APPROVED': 3,
};

export async function POST(req: NextRequest) {
  try {
    // Create fresh Supabase client untuk request ini
    const supabase = getSupabaseClient();
    
    // ========================================
    // 1. AUTHENTICATION - Validasi API Key
    // ========================================
    const apiKey = req.headers.get('X-API-Key');
    
    if (!apiKey || apiKey !== process.env.CRAWLER_API_KEY) {
      console.error('❌ Unauthorized access attempt');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Invalid API Key' 
        },
        { status: 401 }
      );
    }

    console.log('✅ API Key validated');

    // ========================================
    // 2. PARSE REQUEST BODY
    // ========================================
    const body: RequestBody = await req.json();
    const { data: crawlerData, area, month, year, updateMode = 'full' } = body;

    // Validasi data
    if (!crawlerData || !Array.isArray(crawlerData) || crawlerData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid data format - expected array of crawler data' 
        },
        { status: 400 }
      );
    }

    console.log(`📊 Received ${crawlerData.length} records to process`);
    console.log(`   Update Mode: ${updateMode}`);
    console.log(`   Area: ${area || 'auto-detect'}`);
    
    // ✅ VALIDATION: Check if all data is from same area (if area specified)
    if (area) {
      const wrongAreaData = crawlerData.filter(item => 
        (item.Area || item.area) !== area
      );
      
      if (wrongAreaData.length > 0) {
        console.warn(`⚠️ WARNING: Found ${wrongAreaData.length} records from wrong area!`);
        console.warn(`   Expected: ${area}`);
        const foundAreas = [...new Set(wrongAreaData.map(item => item.Area || item.area))];
        console.warn(`   Found areas:`, foundAreas);
        
        return NextResponse.json(
          { 
            success: false, 
            error: `Data validation failed: Expected area '${area}' but found records from: ${foundAreas.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    // ========================================
    // 3. CREATE LOG ENTRY
    // ========================================
    const runId = uuidv4();
    const currentYear = year || new Date().getFullYear();
    
    console.log(`🔄 Creating log entry with run_id: ${runId}`);
    
    const { data: logData, error: logError } = await supabase
      .from('log_crawler')
      .insert({
        run_id: runId,
        area: area || 'UNKNOWN',
        bulan: month || null,
        tahun: currentYear,
        total_record: crawlerData.length,
        status: 'berjalan',
        waktu_mulai: new Date().toISOString()
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ Error creating log:', logError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create log entry',
          details: logError.message 
        },
        { status: 500 }
      );
    }

    console.log('✅ Log entry created successfully');

    // ========================================
    // 4. PROCESS CRAWLER DATA (BATCH OPTIMIZED)
    // ========================================
    let jumlahBerhasil = 0;
    let jumlahGagal = 0;
    let jumlahDiupdate = 0;
    let jumlahBaru = 0;
    const errors: any[] = [];

    console.log('🔄 Processing records with BATCH optimization...');

    // Transform semua data ke format DB dulu
    const allDbRecords = crawlerData.map(item => ({
      area: item.Area || item.area || 'UNKNOWN',
      month: item.Month || item.month || 'UNKNOWN',
      year: currentYear,
      id_gedung: item.ID || item.id_gedung || '',
      name: item.Name || item.name || '',
      type: item.Type || item.type || null,
      period_1_20: item.Period_1_20 || item.period_1_20 || 'NONE',
      period_21_30: item.Period_21_30 || item.period_21_30 || 'NONE',
      tanggal_crawl: new Date().toISOString()
    }));

    // Filter out records tanpa id_gedung
    const validRecords = allDbRecords.filter(record => record.id_gedung);
    const invalidCount = allDbRecords.length - validRecords.length;
    
    if (invalidCount > 0) {
      console.log(`⚠️ ${invalidCount} records skipped (missing id_gedung)`);
      jumlahGagal += invalidCount;
    }

    console.log(`📦 Processing ${validRecords.length} valid records with Smart Upsert...`);

    // ========================================
    // SMART UPSERT STRATEGY - Process individually with priority check
    // ========================================
    for (const record of validRecords) {
      try {
        // Fetch existing record
        const { data: existingData, error: fetchError } = await supabase
          .from('status_bulanan')
          .select('*')
          .eq('id_gedung', record.id_gedung)
          .eq('month', record.month)
          .eq('year', record.year)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found (OK)
          console.error(`   ❌ Error fetching ${record.id_gedung}:`, fetchError.message);
          jumlahGagal++;
          errors.push({ id: record.id_gedung, error: fetchError.message });
          continue;
        }

        const existing = existingData;

        if (!existing) {
          // CREATE new record
          const { error: insertError } = await supabase
            .from('status_bulanan')
            .insert(record);

          if (insertError) {
            console.error(`   ❌ Error inserting ${record.id_gedung}:`, insertError.message);
            jumlahGagal++;
            errors.push({ id: record.id_gedung, error: insertError.message });
          } else {
            jumlahBerhasil++;
            jumlahBaru++;
          }
        } else {
          // ✅ MANUAL EDIT PROTECTION: Skip if user manually edited this record
          if (existing.is_manual_edit === true) {
            console.log(`   🔒 PROTECTED [${record.id_gedung}]: Skipped due to manual edit`);
            continue; // Skip this record entirely
          }
          
          // UPDATE with Smart Logic
          const updateData: any = {};
          let shouldUpdate = false;

          // Determine what to update based on updateMode
          const updatePeriod1_20 = updateMode === 'full' || updateMode === 'period_1_20_only';
          const updatePeriod21_30 = updateMode === 'full' || updateMode === 'period_21_30_only';

          // ========== PERIOD 1-20 LOGIC ==========
          if (updatePeriod1_20 && record.period_1_20) {
            const existingPriority = STATUS_PRIORITY[existing.period_1_20] || 0;
            const newPriority = STATUS_PRIORITY[record.period_1_20] || 0;

            if (newPriority >= existingPriority) {
              updateData.period_1_20 = record.period_1_20;
              shouldUpdate = true;
              console.log(`   📝 Update period_1_20 [${record.id_gedung}]: ${existing.period_1_20} → ${record.period_1_20}`);
            } else {
              console.log(`   ⏭️ Skip period_1_20 [${record.id_gedung}]: keeping ${existing.period_1_20} (priority ${existingPriority} > ${newPriority})`);
            }
          }

          // ========== PERIOD 21-30 LOGIC ==========
          if (updatePeriod21_30 && record.period_21_30) {
            const existingPriority = STATUS_PRIORITY[existing.period_21_30] || 0;
            const newPriority = STATUS_PRIORITY[record.period_21_30] || 0;

            if (newPriority >= existingPriority) {
              updateData.period_21_30 = record.period_21_30;
              shouldUpdate = true;
              console.log(`   📝 Update period_21_30 [${record.id_gedung}]: ${existing.period_21_30} → ${record.period_21_30}`);
            } else {
              console.log(`   ⏭️ Skip period_21_30 [${record.id_gedung}]: keeping ${existing.period_21_30} (priority ${existingPriority} > ${newPriority})`);
            }
          }

          // ========== UPDATE METADATA ==========
          if (shouldUpdate) {
            updateData.name = record.name;
            updateData.type = record.type;
            updateData.tanggal_crawl = record.tanggal_crawl;

            const { error: updateError } = await supabase
              .from('status_bulanan')
              .update(updateData)
              .eq('id_gedung', record.id_gedung)
              .eq('month', record.month)
              .eq('year', record.year);

            if (updateError) {
              console.error(`   ❌ Error updating ${record.id_gedung}:`, updateError.message);
              jumlahGagal++;
              errors.push({ id: record.id_gedung, error: updateError.message });
            } else {
              jumlahBerhasil++;
              jumlahDiupdate++;
            }
          } else {
            // Skipped (protected by priority)
            console.log(`   ⏭️ Skipped ${record.id_gedung} (no updates needed)`);
          }
        }
      } catch (recordError: any) {
        console.error(`   ❌ Error processing ${record.id_gedung}:`, recordError.message);
        jumlahGagal++;
        errors.push({ id: record.id_gedung, error: recordError.message });
      }
    }

    console.log('\n✅ Processing completed');
    console.log(`   📊 Total: ${crawlerData.length}`);
    console.log(`   ✅ Berhasil: ${jumlahBerhasil} (Baru: ${jumlahBaru}, Diupdate: ${jumlahDiupdate})`);
    console.log(`   ❌ Gagal: ${jumlahGagal}`);
    console.log(`   📝 Update Mode: ${updateMode}`);

    // ========================================
    // 5. UPDATE LOG WITH FINAL STATUS
    // ========================================
    const finalStatus = jumlahGagal === crawlerData.length ? 'gagal' : 
                       jumlahGagal > 0 ? 'selesai' : 'selesai';

    const { error: logUpdateError } = await supabase
      .from('log_crawler')
      .update({
        jumlah_berhasil: jumlahBerhasil,
        jumlah_gagal: jumlahGagal,
        jumlah_diupdate: jumlahDiupdate,
        jumlah_baru: jumlahBaru,
        status: finalStatus,
        pesan_error: errors.length > 0 ? JSON.stringify(errors.slice(0, 10)) : null, // Max 10 errors
        waktu_selesai: new Date().toISOString()
      })
      .eq('run_id', runId);

    if (logUpdateError) {
      console.error('⚠️ Warning: Failed to update log:', logUpdateError);
    }

    // ========================================
    // 6. RETURN RESPONSE
    // ========================================
    const response = {
      success: true,
      run_id: runId,
      updateMode, // ✅ ADDED: Include update mode in response
      summary: {
        total: crawlerData.length,
        berhasil: jumlahBerhasil,
        gagal: jumlahGagal,
        diupdate: jumlahDiupdate,
        baru: jumlahBaru
      },
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Return max 5 errors
      message: `✅ Data berhasil diproses: ${jumlahBerhasil}/${crawlerData.length} records (Mode: ${updateMode})`
    };

    console.log('✅ Response sent successfully');
    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('❌ Fatal error in API route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// OPTIONS handler untuk CORS preflight
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}
