/*
 * Public transport data for the Transit Schedules page.
 *
 * - Train and metro stations and distances follow the real Mumbai lines.
 * - Timetables are generated from each line's first/last service and how often
 *   it runs at different times of day (the "bands" below), so they show a
 *   realistic pattern, not the official minute-by-minute timetable.
 * - Bus routes are sample routes around the campus, made for the demo.
 *
 * first/last: first and last service at a station
 * bands: run every `every` minutes until hour `until` (25 = 1 am next day)
 * minPerKm: average running time including stops
 */

const COMMON_RAIL_BANDS = [
  { until: 7, every: 8 },    // early morning
  { until: 11, every: 4 },   // morning rush
  { until: 17, every: 7 },   // afternoon
  { until: 21, every: 4 },   // evening rush
  { until: 25, every: 10 }   // late night
];

module.exports = {
  modes: {
    train: {
      label: 'Local Train',
      icon: 'bi-train-front',
      routes: [
        {
          id: 'central-slow',
          name: 'Central Line (Slow)',
          short: 'CR',
          color: '#dc2626',
          operator: 'Mumbai Suburban Railway',
          first: '04:15', last: '00:30', minPerKm: 1.9,
          bands: COMMON_RAIL_BANDS,
          stops: [
            ['CSMT', 0], ['Masjid', 1.2], ['Sandhurst Road', 2.2], ['Byculla', 3.6], ['Chinchpokli', 5.0],
            ['Currey Road', 6.1], ['Parel', 7.8], ['Dadar', 9.0], ['Matunga', 10.2], ['Sion', 11.9],
            ['Kurla', 15.3], ['Vidyavihar', 17.0], ['Ghatkopar', 18.6], ['Vikhroli', 22.1], ['Kanjurmarg', 24.5],
            ['Bhandup', 26.6], ['Nahur', 28.2], ['Mulund', 30.3], ['Thane', 33.6], ['Kalwa', 36.4],
            ['Mumbra', 40.3], ['Diva', 43.0], ['Kopar', 46.3], ['Dombivli', 48.5], ['Thakurli', 50.3], ['Kalyan', 53.5]
          ]
        },
        {
          id: 'western-slow',
          name: 'Western Line (Slow)',
          short: 'WR',
          color: '#2563eb',
          operator: 'Mumbai Suburban Railway',
          first: '04:15', last: '00:45', minPerKm: 1.8,
          bands: COMMON_RAIL_BANDS,
          stops: [
            ['Churchgate', 0], ['Marine Lines', 1.3], ['Charni Road', 2.2], ['Grant Road', 3.2], ['Mumbai Central', 4.4],
            ['Mahalaxmi', 6.0], ['Lower Parel', 7.3], ['Prabhadevi', 8.5], ['Dadar', 10.2], ['Matunga Road', 11.6],
            ['Mahim', 12.9], ['Bandra', 15.0], ['Khar Road', 16.1], ['Santacruz', 17.6], ['Vile Parle', 19.2],
            ['Andheri', 21.6], ['Jogeshwari', 23.5], ['Ram Mandir', 25.0], ['Goregaon', 26.5], ['Malad', 29.2],
            ['Kandivali', 31.4], ['Borivali', 33.9]
          ]
        }
      ]
    },
    metro: {
      label: 'Metro',
      icon: 'bi-train-lightrail-front',
      routes: [
        {
          id: 'metro-1',
          name: 'Metro Line 1',
          short: 'M1',
          color: '#0284c7',
          operator: 'Mumbai Metro One',
          first: '05:30', last: '23:30', minPerKm: 1.85,
          bands: [{ until: 8, every: 8 }, { until: 11, every: 4 }, { until: 17, every: 6 }, { until: 21, every: 4 }, { until: 24, every: 8 }],
          stops: [
            ['Versova', 0], ['D N Nagar', 1.0], ['Azad Nagar', 1.9], ['Andheri', 3.3], ['Western Express Highway', 4.5],
            ['Chakala', 5.2], ['Airport Road', 6.0], ['Marol Naka', 6.8], ['Saki Naka', 7.7], ['Asalpha', 8.8],
            ['Jagruti Nagar', 10.2], ['Ghatkopar', 11.4]
          ]
        }
      ]
    },
    bus: {
      label: 'Bus',
      icon: 'bi-bus-front',
      routes: [
        {
          id: 'bus-campus-a',
          name: 'Campus Shuttle A (sample)',
          short: 'A',
          color: '#d97706',
          operator: 'Sample route',
          first: '06:00', last: '22:30', minPerKm: 3.4,
          bands: [{ until: 8, every: 15 }, { until: 11, every: 8 }, { until: 17, every: 12 }, { until: 20, every: 8 }, { until: 23, every: 20 }],
          stops: [
            ['Ghatkopar Station (W)', 0], ['Vidyavihar Station (W)', 1.6], ['Somaiya College Gate', 2.3],
            ['Kirol Road', 2.9], ['Kurla Station (W)', 4.6]
          ]
        },
        {
          id: 'bus-lbs-b',
          name: 'LBS Marg Express B (sample)',
          short: 'B',
          color: '#9333ea',
          operator: 'Sample route',
          first: '05:45', last: '23:00', minPerKm: 3.2,
          bands: [{ until: 8, every: 12 }, { until: 11, every: 7 }, { until: 17, every: 10 }, { until: 20, every: 7 }, { until: 24, every: 15 }],
          stops: [
            ['Sion Circle', 0], ['Sion Station', 0.8], ['Kurla Depot', 3.2], ['Kamani Junction', 4.6],
            ['Ghatkopar Depot', 6.9], ['Vikhroli Station', 9.8], ['Kanjurmarg Station', 12.0]
          ]
        },
        {
          id: 'bus-andheri-c',
          name: 'Andheri Link C (sample)',
          short: 'C',
          color: '#db2777',
          operator: 'Sample route',
          first: '06:00', last: '22:00', minPerKm: 3.6,
          bands: [{ until: 8, every: 15 }, { until: 11, every: 9 }, { until: 17, every: 12 }, { until: 20, every: 9 }, { until: 23, every: 20 }],
          stops: [
            ['Andheri Station (E)', 0], ['Chakala', 1.6], ['Marol Naka', 3.0], ['Saki Naka', 4.3],
            ['Asalpha', 6.0], ['Ghatkopar Station (W)', 8.0]
          ]
        }
      ]
    }
  }
};
