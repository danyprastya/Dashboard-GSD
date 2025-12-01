import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API Route: GET /api/overview/monthly
 * 
 * Endpoint untuk mengambil data overview monthly dari tabel status_bulanan
 * Data di-group by month dan year, semua area digabung
 * 
 * Query params:
 * - year: Tahun yang ingin ditampilkan (optional, default: current year)
 */

// Helper function untuk create Supabase client
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

// Mapping bulan untuk sorting
const MONTH_ORDER: { [key: string]: number } = {
  'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MEI': 5, 'JUN': 6,
  'JUL': 7, 'AGU': 8, 'SEP': 9, 'OKT': 10, 'NOV': 11, 'DES': 12
};

const ALL_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];

interface KawasanBreakdown {
  kawasan: string;
  checklist: number;
  period_1_20: {
    open: number;
    submitted: number;
    approved: number;
  };
  period_21_30: {
    none: number;
    error: number;
    not_approved: number;
    approved: number;
    not_found: number;
  };
}

interface MonthlyData {
  bulan: string;
  checklist: number;
  period_1_20: {
    open: number;
    submitted: number;
    approved: number;
  };
  period_21_30: {
    none: number;
    error: number;
    not_approved: number;
    approved: number;
    not_found: number;
  };
  breakdown: KawasanBreakdown[];
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Parse query params
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    console.log(`📊 Fetching monthly overview for year: ${year}`);

    // Fetch data gedung untuk mapping kawasan
    const { data: gedungData, error: gedungError } = await supabase
      .from('gedung')
      .select('kode_gedung, kawasan');

    if (gedungError) {
      console.error('❌ Error fetching gedung data:', gedungError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gedung data', details: gedungError.message },
        { status: 500 }
      );
    }

    // Create mapping dari kode_gedung ke kawasan
    const gedungKawasanMap = new Map<string, string>();
    gedungData?.forEach(g => {
      gedungKawasanMap.set(g.kode_gedung, g.kawasan?.toUpperCase() || 'UNKNOWN');
    });

    console.log(`✅ Fetched ${gedungData?.length || 0} gedung records for kawasan mapping`);

    // Fetch all data untuk tahun tersebut
    // ⚠️ IMPORTANT: Supabase default limit = 1000, kita override dengan .range()
    let allData: any[] = [];
    let fetchedCount = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    console.log(`🔄 Fetching data in batches...`);
    
    while (hasMore) {
      const { data: batchData, error, count } = await supabase
        .from('status_bulanan')
        .select('month, year, id_gedung, period_1_20, period_21_30', { count: 'exact' })
        .eq('year', year)
        .range(fetchedCount, fetchedCount + batchSize - 1);

      if (error) {
        console.error('❌ Error fetching data:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to fetch data',
            details: error.message 
          },
          { status: 500 }
        );
      }

