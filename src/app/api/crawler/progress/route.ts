/**
 * API Route: POST /api/crawler/progress
 * 
 * Endpoint untuk menerima dan menyimpan progress update dari crawler
 * Real-time progress tracking untuk ditampilkan di frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

interface ProgressData {
  runId: string;
  area: string;
  totalRecords: number;
  processedRecords: number;
  currentBatch: number;
  totalBatches: number;
  successCount: number;
  failedCount: number;
  status: 'running' | 'completed' | 'failed';
}

export async function POST(req: NextRequest) {
  try {
    // API Key validation
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.CRAWLER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ProgressData = await req.json();
    const supabase = getSupabaseClient();

    // Upsert progress to log_crawler table
    const { error } = await supabase
      .from('log_crawler')
      .upsert({
        run_id: body.runId,
        area: body.area,
        total_record: body.totalRecords,
        jumlah_berhasil: body.successCount,
        jumlah_gagal: body.failedCount,
        status: body.status,
        waktu_mulai: new Date().toISOString(),
        pesan_error: body.status === 'failed' ? 'Crawler failed' : null
      }, {
        onConflict: 'run_id'
      });

    if (error) {
      console.error('Progress update error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      progress: {
        percentage: Math.round((body.processedRecords / body.totalRecords) * 100),
        current: body.processedRecords,
        total: body.totalRecords,
        batch: `${body.currentBatch}/${body.totalBatches}`
      }
    });

  } catch (error: any) {
    console.error('Progress API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint untuk fetch progress
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey || apiKey !== process.env.CRAWLER_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('log_crawler')
      .select('*')
      .eq('run_id', runId)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      runId: data.run_id,
      area: data.area,
      totalRecords: data.total_record,
      successCount: data.jumlah_berhasil,
      failedCount: data.jumlah_gagal,
      status: data.status,
      startTime: data.waktu_mulai,
      endTime: data.waktu_selesai
    });

  } catch (error: any) {
    console.error('GET Progress error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
