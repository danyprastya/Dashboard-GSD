// src/app/api/download-csv/[area]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { area: string } }
) {
  try {
    const { area } = params;

    // Validasi area
    if (!['A', 'B', 'C', 'D'].includes(area)) {
      return NextResponse.json(
        { error: 'Invalid area parameter' },
        { status: 400 }
      );
    }

    // Path ke folder output
    const outputDir = path.join(process.cwd(), 'crawler', 'output');

    // Cek apakah folder ada
    if (!fs.existsSync(outputDir)) {
      return NextResponse.json(
        { error: 'No crawl data available yet' },
        { status: 404 }
      );
    }

    // Cari file CSV terbaru untuk area ini
    const files = fs.readdirSync(outputDir);
    const areaFiles = files.filter(f => 
      f.startsWith(`area_${area}_`) && f.endsWith('.csv')
    );

    if (areaFiles.length === 0) {
      return NextResponse.json(
        { error: `No CSV file found for Area ${area}` },
        { status: 404 }
      );
    }

    // Ambil file terbaru (berdasarkan timestamp di nama file)
    const latestFile = areaFiles.sort().reverse()[0];
    const filePath = path.join(outputDir, latestFile);

    // Baca file
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Return sebagai CSV download
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${latestFile}"`,
      },
    });

  } catch (error) {
    console.error('Error downloading CSV:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}