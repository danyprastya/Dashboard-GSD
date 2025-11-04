/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Konfigurasi area dengan URL berbeda dan username berbeda
const AREA_CONFIG = {
  A: {
    url: process.env.APPSHEET_URL_AREA_A,
    username: process.env.APPSHEET_USER_AREA_A,
    name: 'Bandung'
  },
  B: {
    url: process.env.APPSHEET_URL_AREA_B,
    username: process.env.APPSHEET_USER_AREA_B,
    name: 'Kawasan Corpu'
  },
  C: {
    url: process.env.APPSHEET_URL_AREA_C,
    username: process.env.APPSHEET_USER_AREA_C,
    name: 'Priangan Timur'
  },
  D: {
    url: process.env.APPSHEET_URL_AREA_D,
    username: process.env.APPSHEET_USER_AREA_D,
    name: 'Priangan Barat'
  }
};

const GMAIL_EMAIL = process.env.GMAIL_EMAIL;
const GMAIL_PASSWORD = process.env.GMAIL_PASSWORD;
const TARGET_MONTH = process.env.TARGET_MONTH || 'Oktober 2025';
const NEXTJS_API_URL = process.env.NEXTJS_API_URL || process.env.NEXT_PUBLIC_BASE_URL;
const STATUS_TYPES = ['open', 'checklist', 'submitted', 'approved'];

function ensureUserDataDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function createPersistentContext() {
  const defaultDir = path.resolve(__dirname, '../playwright-user-data');
  const userDataDir = process.env.PLAYWRIGHT_USER_DATA_DIR
    ? path.resolve(process.env.PLAYWRIGHT_USER_DATA_DIR)
    : defaultDir;

  ensureUserDataDir(userDataDir);

  const executablePath = process.env.CHROME_PATH || undefined;
  const headlessEnv = process.env.PLAYWRIGHT_HEADLESS === 'true';
  const headless = headlessEnv ? true : false;

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless,
    executablePath,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage',
      '--disable-extensions'
    ],
    viewport: { width: 1366, height: 768 },
    slowMo: process.env.PLAYWRIGHT_SLOW_MO ? Number(process.env.PLAYWRIGHT_SLOW_MO) : 0,
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters && parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters)
    );

    window.chrome = window.chrome || { runtime: {} };
  });

  return context;
}

