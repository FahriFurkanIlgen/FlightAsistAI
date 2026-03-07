/**
 * GraphDB Service - Full Implementation
 * Neo4j graph database integration for flight relationships
 * Features:
 * - Flight nodes with properties (flight number, route, price, etc.)
 * - Airport nodes with city/country information
 * - Airline nodes for carrier grouping
 * - CONNECTS_TO relationships for route networks
 * - OPERATED_BY relationships for airline connections
 * - SAME_ROUTE relationships for alternative flights
 * - Graph-based flight recommendations
 */

import neo4j, { Driver, Session } from 'neo4j-driver';
import { Flight } from '../../../shared/types';

export class GraphService {
  private driver: Driver | null = null;
  private isConnected: boolean = false;

  constructor(
    private uri: string = process.env.NEO4J_URI || 'bolt://localhost:7687',
    private username: string = process.env.NEO4J_USERNAME || 'neo4j',
    private password: string = process.env.NEO4J_PASSWORD || 'password'
  ) {}

  /**
   * Connect to Neo4j database
   */
  async connect(): Promise<void> {
    try {
      this.driver = neo4j.driver(
        this.uri,
        neo4j.auth.basic(this.username, this.password),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        }
      );

      // Test connection
      await this.driver.verifyConnectivity();
      this.isConnected = true;
      console.log('[GraphService] ✅ Successfully connected to Neo4j');
    } catch (error) {
      console.error('[GraphService] ❌ Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  /**
   * Initialize database schema with indexes and constraints
   */
  async initializeSchema(): Promise<void> {
    if (!this.driver) {
      console.warn('[GraphService] Cannot initialize schema - not connected');
      return;
    }

    const session = this.driver.session();
    try {
      // Create constraints for Flight nodes
      await session.run(`
        CREATE CONSTRAINT flight_id IF NOT EXISTS
        FOR (f:Flight) REQUIRE f.id IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT flight_number IF NOT EXISTS
        FOR (f:Flight) REQUIRE f.flightNumber IS UNIQUE
      `);

      // Create constraints for Airport nodes
      await session.run(`
        CREATE CONSTRAINT airport_code IF NOT EXISTS
        FOR (a:Airport) REQUIRE a.code IS UNIQUE
      `);

      // Create constraints for Airline nodes
      await session.run(`
        CREATE CONSTRAINT airline_code IF NOT EXISTS
        FOR (a:Airline) REQUIRE a.code IS UNIQUE
      `);

      // Create indexes for common queries
      await session.run(`
        CREATE INDEX flight_route IF NOT EXISTS
        FOR (f:Flight) ON (f.departureCity, f.arrivalCity)
      `);

      await session.run(`
        CREATE INDEX flight_date IF NOT EXISTS
        FOR (f:Flight) ON (f.departureDate)
      `);

      await session.run(`
        CREATE INDEX flight_price IF NOT EXISTS
        FOR (f:Flight) ON (f.price)
      `);

      console.log('[GraphService] ✅ Schema initialized successfully');
    } catch (error) {
      console.error('[GraphService] ❌ Error initializing schema:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Import flights into graph database
   */
  async importFlights(flights: Flight[]): Promise<void> {
    if (!this.driver || flights.length === 0) {
      return;
    }

    const session = this.driver.session();
    try {
      // Clear existing data (optional - remove in production)
      await session.run('MATCH (n) DETACH DELETE n');

      // Import flights with batch processing
      const batchSize = 100;
      for (let i = 0; i < flights.length; i += batchSize) {
        const batch = flights.slice(i, i + batchSize);
        
        await session.run(`
          UNWIND $flights AS flight
          
          // Create Flight node
          MERGE (f:Flight {id: flight.id})
          SET f.flightNumber = flight.flightNumber,
              f.departureAirport = flight.departure.airport,
              f.departureCity = flight.departure.city,
              f.departureCountry = flight.departure.country,
              f.departureDate = flight.departure.date,
              f.departureTime = flight.departure.time,
              f.arrivalAirport = flight.arrival.airport,
              f.arrivalCity = flight.arrival.city,
              f.arrivalCountry = flight.arrival.country,
              f.arrivalDate = flight.arrival.date,
              f.arrivalTime = flight.arrival.time,
              f.stops = flight.stops,
              f.cabinClass = flight.cabinClass,
              f.price = flight.price,
              f.currency = flight.currency,
              f.airline = flight.airline,
              f.aircraftType = flight.aircraftType,
              f.duration = flight.duration,
              f.availability = flight.availability,
              f.bookingLink = flight.bookingLink
          
          // Create Departure Airport node
          MERGE (depAirport:Airport {code: flight.departure.airport})
          SET depAirport.city = flight.departure.city,
              depAirport.country = flight.departure.country
          
          // Create Arrival Airport node
          MERGE (arrAirport:Airport {code: flight.arrival.airport})
          SET arrAirport.city = flight.arrival.city,
              arrAirport.country = flight.arrival.country
          
          // Create Airline node
          MERGE (airline:Airline {code: flight.airline})
          SET airline.name = flight.airline
          
          // Create relationships
          MERGE (f)-[:DEPARTS_FROM]->(depAirport)
          MERGE (f)-[:ARRIVES_AT]->(arrAirport)
          MERGE (f)-[:OPERATED_BY]->(airline)
        `, { flights: batch });
      }

      // Create route relationships (connecting flights)
      await this.createRouteRelationships();

      // Create same-route relationships
      await this.createSameRouteRelationships();

      console.log(`[GraphService] ✅ Imported ${flights.length} flights successfully`);
    } catch (error) {
      console.error('[GraphService] ❌ Error importing flights:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create relationships between connecting flights
   */
  private async createRouteRelationships(): Promise<void> {
    if (!this.driver) return;

    const session = this.driver.session();
    try {
      // Connect flights where arrival airport matches departure airport
      await session.run(`
        MATCH (f1:Flight)-[:ARRIVES_AT]->(airport:Airport)
        MATCH (f2:Flight)-[:DEPARTS_FROM]->(airport)
        WHERE f1.id <> f2.id
          AND f1.arrivalDate <= f2.departureDate
          AND duration.between(
            datetime(f1.arrivalDate + 'T' + f1.arrivalTime),
            datetime(f2.departureDate + 'T' + f2.departureTime)
          ).hours >= 1
          AND duration.between(
            datetime(f1.arrivalDate + 'T' + f1.arrivalTime),
            datetime(f2.departureDate + 'T' + f2.departureTime)
          ).hours <= 24
        MERGE (f1)-[r:CONNECTS_TO]->(f2)
        SET r.layoverMinutes = duration.between(
          datetime(f1.arrivalDate + 'T' + f1.arrivalTime),
          datetime(f2.departureDate + 'T' + f2.departureTime)
        ).minutes
      `);

      console.log('[GraphService] ✅ Route relationships created');
    } catch (error) {
      console.error('[GraphService] ❌ Error creating route relationships:', error);
    } finally {
      await session.close();
    }
  }

  /**
   * Create relationships between flights on the same route
   */
  private async createSameRouteRelationships(): Promise<void> {
    if (!this.driver) return;

    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (f1:Flight), (f2:Flight)
        WHERE f1.id <> f2.id
          AND f1.departureCity = f2.departureCity
          AND f1.arrivalCity = f2.arrivalCity
          AND f1.departureDate = f2.departureDate
        MERGE (f1)-[:SAME_ROUTE]-(f2)
      `);

      console.log('[GraphService] ✅ Same-route relationships created');
    } catch (error) {
      console.error('[GraphService] ❌ Error creating same-route relationships:', error);
    } finally {
      await session.close();
    }
  }

  /**
   * Get flight recommendations based on graph relationships
   */
  async getFlightRecommendations(
    flightId: string,
    limit: number = 5
  ): Promise<Flight[]> {
    if (!this.driver) {
      return [];
    }

    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (f:Flight {id: $flightId})
        
        // Find similar flights (same route, different times/airlines)
        OPTIONAL MATCH (f)-[:SAME_ROUTE]-(similar:Flight)
        
        // Find connecting flights
        OPTIONAL MATCH (f)-[:CONNECTS_TO]->(connecting:Flight)
        
        // Find flights by same airline
        OPTIONAL MATCH (f)-[:OPERATED_BY]->(airline:Airline)<-[:OPERATED_BY]-(sameAirline:Flight)
        WHERE sameAirline.id <> f.id
        
        WITH collect(DISTINCT similar) + collect(DISTINCT connecting) + collect(DISTINCT sameAirline) AS recommendations
        UNWIND recommendations AS rec
        WHERE rec IS NOT NULL
        
        RETURN DISTINCT rec
        ORDER BY rec.price ASC
        LIMIT $limit
      `, { flightId, limit });

      return result.records.map(record => this.nodeToFlight(record.get('rec')));
    } catch (error) {
      console.error('[GraphService] ❌ Error getting recommendations:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Find connecting flights between two cities
   */
  async getConnectingFlights(
    fromCity: string,
    toCity: string,
    maxStops: number = 1
  ): Promise<Array<Flight[]>> {
    if (!this.driver) {
      return [];
    }

    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH path = (f1:Flight)-[:CONNECTS_TO*1..$maxStops]->(f2:Flight)
        WHERE f1.departureCity = $fromCity
          AND f2.arrivalCity = $toCity
        WITH path, 
             [node IN nodes(path) | node] AS flights,
             reduce(totalPrice = 0, node IN nodes(path) | totalPrice + node.price) AS totalPrice
        RETURN flights, totalPrice
        ORDER BY totalPrice ASC
        LIMIT 10
      `, { fromCity, toCity, maxStops });

      return result.records.map(record => 
        record.get('flights').map((node: any) => this.nodeToFlight(node))
      );
    } catch (error) {
      console.error('[GraphService] ❌ Error finding connecting flights:', error);
      return [];
    } finally {
      await session.close();
    }
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{ totalFlights: number; totalRelationships: number }> {
    if (!this.driver) {
      return { totalFlights: 0, totalRelationships: 0 };
    }

    const session = this.driver.session();
    try {
      const flightCount = await session.run('MATCH (f:Flight) RETURN count(f) AS count');
      const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) AS count');

      return {
        totalFlights: flightCount.records[0]?.get('count').toNumber() || 0,
        totalRelationships: relCount.records[0]?.get('count').toNumber() || 0,
      };
    } catch (error) {
      console.error('[GraphService] ❌ Error getting statistics:', error);
      return { totalFlights: 0, totalRelationships: 0 };
    } finally {
      await session.close();
    }
  }

  /**
   * Convert Neo4j node to Flight object
   */
  private nodeToFlight(node: any): Flight {
    const props = node.properties;
    return {
      id: props.id,
      flightNumber: props.flightNumber,
      departure: {
        airport: props.departureAirport,
        city: props.departureCity,
        country: props.departureCountry,
        date: props.departureDate,
        time: props.departureTime,
      },
      arrival: {
        airport: props.arrivalAirport,
        city: props.arrivalCity,
        country: props.arrivalCountry,
        date: props.arrivalDate,
        time: props.arrivalTime,
      },
      stops: props.stops,
      cabinClass: props.cabinClass,
      price: props.price,
      currency: props.currency,
      airline: props.airline,
      aircraftType: props.aircraftType,
      duration: props.duration,
      availability: props.availability || 'available',
      bookingLink: props.bookingLink || '#',
    };
  }

  /**
   * Check if service is connected
   */
  isServiceConnected(): boolean {
    return this.isConnected && this.driver !== null;
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
      this.isConnected = false;
      console.log('[GraphService] Disconnected from Neo4j');
    }
  }
}

// Singleton instance
export const graphService = new GraphService();
