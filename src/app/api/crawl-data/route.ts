// src/app/api/crawl-data/route.ts

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // gunakan service role untuk bypass RLS
);

interface BuildingData {
  label: string;
  kode_gedung: string;
  nama_gedung: string;
  alamat: string;
  status_open: boolean;
  status_checklist: boolean;
  status_submitted: boolean;
  status_approved: boolean;
}

interface CrawlRequest {
  area: string;
  bulan: string;
  data: BuildingData[];
}

export async function POST(request: NextRequest) {
  try {
    const body: CrawlRequest = await request.json();
    const { area, bulan, data } = body;

    // Validasi input
    if (!area || !bulan || !data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Missing required fields: area, bulan, data' },
        { status: 400 }
      );
    }

    console.log(`Receiving data for Area ${area}, Bulan ${bulan}, Total: ${data.length} buildings`);

    // Tambahkan timestamp dan metadata
    const enrichedData = data.map(item => ({
      ...item,
      area,
      bulan,
      crawled_at: new Date().toISOString(),
      // Hitung progress berdasarkan status
      progress_percentage: calculateProgress(item)
    }));

    // Upsert ke Supabase (update jika sudah ada, insert jika baru)
    // Asumsi table name: 'building_monitoring'
    // Sesuaikan dengan schema Anda
    const { data: insertedData, error } = await supabase
      .from('building_monitoring')
      .upsert(enrichedData, {
        onConflict: 'label,area,bulan', // composite unique key
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to save data to database',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Log success
    console.log(`✅ Successfully saved ${data.length} buildings for Area ${area}`);

    return NextResponse.json({
      success: true,
      message: `Data for Area ${area} saved successfully`,
      count: data.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function untuk kalkulasi progress
function calculateProgress(building: BuildingData): number {
  const statuses = [
    building.status_open,
    building.status_checklist,
    building.status_submitted,
    building.status_approved
  ];
  
  const completedSteps = statuses.filter(status => status === true).length;
  return (completedSteps / 4) * 100; // 4 total steps
}

// Untuk OPTIONS request (CORS preflight)
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 });
}