async function crawlArea(area) {
  const config = AREA_CONFIG[area];
  
  if (!config) {
    throw new Error(`Unknown area: ${area}`);
  }

  if (!config.url || !config.username) {
    throw new Error(`Missing configuration for area ${area}. Check your .env file.`);
  }

  const context = await createPersistentContext();
  const page = await context.newPage();

  try {
    console.log(`\n🚀 Starting crawl for Area ${area} (${config.name})...`);
    console.log(`📍 URL: ${config.url}`);
    console.log(`👤 Username: ${config.username}`);

    console.log('📧 Navigating to login page...');
    await page.goto(config.url, { waitUntil: 'load', timeout: 60000 });

    const isLoggedIn = await checkIfLoggedIn(page);
    if (!isLoggedIn) {
      console.log('⚠️ Belum login: kamu mungkin perlu login manual di jendela Chrome yang terbuka.');
      if (GMAIL_EMAIL && GMAIL_PASSWORD) {
        try {
          await attemptGmailLogin(page);
        } catch (err) {
          console.warn('❗ Otomatisasi login gagal – silakan login manual lalu jalankan ulang.');
        }
      }
    } else {
      console.log('✅ Sudah login (session ditemukan).');
    }

    console.log(`👤 Logging in with username: ${config.username}...`);
    try {
      const loginBtn = page.locator('//*[@id="scroller"]/div/div/div/div/div/div/div[2]/div/span');
      await loginBtn.waitFor({ timeout: 10000 });
      await loginBtn.click();
      console.log("✅ Tombol login diklik");

      const usernameInput = page.locator('xpath=//*[@id="__TableEntryScreenLogs_SchemaUsername"]/div/input');
      const passwordInput = page.locator('xpath=//*[@id="__TableEntryScreenLogs_SchemaPassword"]/div/input');

      await usernameInput.waitFor({ timeout: 10000 });
      await usernameInput.fill(config.username);
      await passwordInput.fill("123");
      await page.keyboard.press("Enter");
      console.log("✅ Username & password diisi dan dikirim");
      
      await page.waitForTimeout(3000);
    } catch (e) {
      console.log('  ℹ️ Tidak menemukan form login internal – lanjut jika tidak ada.');
    }

    console.log('🏢 Navigating to Detail Gedung...');
    try {
      const mainMenu = page.locator('xpath=//*[@id="ReactRoot"]/div/div/div[1]/div/ul/div[2]');
      await mainMenu.waitFor({ timeout: 20000 });
      await mainMenu.click();
      console.log("✅ Menu utama diklik");
      await page.waitForTimeout(3000);
    } catch (e) {
      console.warn('  ⚠️ Gagal klik ke Detail Gedung – lanjut mencoba scraping di halaman saat ini.');
    }

    console.log('📊 Scraping building data...');
    const buildings = await scrapeBuildingTableWithScroll(page);
    console.log(`✅ Found ${buildings.length} buildings`);

    if (buildings.length === 0) {
      throw new Error('No buildings found! Check table selectors.');
    }

    console.log('📋 Navigating to Status/Checklist table...');
    try {
      await page.click(
        'button:has-text("Checklist"), ' +
        'button:has-text("Status"), ' +
        'a:has-text("Checklist"), ' +
        '[data-menu="checklist"]'
      );
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle');
    } catch (e) {
      console.warn('  ⚠️ Gagal klik ke Checklist/Status – lanjut mencoba di halaman saat ini.');
    }

    const statusData = {};
    for (const statusType of STATUS_TYPES) {
      console.log(`🔍 Filtering status: ${statusType}...`);
      await setMonthFilter(page, TARGET_MONTH);
      await setStatusFilter(page, statusType);
      await page.waitForTimeout(1500);
      const labels = await scrapeStatusLabelsWithScroll(page);
      statusData[statusType] = labels;
      console.log(`   → Found ${labels.length} buildings with status "${statusType}"`);
    }

    console.log('🔗 Merging building and status data...');
    const mergedData = mergeData(buildings, statusData);

    console.log('💾 Exporting to CSV...');
    const csvPath = await exportToCSV(area, config.name, TARGET_MONTH, mergedData);
    console.log(`✅ CSV saved: ${csvPath}`);

    if (NEXTJS_API_URL) {
      console.log('📤 Uploading to Supabase via Next.js API...');
      await uploadToAPI(area, TARGET_MONTH, mergedData);
    } else {
      console.log('⚠️ NEXTJS_API_URL not configured, skipping upload');
    }

    console.log(`✅ Area ${area} completed successfully!\n`);

    await context.close();
    return csvPath;

  } catch (error) {
    console.error(`❌ Error crawling Area ${area}:`, error.message || error);
    try { await context.close(); } catch (e) {}
    throw error;
  }
}

