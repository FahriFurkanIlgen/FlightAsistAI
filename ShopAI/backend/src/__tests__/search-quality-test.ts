/**
 * 🎯 SEARCH QUALITY TEST
 * 
 * Product Manager Approach: Measure what matters
 * - Relevance: Are results actually related to the query?
 * - Diversity: Do we show different brands/products?
 * - Speed: Is it fast enough?
 * - Coverage: Do we handle edge cases?
 */ 

import { CacheService } from './services/cacheService';
import { Product } from '../../shared/types';

interface TestCase {
  name: string;
  query: string;
  category: 'simple' | 'brand' | 'size' | 'color' | 'complex' | 'edge-case';
  expectations: {
    minResults?: number;
    maxResults?: number;
    mustInclude?: string[]; // Keywords that MUST appear in results
    mustNotInclude?: string[]; // Keywords that should NOT appear
    brandFilter?: string; // If query specifies brand
    sizeFilter?: string; // If query specifies size
    colorFilter?: string; // If query specifies color
    genderFilter?: 'Male' | 'Female' | 'Unisex';
  };
}

const TEST_CASES: TestCase[] = [
  // 1. SIMPLE CATEGORY SEARCHES
  {
    name: '✅ Basit kategori: koşu ayakkabısı',
    query: 'koşu ayakkabısı',
    category: 'simple',
    expectations: {
      minResults: 4,
      mustInclude: ['koşu', 'ayakkabı'],
    },
  },
  {
    name: '✅ Basit kategori: spor ayakkabı',
    query: 'spor ayakkabı',
    category: 'simple',
    expectations: {
      minResults: 4,
      mustInclude: ['spor', 'ayakkabı'],
    },
  },

  // 2. BRAND + CATEGORY
  {
    name: '🏷️ Marka: nike ayakkabı',
    query: 'nike ayakkabı',
    category: 'brand',
    expectations: {
      minResults: 3,
      brandFilter: 'Nike',
      mustInclude: ['nike'],
    },
  },
  {
    name: '🏷️ Marka: adidas koşu',
    query: 'adidas koşu ayakkabısı',
    category: 'brand',
    expectations: {
      minResults: 2,
      brandFilter: 'Adidas',
      mustInclude: ['adidas'],
    },
  },

  // 3. SIZE FILTERING
  {
    name: '📏 Numara: 42 numara ayakkabı',
    query: '42 numara ayakkabı',
    category: 'size',
    expectations: {
      minResults: 3,
      sizeFilter: '42',
      mustInclude: ['ayakkabı'],
    },
  },
  {
    name: '📏 Numara: 28 numara çocuk',
    query: '28 numara çocuk ayakkabı',
    category: 'size',
    expectations: {
      minResults: 2,
      sizeFilter: '28',
      mustInclude: ['28'],
    },
  },

  // 4. COLOR FILTERING
  {
    name: '🎨 Renk: siyah ayakkabı',
    query: 'siyah ayakkabı',
    category: 'color',
    expectations: {
      minResults: 3,
      colorFilter: 'siyah',
      mustInclude: ['siyah'],
    },
  },

  // 5. COMPLEX QUERIES
  {
    name: '🔥 Karmaşık: nike 42 numara siyah',
    query: 'nike 42 numara siyah koşu ayakkabısı',
    category: 'complex',
    expectations: {
      minResults: 1,
      brandFilter: 'Nike',
      sizeFilter: '42',
      colorFilter: 'siyah',
    },
  },

  // 6. GENDER TARGETING
  {
    name: '👨 Gender: erkek ayakkabı',
    query: 'erkek koşu ayakkabısı',
    category: 'simple',
    expectations: {
      minResults: 3,
      genderFilter: 'Male',
      mustInclude: ['erkek', 'koşu'],
    },
  },

  // 7. EDGE CASES
  {
    name: '⚠️ Türkçe karakter yok: kosu ayakabisi',
    query: 'kosu ayakabisi',
    category: 'edge-case',
    expectations: {
      minResults: 3,
      mustInclude: ['koşu', 'ayakkabı'],
    },
  },
  {
    name: '⚠️ Çok dar filtre: 47.5 numara kırmızı',
    query: '47.5 numara kırmızı su geçirmez',
    category: 'edge-case',
    expectations: {
      minResults: 1, // Should suggest alternatives
    },
  },
];

class SearchQualityTester {
  private cacheService: CacheService;
  private siteId = 'high5';

  constructor() {
    this.cacheService = CacheService.getInstance();
  }