      if (batchData && batchData.length > 0) {
        allData = allData.concat(batchData);
        fetchedCount += batchData.length;
        console.log(`   ✓ Batch ${Math.ceil(fetchedCount / batchSize)}: Fetched ${batchData.length} records (total so far: ${fetchedCount})`);
        
        // Check if there's more data
        hasMore = batchData.length === batchSize && (!count || fetchedCount < count);
      } else {
        hasMore = false;
      }
    }
    
    const rawData = allData;

    console.log(`✅ Fetched ${rawData?.length || 0} records from database in total`);

    // Debug: Log sample data
    if (rawData && rawData.length > 0) {
      console.log(`\n📋 Sample data (first 3 records):`);
      rawData.slice(0, 3).forEach((row, idx) => {
        console.log(`   ${idx + 1}. Month: ${row.month}, ID: ${row.id_gedung}, P1-20: ${row.period_1_20}, P21-30: ${row.period_21_30}`);
      });
      
      // Count by month
      const monthCounts = rawData.reduce((acc: any, row) => {
        const month = row.month?.toUpperCase() || 'UNKNOWN';
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});
      console.log(`\n📊 Record count by month:`, monthCounts);
    }

    // Group data by month
    const monthlyMap = new Map<string, {
      allRecords: any[];
      byKawasan: Map<string, any[]>;
    }>();

    // Initialize all months dengan data kosong
    ALL_MONTHS.forEach(month => {
      monthlyMap.set(month, {
        allRecords: [],
        byKawasan: new Map()
      });
    });

    // Process raw data - group by month and kawasan
    if (rawData && rawData.length > 0) {
      rawData.forEach(row => {
        const month = row.month?.toUpperCase();
        if (!month || !monthlyMap.has(month)) {
          console.log(`⚠️ Skipping row with unknown month: ${month}`);
          return;
        }

        const monthData = monthlyMap.get(month)!;
        monthData.allRecords.push(row);

        // Group by kawasan
        const kawasan = gedungKawasanMap.get(row.id_gedung) || 'UNKNOWN';
        if (!monthData.byKawasan.has(kawasan)) {
          monthData.byKawasan.set(kawasan, []);
        }
        monthData.byKawasan.get(kawasan)!.push(row);
      });
    }

    // Transform to response format dengan counting yang benar
    const monthlyData: MonthlyData[] = ALL_MONTHS.map(month => {
      const monthData = monthlyMap.get(month)!;
      const records = monthData.allRecords;
      
      // Helper function untuk count status dari array records
      const countStatuses = (records: any[]) => {
        const period1_20Count = { open: 0, submitted: 0, approved: 0 };
        const period21_30Count = { none: 0, error: 0, not_approved: 0, approved: 0, not_found: 0 };
        
        records.forEach(row => {
          // Count period_1_20
          const status1_20 = row.period_1_20?.toUpperCase();
          if (status1_20 === 'OPEN') period1_20Count.open++;
          else if (status1_20 === 'SUBMITTED') period1_20Count.submitted++;
          else if (status1_20 === 'APPROVED') period1_20Count.approved++;
          
          // Count period_21_30
          const status21_30 = row.period_21_30?.toUpperCase();
          if (status21_30 === 'NONE') period21_30Count.none++;
          else if (status21_30 === 'ERROR') period21_30Count.error++;
          else if (status21_30 === 'NOT APPROVED') period21_30Count.not_approved++;
          else if (status21_30 === 'APPROVED') period21_30Count.approved++;
          else if (status21_30 === 'NOT FOUND') period21_30Count.not_found++;
        });
        
        return { period1_20Count, period21_30Count };
      };
      
      // Count total untuk bulan ini
      const { period1_20Count, period21_30Count } = countStatuses(records);
      
      // Process breakdown per kawasan
      const kawasanList = ['BANDUNG', 'CORPU', 'PRIANGANBARAT', 'PRIANGANTIMUR'];
      const breakdown: KawasanBreakdown[] = kawasanList.map(kawasan => {
        const kawasanRecords = monthData.byKawasan.get(kawasan) || [];
        const kawasanCounts = countStatuses(kawasanRecords);
        
        return {
          kawasan,
          checklist: kawasanRecords.length,
          period_1_20: kawasanCounts.period1_20Count,
          period_21_30: kawasanCounts.period21_30Count
        };
      });
      
      return {
        bulan: month,
        checklist: records.length,
        period_1_20: period1_20Count,
        period_21_30: period21_30Count,
        breakdown
      };
    });

    // Calculate totals
    const totals = {
      checklist: 0,
      period_1_20: { open: 0, submitted: 0, approved: 0 },
      period_21_30: { none: 0, error: 0, not_approved: 0, approved: 0, not_found: 0 }
    };

    monthlyData.forEach(month => {
      totals.checklist += month.checklist;
      totals.period_1_20.open += month.period_1_20.open;
      totals.period_1_20.submitted += month.period_1_20.submitted;
      totals.period_1_20.approved += month.period_1_20.approved;
      totals.period_21_30.none += month.period_21_30.none;
      totals.period_21_30.error += month.period_21_30.error;
      totals.period_21_30.not_approved += month.period_21_30.not_approved;
      totals.period_21_30.approved += month.period_21_30.approved;
      totals.period_21_30.not_found += month.period_21_30.not_found;
    });

    console.log(`✅ Processed data for ${monthlyData.length} months`);
    console.log(`📊 Total records in DB: ${rawData?.length || 0}`);
    console.log(`📊 Total checklist (all records): ${totals.checklist}`);
    console.log(`📊 Total period_1_20: OPEN=${totals.period_1_20.open}, SUBMITTED=${totals.period_1_20.submitted}, APPROVED=${totals.period_1_20.approved}`);
    console.log(`📊 Sum of period_1_20: ${totals.period_1_20.open + totals.period_1_20.submitted + totals.period_1_20.approved}`);
    console.log(`📊 Sum should equal Total checklist: ${totals.checklist === (totals.period_1_20.open + totals.period_1_20.submitted + totals.period_1_20.approved) ? '✅ MATCH' : '❌ MISMATCH'}`);
    
    // Debug per month
    console.log(`\n📅 Per month breakdown:`);
    monthlyData.filter(m => m.checklist > 0).forEach(m => {
      const total1_20 = m.period_1_20.open + m.period_1_20.submitted + m.period_1_20.approved;
      const match = m.checklist === total1_20 ? '✅' : '❌';
      console.log(`   ${match} ${m.bulan}: Checklist=${m.checklist}, P1-20 Total=${total1_20} (O:${m.period_1_20.open}, S:${m.period_1_20.submitted}, A:${m.period_1_20.approved})`);
    });

    return NextResponse.json({
      success: true,
      year,
      data: monthlyData,
      totals
    }, { status: 200 });

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