// ==========================================
// COMPLETELY REWRITTEN SCRAPING FUNCTION
// Berdasarkan struktur HTML yang diberikan
// ==========================================
async function scrapeBuildingTableWithScroll(page) {
  console.log('  📊 Starting table scraping with auto-scroll...');

  const tableContainerXPath = '//*[@id="Gedung"]/div/div/div/div';
  const headerContainerXPath = '//*[@id="Gedung"]/div/div/div/div/div[1]';
  const bodyContainerXPath = '//*[@id="Gedung"]/div/div/div/div/div[2]';
  
  await page.waitForSelector(`xpath=${tableContainerXPath}`, { timeout: 20000 });
  console.log('  ✅ Table container found');

  // ==========================================
  // 1. SCRAPE HEADER
  // ==========================================
  console.log('  📋 Extracting table headers...');
  
  const headers = await page.evaluate((params) => {
    const { headerXPath } = params;
    
    const headerContainer = document.evaluate(
      headerXPath, 
      document, 
      null, 
      XPathResult.FIRST_ORDERED_NODE_TYPE, 
      null
    ).singleNodeValue;
    
    if (!headerContainer) return [];
    
    const headerSpans = headerContainer.querySelectorAll('span');
    const columnNames = [];
    const seen = new Set();
    
    headerSpans.forEach(span => {
      const text = span.innerText ? span.innerText.trim() : '';
      if (text && text !== '' && !seen.has(text)) {
        columnNames.push(text);
        seen.add(text);
      }
    });
    
    return columnNames;
  }, { headerXPath: headerContainerXPath });
  
  console.log(`  ✅ Found ${headers.length} columns:`, headers);
  
  if (headers.length === 0) {
    throw new Error('No table headers found! Check headerContainerXPath');
  }

  // ==========================================
  // 2. CARI DAN HOVER KE SCROLLABLE CONTAINER
  // ==========================================
  // Container yang bisa di-scroll adalah TableView__list dengan overflow-y: auto
  const scrollableSelector = 'div.TableView__list[style*="overflow-y: auto"]';
  
  console.log('  🔍 Looking for scrollable container...');
  await page.waitForSelector(scrollableSelector, { timeout: 10000 });
  
  const scrollContainer = await page.$(scrollableSelector);
  const box = await scrollContainer.boundingBox();
  
  if (box) {
    // Pindahkan mouse ke tengah container agar scroll berfungsi
    await page.mouse.move(
      box.x + box.width / 2, 
      box.y + box.height / 2
    );
    console.log('  🖱️  Mouse hovered over scrollable table container');
    await page.waitForTimeout(1000);
  }

  // ==========================================
  // 3. EXTRACT VISIBLE ROWS - COMPLETELY NEW APPROACH
  // ==========================================
  async function extractVisibleRows() {
    return page.evaluate(() => {
      const rows = [];
      
      // Cari semua span dengan data-testid="table-view-row" dan data-testonly-row-index
      // SKIP yang memiliki grouped-header-row-container
      const allRowSpans = document.querySelectorAll('span[data-testid="table-view-row"][data-testonly-row-index]');
      
      allRowSpans.forEach((rowSpan) => {
        // Cari semua div dengan class TableViewRow__column di dalam rowSpan
        const columnDivs = rowSpan.querySelectorAll('div.TableViewRow__column');
        
        if (columnDivs.length === 0) return;
        
        const rowData = [];
        
        // Untuk setiap column div, cari span dengan data-testid yang mengandung "display-span"
        columnDivs.forEach((columnDiv) => {
          // Cari span dengan text-type-display-span atau decimal-type-display-span
          const textSpan = columnDiv.querySelector(
            'span[data-testid="text-type-display-span"], ' +
            'span[data-testid="decimal-type-display-span"]'
          );
          
          if (textSpan) {
            const text = textSpan.innerText ? textSpan.innerText.trim() : '';
            rowData.push(text);
          } else {
            // Jika tidak ada span, coba ambil dari innerText div langsung
            const baseTypeDiv = columnDiv.querySelector('div[data-testid="base-type-display"]');
            if (baseTypeDiv) {
              const text = baseTypeDiv.innerText ? baseTypeDiv.innerText.trim() : '';
              rowData.push(text);
            } else {
              // Jika masih kosong, push empty string
              rowData.push('');
            }
          }
        });
        
        // Filter row yang tidak kosong semua
        const hasData = rowData.some(cell => cell !== '');
        if (hasData && rowData.length > 0) {
          rows.push(rowData);
        }
      });
      
      return rows;
    });
  }

  // ==========================================
  // 4. SCROLL DAN COLLECT DATA
  // ==========================================
  const seenFingerprints = new Set();
  const allRows = [];
  
  let currentBatch = await extractVisibleRows();
  console.log(`  📊 Initial visible rows: ${currentBatch.length}`);
  
  currentBatch.forEach(row => {
    const fingerprint = JSON.stringify(row);
    if (!seenFingerprints.has(fingerprint)) {
      seenFingerprints.add(fingerprint);
      allRows.push(row);
    }
  });
  
  console.log(`  ➕ Initial unique rows stored: ${allRows.length}`);

  let noNewDataCount = 0;
  const maxNoNewData = 5;
  let scrollIteration = 0;
  const maxScrollIterations = 150;

  while (noNewDataCount < maxNoNewData && scrollIteration < maxScrollIterations) {
    scrollIteration++;
    
    // Scroll di dalam scrollable container
    const scrollInfo = await page.evaluate(() => {
      // Cari container dengan class TableView__list yang punya overflow-y: auto
      const scrollContainer = document.querySelector('div.TableView__list[style*="overflow-y: auto"]');
      
      if (scrollContainer) {
        const beforeScroll = scrollContainer.scrollTop;
        const scrollAmount = scrollContainer.clientHeight * 0.8;
        
        scrollContainer.scrollBy({
          top: scrollAmount,
          behavior: 'smooth'
        });
        
        return {
          before: beforeScroll,
          scrollHeight: scrollContainer.scrollHeight,
          clientHeight: scrollContainer.clientHeight,
          scrolled: true
        };
      }
      
      return { scrolled: false };
    });
    
    if (!scrollInfo.scrolled) {
      console.log('  ⚠️ Scroll container not found!');
      break;
    }
    
    await page.waitForTimeout(600 + Math.min(scrollIteration * 50, 800));
    
    const newBatch = await extractVisibleRows();
    
    let newRowsAdded = 0;
    newBatch.forEach(row => {
      const fingerprint = JSON.stringify(row);
      if (!seenFingerprints.has(fingerprint)) {
        seenFingerprints.add(fingerprint);
        allRows.push(row);
        newRowsAdded++;
      }
    });
    
    console.log(`  📜 Scroll #${scrollIteration}: ${newBatch.length} visible, +${newRowsAdded} new → Total: ${allRows.length} | ScrollTop: ${scrollInfo.before}px`);

    
    if (newRowsAdded === 0) {
      noNewDataCount++;
    } else {
      noNewDataCount = 0;
    }
  }

  console.log('  ✅ Scrolling down completed');

  // ==========================================
  // 5. SCROLL KE ATAS DAN FINAL CHECK
  // ==========================================
  console.log('  ⬆️  Scrolling to top for final check...');
  
  await page.evaluate(() => {
    // Scroll ke atas pada TableView__list container
    const scrollContainer = document.querySelector('div.TableView__list[style*="overflow-y: auto"]');
    
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
    }
  });
  
  await page.waitForTimeout(800);
  
  const finalBatch = await extractVisibleRows();
  let finalAdded = 0;
  
  finalBatch.forEach(row => {
    const fingerprint = JSON.stringify(row);
    if (!seenFingerprints.has(fingerprint)) {
      seenFingerprints.add(fingerprint);
      allRows.push(row);
      finalAdded++;
    }
  });
  
  if (finalAdded > 0) {
    console.log(`  🔍 Final pass added ${finalAdded} rows`);
  }

  console.log(`  ✅ Total unique rows scraped: ${allRows.length}`);

  // Debug: print first 3 rows
  if (allRows.length > 0) {
    console.log('  🔍 Sample data (first 3 rows):');
    allRows.slice(0, 3).forEach((row, idx) => {
      console.log(`    Row ${idx + 1} (${row.length} cols):`, row.slice(0, 4).join(' | '));
    });
  }

  // ==========================================
  // 6. CONVERT KE ARRAY OF OBJECTS
  // ==========================================
  const buildings = allRows.map(rowData => {
    const obj = {};
    headers.forEach((headerName, index) => {
      const key = headerName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/\//g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      obj[key] = rowData[index] || '';
    });
    return obj;
  });

  // ==========================================
  // 7. EXPORT CSV BACKUP
  // ==========================================
  const outDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `gedung_scraped_${timestamp}.csv`;
  const filePath = path.join(outDir, fileName);
  
  const csvRows = [headers.join(',')];
  allRows.forEach(row => {
    const escaped = row.map(cell => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    csvRows.push(escaped.join(','));
  });
  
  fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
  console.log(`  💾 CSV backup saved: ${filePath}`);

  return buildings;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================
async function checkIfLoggedIn(page) {
  try {
    const selectors = [
      'a:has-text("Sign out")',
      'button:has-text("Sign out")',
      '[data-test="user-menu"]',
      'img[alt*="Profile"]'
    ];
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) return true;
    }
    const cookies = await page.context().cookies();
    if (cookies.some(c => /google/.test(c.domain) && c.name.includes('SID'))) return true;
  } catch (e) {}
  return false;
}