  async initialize(): Promise<void> {
    console.log('📦 Loading products from local feed...\n');
    const { FeedParserService } = await import('./services/feedParser');
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const feedParser = new FeedParserService(this.cacheService);
    
    // Read local feed file
    const feedPath = path.join(process.cwd(), 'temp_feed.xml');
    const feedContent = await fs.readFile(feedPath, 'utf-8');
    
    // Parse using xml2js directly
    const { parseStringPromise } = await import('xml2js');
    const parsed = await parseStringPromise(feedContent, {
      explicitArray: false,
      mergeAttrs: true,
      strict: false, // Less strict parsing
    });
    
    // Use the same extraction logic from FeedParserService
    const feedParserClass = feedParser as any;
    const products = feedParserClass.extractProducts ? 
      feedParserClass.extractProducts(parsed) : 
      await this.extractProductsFallback(parsed);
    
    // Cache the feed manually
    this.cacheService.setFeed({
      siteId: this.siteId,
      siteName: 'High5 Store',
      feedUrl: 'local',
      lastUpdated: new Date(),
      products,
    });
    
    const loadedProducts = this.cacheService.getProducts(this.siteId);
    console.log(`✅ Loaded ${loadedProducts?.length || 0} products\n`);
    
    if (!loadedProducts || loadedProducts.length === 0) {
      throw new Error('Failed to load products!');
    }
  }
  
  private async extractProductsFallback(parsed: any): Promise<Product[]> {
    let items: any[] = [];
    if (parsed.rss?.channel?.item) {
      items = Array.isArray(parsed.rss.channel.item) ? parsed.rss.channel.item : [parsed.rss.channel.item];
    }
    return items.slice(0, 100).map((item: any) => ({
      id: item['g:id'] || item.id || '',
      title: item['g:title'] || item.title || '',
      description: item['g:description'] || item.description || '',
      link: item['g:link'] || item.link || '',
      imageLink: item['g:image_link'] || item.image_link || '',
      price: item['g:price'] || item.price || '',
      availability: item['g:availability'] || item.availability || '',
      brand: item['g:brand'] || item.brand,
      color: item['g:color'] || item.color,
      size: item['g:size'] || item.size,
      gender: item['g:gender'] || item.gender,
      productType: item['g:product_type'] || item.product_type,
    }));
  }

  async runAllTests(): Promise<void> {
    console.log('\n🎯 SEARCH QUALITY TEST BAŞLIYOR...\n');
    console.log('='.repeat(80));

    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
    };

    for (const testCase of TEST_CASES) {
      const testResult = await this.runTest(testCase);
      
      if (testResult.status === 'PASS') results.passed++;
      else if (testResult.status === 'FAIL') results.failed++;
      else results.warnings++;

      this.printTestResult(testCase, testResult);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 TEST SONUÇLARI:');
    console.log(`   ✅ Başarılı: ${results.passed}/${TEST_CASES.length}`);
    console.log(`   ❌ Başarısız: ${results.failed}/${TEST_CASES.length}`);
    console.log(`   ⚠️  Uyarı: ${results.warnings}/${TEST_CASES.length}`);
    console.log(`   🎯 Başarı Oranı: ${Math.round((results.passed / TEST_CASES.length) * 100)}%\n`);

    if (results.failed > 0) {
      console.log('⚠️  UYARI: Bazı testler başarısız. İyileştirme gerekiyor!\n');
    } else {
      console.log('🎉 TÜM TESTLER BAŞARILI!\n');
    }
  }

  private async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Run hybrid search
      const results = await this.cacheService.hybridSearch(
        this.siteId,
        testCase.query,
        100 // Get more for analysis
      );

      const duration = Date.now() - startTime;

      // Analyze results
      const analysis = this.analyzeResults(results, testCase.expectations);

