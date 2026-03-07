import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { FlightFeed, Flight } from '../../../shared/types';
import { CacheService } from './cacheService';

export class FeedParserService {
  constructor(private cacheService: CacheService) {}

  async parseFeed(siteId: string, siteName: string, feedUrl: string): Promise<FlightFeed> {
    try {
      console.log(`📡 Fetching flight feed for ${siteName} from ${feedUrl}`);
      
      // TODO: Implement real flight data feed parsing
      // For now, generate mock flight data
      const flights = this.generateMockFlights(siteId);
      
      const feed: FlightFeed = {
        siteId,
        siteName,
        feedUrl,
        lastUpdated: new Date(),
        flights,
      };

      // Cache the feed
      this.cacheService.setFeed(feed);
      
      console.log(`✅ Parsed ${flights.length} flights for ${siteName}`);
      return feed;
    } catch (error) {
      console.error(`❌ Error parsing feed for ${siteName}:`, error);
      throw error;
    }
  }

  private generateMockFlights(siteId: string): Flight[] {
    // Generate mock flight data for testing
    const routes = [
      { from: 'Istanbul', to: 'Antalya', fromCode: 'IST', toCode: 'AYT', country: 'Turkey' },
      { from: 'Istanbul', to: 'Izmir', fromCode: 'IST', toCode: 'ADB', country: 'Turkey' },
      { from: 'Ankara', to: 'Antalya', fromCode: 'ESB', toCode: 'AYT', country: 'Turkey' },
      { from: 'Istanbul', to: 'London', fromCode: 'IST', toCode: 'LHR', country: 'UK' },
      { from: 'Istanbul', to: 'Berlin', fromCode: 'IST', toCode: 'TXL', country: 'Germany' },
      { from: 'Antalya', to: 'Frankfurt', fromCode: 'AYT', toCode: 'FRA', country: 'Germany' },
    ];

    const flights: Flight[] = [];
    let flightId = 1;

    routes.forEach(route => {
      // Generate 3 flights per route
      for (let i = 0; i < 3; i++) {
        const basePrice = 500 + Math.random() * 1500;
        const isDirect = Math.random() > 0.3;
        
        flights.push({
          id: `${siteId}-flight-${flightId++}`,
          flightNumber: `XQ${1000 + flightId}`,
          airline: 'SunExpress',
          departure: {
            airport: route.fromCode,
            city: route.from,
            country: route.from.includes('Istanbul') || route.from.includes('Ankara') ? 'Turkey' : route.country,
            date: this.getRandomDate(),
            time: this.getRandomTime(),
          },
          arrival: {
            airport: route.toCode,
            city: route.to,
            country: route.country,
            date: this.getRandomDate(),
            time: this.getRandomTime(),
          },
          duration: isDirect ? '2h 30m' : '4h 15m',
          price: basePrice.toFixed(2),
          currency: 'EUR',
          availability: Math.random() > 0.1 ? 'available' : 'limited',
          stops: isDirect ? 0 : 1,
          stopCities: !isDirect ? ['Vienna'] : undefined,
          cabinClass: i === 0 ? 'economy' : i === 1 ? 'business' : 'economy',
          bookingLink: `https://sunexpress.com/book/${route.fromCode}-${route.toCode}`,
          fareType: i === 0 ? 'promo' : i === 1 ? 'flex' : 'standard',
          baggageAllowance: '20kg',
          amenities: ['WiFi', 'Meal'],
        });
      }
    });

    return flights;
  }

  private getRandomDate(): string {
    const days = Math.floor(Math.random() * 30) + 1;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private getRandomTime(): string {
    const hours = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
        description: getValue('description'),
        link: getValue('link'),
        imageLink: getValue('image_link', 'image_link') || getValue('image'),
        price: getValue('price'),
        salePrice: getValue('sale_price'),
        availability: getValue('availability') || 'in stock',
        brand: getValue('brand'),
        gtin: getValue('gtin'),
        mpn: getValue('mpn'),
        condition: getValue('condition') || 'new',
        googleProductCategory: getValue('google_product_category'),
        productType,
        color: getValue('color'),
        size: getValue('size'),
        gender, // Extracted from productType if not provided
      };

      // Handle additional images
      const additionalImages = getValue('additional_image_link');
      if (additionalImages) {
        product.additionalImageLinks = Array.isArray(additionalImages)
          ? additionalImages
          : [additionalImages];
      }

      return product;
    } catch (error) {
      console.error('Error parsing product:', error);
      return null;
    }
  }
}