async function attemptGmailLogin(page) {
  console.log('⚙️ Mencoba login otomatis dengan credential env');
  try {
    await page.goto('https://accounts.google.com/signin/v2/identifier', { waitUntil: 'load' });
    await page.fill('input[type="email"]', GMAIL_EMAIL);
    await page.click('button:has-text("Next"), #identifierNext');
    await page.waitForTimeout(1500);
    await page.fill('input[type="password"]', GMAIL_PASSWORD);
    await page.click('button:has-text("Next"), #passwordNext');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  } catch (err) {
    console.warn('  ⚠️ Otomatis login gagal:', err.message || err);
    throw err;
  }
}

async function setMonthFilter(page, month) {
  try {
    const monthSelect = await page.$('select[name="month"]');
    if (monthSelect) {
      await page.selectOption('select[name="month"]', { label: month });
      return;
    }
    
    await page.click('[data-filter="month"], button:has-text("Bulan")');
    await page.waitForTimeout(500);
    await page.click(`div:has-text("${month}"), li:has-text("${month}")`);
  } catch (error) {
    console.log('  ⚠️ Month filter not found:', error.message);
  }
}

async function setStatusFilter(page, status) {
  try {
    const statusSelect = await page.$('select[name="status"]');
    if (statusSelect) {
      await page.selectOption('select[name="status"]', { label: status });
      return;
    }
    
    await page.click('[data-filter="status"], button:has-text("Status")');
    await page.waitForTimeout(500);
    await page.click(`div:has-text("${status}"), li:has-text("${status}")`);
  } catch (error) {
    console.log('  ⚠️ Status filter not found:', error.message);
  }
}