      return {
        status: analysis.failureReasons.length === 0 ? 'PASS' : 'FAIL',
        duration,
        resultCount: results.length,
        analysis,
        topProducts: results.slice(0, 4),
      };
    } catch (error: any) {
      return {
        status: 'FAIL',
        duration: Date.now() - startTime,
        resultCount: 0,
        analysis: {
          failureReasons: [`Error: ${error.message}`],
          warnings: [],
          stats: {},
        },
        topProducts: [],
      };
    }
  }

  private analyzeResults(products: Product[], expectations: TestCase['expectations']): ResultAnalysis {
    const failures: string[] = [];
    const warnings: string[] = [];
    const stats: any = {};

    // 1. CHECK MINIMUM RESULTS
    if (expectations.minResults && products.length < expectations.minResults) {
      failures.push(`Yetersiz sonuç: ${products.length} < ${expectations.minResults}`);
    }

    // 2. CHECK BRAND FILTER
    if (expectations.brandFilter && products.length > 0) {
      const top4 = products.slice(0, 4);
      const correctBrand = top4.filter(p => 
        p.brand?.toLowerCase().includes(expectations.brandFilter!.toLowerCase())
      ).length;
      
      stats.brandAccuracy = `${correctBrand}/4`;
      
      if (correctBrand < 3) {
        failures.push(`Marka filtresi zayıf: ${correctBrand}/4 ürün ${expectations.brandFilter}`);
      } else if (correctBrand < 4) {
        warnings.push(`Marka filtresi orta: ${correctBrand}/4 ürün ${expectations.brandFilter}`);
      }
    }

    // 3. CHECK SIZE FILTER
    if (expectations.sizeFilter && products.length > 0) {
      const top4 = products.slice(0, 4);
      const correctSize = top4.filter(p => 
        p.size === expectations.sizeFilter
      ).length;
      
      stats.sizeAccuracy = `${correctSize}/4`;
      
      if (correctSize < 2) {
        failures.push(`Numara filtresi HATALI: ${correctSize}/4 ürün ${expectations.sizeFilter} numara`);
      } else if (correctSize < 3) {
        warnings.push(`Numara filtresi zayıf: ${correctSize}/4 ürün ${expectations.sizeFilter} numara`);
      }
    }

    // 4. CHECK COLOR FILTER
    if (expectations.colorFilter && products.length > 0) {
      const top4 = products.slice(0, 4);
      const correctColor = top4.filter(p => 
        p.color?.toLowerCase().includes(expectations.colorFilter!.toLowerCase())
      ).length;
      
      stats.colorAccuracy = `${correctColor}/4`;
      
      if (correctColor < 2) {
        warnings.push(`Renk filtresi zayıf: ${correctColor}/4 ürün ${expectations.colorFilter}`);
      }
    }

    // 5. CHECK KEYWORD INCLUSION
    if (expectations.mustInclude && products.length > 0) {
      const top4 = products.slice(0, 4);
      
      for (const keyword of expectations.mustInclude) {
        const matchCount = top4.filter(p => {
          const searchText = `${p.title} ${p.productType || ''} ${p.description || ''}`.toLowerCase();
          return searchText.includes(keyword.toLowerCase());
        }).length;
        
        if (matchCount < 2) {
          warnings.push(`'${keyword}' kelimesi sadece ${matchCount}/4 üründe`);
        }
      }
    }

    // 6. CHECK DIVERSITY (Brand diversity)
    if (products.length >= 4) {
      const top4 = products.slice(0, 4);
      const uniqueBrands = new Set(top4.map(p => p.brand)).size;
      stats.brandDiversity = `${uniqueBrands} marka`;
      
      if (uniqueBrands < 2) {
        warnings.push(`Düşük marka çeşitliliği: ${uniqueBrands} marka`);
      }
    }

    return {
      failureReasons: failures,
      warnings,
      stats,
    };
  }

  private printTestResult(testCase: TestCase, result: TestResult): void {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    const durationColor = result.duration < 100 ? '🟢' : result.duration < 300 ? '🟡' : '🔴';
    
    console.log(`\n${statusIcon} ${testCase.name}`);
    console.log(`   Query: "${testCase.query}"`);
    console.log(`   ${durationColor} Duration: ${result.duration}ms | Results: ${result.resultCount}`);
    
    if (Object.keys(result.analysis.stats).length > 0) {
      console.log(`   📊 Stats: ${JSON.stringify(result.analysis.stats)}`);
    }
    
    if (result.analysis.failureReasons.length > 0) {
      result.analysis.failureReasons.forEach(reason => {
        console.log(`   ❌ ${reason}`);
      });
    }
    
    if (result.analysis.warnings.length > 0) {
      result.analysis.warnings.forEach(warning => {
        console.log(`   ⚠️  ${warning}`);
      });
    }
    
    if (result.topProducts.length > 0) {
      console.log(`   🏆 Top 4:`);
      result.topProducts.forEach((p, i) => {
        console.log(`      ${i + 1}. [${p.brand}] ${p.title.substring(0, 50)}... (${p.size || 'N/A'})`);
      });
    }
  }
}

interface TestResult {
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  resultCount: number;
  analysis: ResultAnalysis;
  topProducts: Product[];
}

interface ResultAnalysis {
  failureReasons: string[];
  warnings: string[];
  stats: Record<string, any>;
}

// RUN TESTS
async function main() {
  const tester = new SearchQualityTester();
  await tester.initialize(); // Load products first
  await tester.runAllTests();
}

main().catch(console.error);
