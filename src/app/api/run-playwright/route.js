import { NextResponse } from "next/server"
import { chromium } from "playwright"

export async function POST() {
  try {
    const browser = await chromium.launch({ headless: false }) // ganti ke true jika deploy
    const page = await browser.newPage()

    await page.goto("https://www.appsheet.com/start/c08488d5-d2b3-4411-b6cc-8f387c028e7c?platform=desktop")

    // Tunggu tombol login muncul
    await page.waitForSelector('[data-testid="Login"]', { timeout: 60000 })
    await page.click('[data-testid="Login"]')

    // Tunggu form login muncul
    await page.waitForSelector('input[aria-label="Username"]')
    await page.fill('input[aria-label="Username"]', '855060')
    await page.fill('input[aria-label="Password"]', '123')

    // Klik tombol Login di form
    await page.click('button:has-text("Login")')

    // Tunggu sidebar muncul
    await page.waitForSelector('div[title="Laporan"]', { timeout: 60000 })

    // Klik tombol dengan ikon ceklis (menu ketiga)
    await page.click('div[fdprocessedid="7l12uv"]')

    // Simpan sesi cookies (opsional)
    const storage = await page.context().storageState()
    console.log("Cookies disimpan:", storage)

    await browser.close()

    return NextResponse.json({ message: "✅ Crawling berhasil dijalankan!" })
  } catch (error) {
    console.error("❌ Error:", error)
    return NextResponse.json({ message: "Gagal menjalankan crawling", error: error.message }, { status: 500 })
  }
}
