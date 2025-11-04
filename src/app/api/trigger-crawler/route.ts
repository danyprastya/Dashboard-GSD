import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

interface TriggerRequest {
  area: string; // 'A', 'B', 'C', 'D'
  month?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TriggerRequest = await request.json();
    const { area, month } = body;

    if (!area || !["A", "B", "C", "D"].includes(area)) {
      return NextResponse.json(
        { error: "Parameter 'area' harus berupa A, B, C, atau D" },
        { status: 400 }
      );
    }

    console.log(`🚀 Menjalankan crawler sinkron untuk area ${area}`);

    const crawlerPath = path.resolve("crawler/appsheet-crawler.js");

    const envVars = {
      ...process.env,
      TARGET_AREA: area,
      TARGET_MONTH: month || process.env.TARGET_MONTH || "Oktober 2025",
    };

    // Jalankan proses Node sebagai subprocess dan tunggu sampai selesai
    const result = await new Promise<{ success: boolean; output: string; error?: string }>(
      (resolve) => {
        const child = spawn("node", [crawlerPath], {
          env: envVars,
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
          stdout += data.toString();
          console.log(data.toString());
        });

        child.stderr.on("data", (data) => {
          stderr += data.toString();
          console.error(data.toString());
        });

        child.on("close", (code) => {
          if (code === 0) {
            resolve({ success: true, output: stdout });
          } else {
            resolve({ success: false, output: stdout, error: stderr });
          }
        });
      }
    );

    if (result.success) {
      console.log("✅ Crawler selesai berhasil!");
      return NextResponse.json({
        success: true,
        message: `Crawler untuk area ${area} selesai dijalankan.`,
        output: result.output,
      });
    } else {
      console.error("❌ Crawler gagal:", result.error);
      return NextResponse.json(
        {
          success: false,
          message: `Crawler gagal dijalankan untuk area ${area}.`,
          error: result.error,
        },
        { status: 500 }
      );
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error di trigger-crawler route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Terjadi kesalahan internal." },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