async function scrapeStatusLabelsWithScroll(page) {
  const tableSelector = 'table tbody, .table-container';
  
  try {
    await page.waitForSelector(tableSelector, { timeout: 5000 });
    
    let previousHeight = 0;
    let currentHeight = await page.evaluate((params) => {
      const { selector } = params;
      const table = document.querySelector(selector);
      return table ? table.scrollHeight : 0;
    }, { selector: tableSelector });
    
    let scrollAttempts = 0;
    
    while (previousHeight !== currentHeight && scrollAttempts < 10) {
      previousHeight = currentHeight;
      
      await page.evaluate((params) => {
        const { selector } = params;
        const table = document.querySelector(selector);
        if (table) table.scrollTop = table.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
      }, { selector: tableSelector });
      
      await page.waitForTimeout(800);
      
      currentHeight = await page.evaluate((params) => {
        const { selector } = params;
        const table = document.querySelector(selector);
        return table ? table.scrollHeight : 0;
      }, { selector: tableSelector });
      
      scrollAttempts++;
    }
  } catch (error) {
    console.log('  ⚠️ Status table scroll failed:', error.message);
  }
  
  const labels = await page.$$eval(
    'table tbody tr td:first-child, table tbody tr td:nth-child(1)',
    cells => cells.map(cell => cell.innerText.trim())
  );
  
  return [...new Set(labels)];
}

function mergeData(buildings, statusData) {
  return buildings.map(building => {
    const buildingLabel = building.label || '';
    
    return {
      ...building,
      status_open: statusData.open?.includes(buildingLabel) || false,
      status_checklist: statusData.checklist?.includes(buildingLabel) || false,
      status_submitted: statusData.submitted?.includes(buildingLabel) || false,
      status_approved: statusData.approved?.includes(buildingLabel) || false,
      progress_percentage: calculateProgress({
        status_open: statusData.open?.includes(buildingLabel) || false,
        status_checklist: statusData.checklist?.includes(buildingLabel) || false,
        status_submitted: statusData.submitted?.includes(buildingLabel) || false,
        status_approved: statusData.approved?.includes(buildingLabel) || false,
      })
    };
  });
}

function calculateProgress(statuses) {
  const completedSteps = [
    statuses.status_open,
    statuses.status_checklist,
    statuses.status_submitted,
    statuses.status_approved
  ].filter(status => status === true).length;
  
  return Math.round((completedSteps / 4) * 100);
}

async function exportToCSV(area, areaName, month, data) {
  const outputDir = path.join(__dirname, '../output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `area_${area}_${areaName.replace(/\s+/g, '_')}_${month.replace(/\s+/g, '_')}_${timestamp}.csv`;
  const filePath = path.join(outputDir, filename);
  
  const sampleRow = data[0] || {};
  const dataKeys = Object.keys(sampleRow);
  
  const exportKeys = dataKeys.filter(key => 
    !key.startsWith('_') && key !== 'csvPath'
  );
  
  const headers = exportKeys.map(key => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });
  
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = exportKeys.map(key => {
      let value = row[key];
      
      if (typeof value === 'boolean') {
        return value ? 'Ya' : 'Tidak';
      }
      
      return escapeCSV(value);
    });
    
    csvRows.push(values.join(','));
  });
  
  fs.writeFileSync(filePath, csvRows.join('\n'), 'utf8');
  
  return filePath;
}

async function uploadToAPI(area, bulan, data) {
  if (!NEXTJS_API_URL) {
    console.log('⚠️ Skip upload: NEXTJS_API_URL not configured');
    return;
  }

  try {
    const apiEndpoint = `${NEXTJS_API_URL}/api/crawl-data`;
    console.log(`  📡 Uploading to: ${apiEndpoint}`);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        area,
        bulan,
        data
      })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`  ✅ Upload successful: ${result.message}`);
    } else {
      console.error(`  ❌ Upload failed: ${result.error}`);
      console.error(`  Details: ${result.details}`);
    }
  } catch (error) {
    console.error(`  ❌ Upload error:`, error.message);
  }
}

function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function main() {
  console.log('🤖 AppSheet Crawler Started');
  console.log(`📅 Target Month: ${TARGET_MONTH}\n`);

  const targetArea = process.env.TARGET_AREA || 'A';
  
  console.log(`🎯 Target Area: ${targetArea} (${AREA_CONFIG[targetArea]?.name})\n`);

  try {
    const csvPath = await crawlArea(targetArea);
    console.log(`\n🎉 Crawl completed successfully!`);
    console.log(`📁 CSV file: ${csvPath}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Fatal error:`, error.message || error);
    console.error(error.stack || '');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { crawlArea, exportToCSV };